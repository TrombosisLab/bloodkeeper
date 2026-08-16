#!/bin/sh
set -u

REQUEST_DIR="${BACKUP_REQUEST_DIR:-/requests}"
STATUS_DIR="${BACKUP_STATUS_DIR:-/status}"
ARCHIVE_DIR="${BACKUP_ARCHIVE_DIR:-/backups}"
KEEP="${BACKUP_KEEP:-7}"
REQUEST_FILE="$REQUEST_DIR/manual-backup.request"
PROCESSING_FILE="$REQUEST_DIR/manual-backup.processing"
STATUS_FILE="$STATUS_DIR/backup-status.json"

log_audit() {
  printf 'AUDIT action=backup.manual.execute outcome=%s channel=docker-worker\n' "$1"
}

valid_keep() {
  case "$KEEP" in
    ''|*[!0-9]*) return 1 ;;
  esac
  [ "$KEEP" -ge 1 ]
}

write_status() {
  result="$1"
  run_at="$2"
  success_at="$3"
  archive_name="$4"
  size_bytes="$5"
  integrity="$6"
  error_message="$7"
  temporary="$STATUS_FILE.tmp.$$"

  if [ -n "$success_at" ]; then success_json="\"$success_at\""; else success_json='null'; fi
  if [ -n "$archive_name" ]; then archive_json="\"$archive_name\""; else archive_json='null'; fi
  if [ -n "$error_message" ]; then error_json="\"$error_message\""; else error_json='null'; fi

  cat > "$temporary" <<EOF
{
  "status": "$result",
  "lastRunAt": "$run_at",
  "lastSuccessfulBackupAt": $success_json,
  "archiveName": $archive_json,
  "sizeBytes": $size_bytes,
  "integrity": "$integrity",
  "error": $error_json
}
EOF
  chmod 600 "$temporary"
  mv -f "$temporary" "$STATUS_FILE"
}

rotate_archives() {
  count=0
  find "$ARCHIVE_DIR" -maxdepth 1 -type f -name 'bloodkeeper_full_*.tar.gz' | sort -r |
  while IFS= read -r archive; do
    [ -n "$archive" ] || continue
    count=$((count + 1))
    if [ "$count" -gt "$KEEP" ]; then
      rm -f -- "$archive" "$archive.sha256" "$archive.meta"
    fi
  done
}

run_backup() {
  stamp="$(date -u +%Y%m%dT%H%M%SZ)"
  iso_now="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  base="bloodkeeper_full_$stamp"
  archive="$ARCHIVE_DIR/$base.tar.gz"
  partial="$archive.partial.$$"
  stage="$(mktemp -d "$ARCHIVE_DIR/.${base}.stage.XXXXXX")" || return 1

  if ! pg_dump \
    --host="${PGHOST:-postgres}" \
    --port="${PGPORT:-5432}" \
    --username="${PGUSER:?PGUSER es obligatorio}" \
    --dbname="${PGDATABASE:?PGDATABASE es obligatorio}" \
    --format=custom \
    --compress=6 \
    --no-owner \
    --no-privileges \
    --file="$stage/database.dump"; then
    rm -rf -- "$stage" "$partial"
    return 1
  fi

  if ! pg_restore --list "$stage/database.dump" >/dev/null; then
    rm -rf -- "$stage" "$partial"
    return 1
  fi

  (
    cd "$stage" &&
    sha256sum database.dump > SHA256SUMS
  ) || {
    rm -rf -- "$stage" "$partial"
    return 1
  }

  cat > "$stage/MANIFEST.env" <<EOF
format=bloodkeeper_portable_database_v1
created_utc=$stamp
database=${PGDATABASE}
retention_sets=$KEEP
EOF

  tar -czf "$partial" -C "$stage" . || {
    rm -rf -- "$stage" "$partial"
    return 1
  }
  tar -tzf "$partial" >/dev/null || {
    rm -rf -- "$stage" "$partial"
    return 1
  }

  mv "$partial" "$archive" || {
    rm -rf -- "$stage" "$partial"
    return 1
  }
  rm -rf -- "$stage"

  (
    cd "$ARCHIVE_DIR" &&
    sha256sum "$base.tar.gz" > "$base.tar.gz.sha256"
  ) || return 1

  cat > "$archive.meta" <<EOF
created_utc=$stamp
format=bloodkeeper_portable_database_v1
archive=$base.tar.gz
EOF
  chmod 600 "$archive" "$archive.sha256" "$archive.meta"
  size_bytes="$(wc -c < "$archive" | tr -d '[:space:]')"
  rotate_archives
  write_status 'ok' "$iso_now" "$iso_now" "$base.tar.gz" "$size_bytes" 'ok' ''
  printf '%s\n' "$base.tar.gz"
}

consume_request() {
  [ -e "$REQUEST_FILE" ] || return 0

  if [ -L "$REQUEST_FILE" ] || [ ! -f "$REQUEST_FILE" ]; then
    rm -f -- "$REQUEST_FILE" 2>/dev/null || true
    now="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    write_status 'error' "$now" '' '' 0 'unknown' 'La solicitud de copia no es valida.'
    log_audit failure
    return 1
  fi

  if ! mv "$REQUEST_FILE" "$PROCESSING_FILE" 2>/dev/null; then
    return 0
  fi

  content="$(cat "$PROCESSING_FILE" 2>/dev/null || true)"
  rm -f -- "$PROCESSING_FILE"
  if [ "$content" != 'manual-backup' ]; then
    now="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    write_status 'error' "$now" '' '' 0 'unknown' 'La solicitud de copia no es valida.'
    log_audit failure
    return 1
  fi

  log_audit start
  if archive_name="$(run_backup)"; then
    log_audit success
    printf 'Copia portable completada: %s\n' "$archive_name"
    return 0
  fi

  now="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  write_status 'error' "$now" '' '' 0 'unknown' 'La copia portable no termino correctamente.'
  log_audit failure
  return 1
}

main() {
  valid_keep || {
    printf 'ERROR: BACKUP_KEEP debe ser un entero positivo.\n' >&2
    return 2
  }
  mkdir -p "$REQUEST_DIR" "$STATUS_DIR" "$ARCHIVE_DIR" || return 1
  umask 077
  : > /tmp/backup-worker.ready

  if [ "${BACKUP_WORKER_ONCE:-false}" = 'true' ]; then
    consume_request
    return $?
  fi

  printf 'Trabajador portable de copias preparado.\n'
  while :; do
    consume_request || true
    sleep 2
  done
}

main "$@"
