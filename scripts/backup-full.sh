#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/.."
  pwd
)"

OUTPUT_DIR="${BLOODKEEPER_FULL_BACKUP_DIR:-$HOME/bloodkeeper_backups/scheduled}"
MIRROR_DIR="${BLOODKEEPER_BACKUP_MIRROR_DIR:-}"
KEEP="7"
QUIET="false"
STAGE=""
PARTIAL=""
SERVICES_STOPPED="false"
LOCK_FD=""
STATUS_FILE="${BLOODKEEPER_BACKUP_STATUS_FILE:-$HOME/bloodkeeper_backups/status/backup-status.json}"
STATUS_TRACKING="false"
STATUS_SUCCESS="false"

usage() {
  cat <<'EOF'
Uso:
  ./scripts/backup-full.sh
  ./scripts/backup-full.sh --output-dir RUTA --keep 7
  ./scripts/backup-full.sh --mirror-dir RUTA
  ./scripts/backup-full.sh --status-file RUTA
  ./scripts/backup-full.sh --quiet

Crea una copia completa con:
- dump lógico PostgreSQL;
- snapshot detenido del volumen PostgreSQL;
- repositorio Git completo;
- árbol de trabajo y recursos no ignorados;
- configuración local, documentación y scripts;
- checksums y metadatos.

La captura del volumen provoca una parada breve y controlada.
EOF
}

die() {
  echo "ERROR: $*" >&2
  return 1
}

wait_for_health() {
  local container="$1"
  local attempts=90
  local state=""

  while [ "$attempts" -gt 0 ]; do
    state="$(
      docker inspect \
        --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' \
        "$container" \
        2>/dev/null || true
    )"

    case "$state" in
      healthy)
        return 0
        ;;
      unhealthy|exited|dead)
        die "$container está en estado $state."
        ;;
    esac

    sleep 2
    attempts=$((attempts - 1))
  done

  die "$container no alcanzó estado healthy."
}

restart_services() {
  docker compose up -d postgres
  wait_for_health v5r-postgres

  docker compose up -d api web
  wait_for_health v5r-api
  wait_for_health v5r-web

  SERVICES_STOPPED="false"
}

write_backup_status() {
  local result="$1"
  local status_dir=""
  local temporary=""
  local run_at=""
  local latest=""
  local created=""
  local success_at_json="null"
  local archive_name_json="null"
  local size_bytes="0"
  local integrity="unknown"
  local error_json="null"

  status_dir="$(dirname "$STATUS_FILE")"
  mkdir -p "$status_dir" || return 1
  chmod 755 "$status_dir" 2>/dev/null || true
  run_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

  if [ "$result" = "ok" ] && [ -s "${archive:-}" ]; then
    latest="$archive"
  else
    latest="$(
      find "$OUTPUT_DIR" -maxdepth 1 -type f -name 'bloodkeeper_full_*.tar.gz' -printf '%T@ %p\n' 2>/dev/null |
      sort -nr | head -1 | cut -d' ' -f2-
    )"
  fi

  if [ -n "$latest" ] && [ -s "$latest" ]; then
    local archive_name=""
    archive_name="$(basename "$latest")"
    case "$archive_name" in
      bloodkeeper_full_[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]T[0-9][0-9][0-9][0-9][0-9][0-9]Z.tar.gz)
        archive_name_json="\"$archive_name\""
        size_bytes="$(stat -c '%s' "$latest" 2>/dev/null || printf '0')"
        ;;
      *) latest="" ;;
    esac
  fi

  if [ -n "$latest" ] && [ -f "$latest.meta" ]; then
    created="$(sed -n 's/^created_utc=//p' "$latest.meta" | head -1)"
    case "$created" in
      [0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]T[0-9][0-9][0-9][0-9][0-9][0-9]Z)
        success_at_json="\"${created:0:4}-${created:4:2}-${created:6:2}T${created:9:2}:${created:11:2}:${created:13:2}Z\""
        ;;
    esac
  fi

  if [ -n "$latest" ] && [ -f "$latest.sha256" ]; then
    if (cd "$(dirname "$latest")" && sha256sum -c "$(basename "$latest.sha256")" >/dev/null 2>&1); then
      integrity="ok"
    else
      integrity="failed"
    fi
  fi

  if [ "$result" = "error" ]; then
    error_json='"La última ejecución de backup no terminó correctamente."'
  fi

  temporary="$STATUS_FILE.tmp.$$"
  cat > "$temporary" <<EOF
{
  "status": "$result",
  "lastRunAt": "$run_at",
  "lastSuccessfulBackupAt": $success_at_json,
  "archiveName": $archive_name_json,
  "sizeBytes": $size_bytes,
  "integrity": "$integrity",
  "error": $error_json
}
EOF
  chmod 644 "$temporary" || { rm -f "$temporary"; return 1; }
  mv -f "$temporary" "$STATUS_FILE" || { rm -f "$temporary"; return 1; }
  return 0
}

cleanup() {
  local code="$?"

  set +e

  if [ "$SERVICES_STOPPED" = "true" ]; then
    echo "Recuperando servicios después de una interrupción..." >&2
    restart_services >/dev/null 2>&1 || true
  fi

  if [ -n "$STAGE" ] && [ -d "$STAGE" ]; then
    rm -rf "$STAGE"
  fi

  if [ -n "$PARTIAL" ]; then
    rm -f "$PARTIAL"
  fi

  if [ "$STATUS_TRACKING" = "true" ] && [ "$STATUS_SUCCESS" != "true" ] && [ "$code" -ne 0 ]; then
    write_backup_status "error" >/dev/null 2>&1 || true
  fi

  return "$code"
}

trap cleanup EXIT

rotate_sets() {
  local directory="$1"
  local keep="$2"
  local index=0
  local archive=""

  mapfile -t archives < <(
    find "$directory" \
      -maxdepth 1 \
      -type f \
      -name 'bloodkeeper_full_*.tar.gz' \
      -printf '%f\n' |
      sort -r
  )

  for archive in "${archives[@]}"; do
    index=$((index + 1))

    if [ "$index" -gt "$keep" ]; then
      rm -f \
        "$directory/$archive" \
        "$directory/$archive.sha256" \
        "$directory/$archive.meta"
    fi
  done
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --output-dir)
      test "$#" -ge 2 ||
        die "Falta la ruta de destino."

      OUTPUT_DIR="$2"
      shift 2
      ;;
    --mirror-dir)
      test "$#" -ge 2 ||
        die "Falta la ruta del espejo."

      MIRROR_DIR="$2"
      shift 2
      ;;
    --keep)
      test "$#" -ge 2 ||
        die "Falta el número de copias."

      KEEP="$2"
      shift 2
      ;;
    --status-file)
      test "$#" -ge 2 || die "Falta la ruta del estado."
      STATUS_FILE="$2"
      shift 2
      ;;
    --quiet)
      QUIET="true"
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      usage
      die "Argumento no reconocido: $1"
      ;;
  esac
done

case "$KEEP" in
  ''|*[!0-9]*)
    die "--keep debe ser un entero positivo."
    ;;
esac

test "$KEEP" -ge 1 ||
  die "--keep debe ser al menos 1."

case "$STATUS_FILE" in
  *[[:space:]]*) die "La ruta de estado no puede contener espacios." ;;
esac

cd "$ROOT"

docker compose config --quiet

for container in \
  v5r-postgres \
  v5r-api \
  v5r-web
do
  wait_for_health "$container"
done

test -f .env ||
  die "Falta .env."

mkdir -p "$OUTPUT_DIR"
chmod 700 "$OUTPUT_DIR" 2>/dev/null || true
umask 077

exec {LOCK_FD}>"$OUTPUT_DIR/.backup-full.lock"

flock -n "$LOCK_FD" ||
  die "Ya existe otra copia completa en ejecución."

STATUS_TRACKING="true"

stamp="$(date -u +%Y%m%dT%H%M%SZ)"
base="bloodkeeper_full_${stamp}"
archive="$OUTPUT_DIR/$base.tar.gz"
PARTIAL="$archive.partial.$$"
checksum="$archive.sha256"
metadata="$archive.meta"

test ! -e "$archive" ||
  die "La copia ya existe: $archive"

STAGE="$(
  mktemp -d "$OUTPUT_DIR/.${base}.stage.XXXXXX"
)"

mkdir -p \
  "$STAGE/configuration/apps/api" \
  "$STAGE/configuration/apps/web" \
  "$STAGE/database" \
  "$STAGE/repository" \
  "$STAGE/volume"

database_archive="$(
  "$ROOT/scripts/backup.sh" \
    --output-dir "$STAGE/database" \
    --quiet |
  tail -n 1
)"

test -s "$database_archive"
test -s "$database_archive.sha256"
test -s "$database_archive.meta"

cp -a .env "$STAGE/configuration/.env"
chmod 600 "$STAGE/configuration/.env"

cp -a \
  .env.example \
  compose.yaml \
  "$STAGE/configuration/"

cp -a \
  apps/api/Dockerfile \
  "$STAGE/configuration/apps/api/Dockerfile"

cp -a \
  apps/api/.dockerignore \
  "$STAGE/configuration/apps/api/.dockerignore"

cp -a \
  apps/web/Dockerfile \
  "$STAGE/configuration/apps/web/Dockerfile"

cp -a \
  apps/web/.dockerignore \
  "$STAGE/configuration/apps/web/.dockerignore"

git bundle create \
  "$STAGE/repository/repository.bundle" \
  --all

git bundle verify \
  "$STAGE/repository/repository.bundle" \
  >/dev/null

clone_check="$STAGE/.clone-check"

git clone \
  --quiet \
  "$STAGE/repository/repository.bundle" \
  "$clone_check"

rm -rf "$clone_check"

git ls-files \
  -z \
  --cached \
  --others \
  --exclude-standard |
  tar \
    --null \
    --files-from=- \
    --create \
    --gzip \
    --file="$STAGE/repository/working-tree.tar.gz"

git status \
  --short \
  --branch \
  > "$STAGE/repository/git-status.txt"

git stash list \
  > "$STAGE/repository/stash-list.txt"

volume_name="$(
  docker inspect \
    --format='{{range .Mounts}}{{if eq .Destination "/var/lib/postgresql/data"}}{{.Name}}{{end}}{{end}}' \
    v5r-postgres
)"

test -n "$volume_name" ||
  die "No se pudo resolver el volumen PostgreSQL."

SERVICES_STOPPED="true"
docker compose stop web api
docker compose stop postgres

docker run \
  --rm \
  --user 0:0 \
  --volume "$volume_name:/source:ro" \
  --volume "$STAGE/volume:/backup" \
  postgres:17-alpine \
  sh -lc '
    set -eu
    cd /source
    tar -czf /backup/postgres-data.tar.gz .
  '

test -s "$STAGE/volume/postgres-data.tar.gz"

restart_services
"$ROOT/scripts/check.sh" >/dev/null

cat > "$STAGE/MANIFEST.env" <<EOF
format=bloodkeeper_full_v1
created_utc=$stamp
git_head=$(git rev-parse HEAD)
git_branch=$(git branch --show-current)
compose_project=$(basename "$ROOT")
postgres_volume=$volume_name
database_dump=$(basename "$database_archive")
retention_sets=$KEEP
EOF

(
  cd "$STAGE"

  find . \
    -type f \
    ! -name SHA256SUMS \
    -print0 |
    sort -z |
    xargs -0 sha256sum \
    > SHA256SUMS

  sha256sum -c SHA256SUMS \
    >/dev/null
)

tar \
  --directory "$STAGE" \
  --create \
  --gzip \
  --file "$PARTIAL" \
  .

test -s "$PARTIAL"

tar -tzf "$PARTIAL" \
  >/dev/null

mv "$PARTIAL" "$archive"
PARTIAL=""

(
  cd "$OUTPUT_DIR"

  sha256sum "$(basename "$archive")" \
    > "$(basename "$checksum")"
)

cat > "$metadata" <<EOF
created_utc=$stamp
format=bloodkeeper_full_v1
git_head=$(git rev-parse HEAD)
git_branch=$(git branch --show-current)
postgres_volume=$volume_name
archive=$(basename "$archive")
EOF

chmod 600 \
  "$archive" \
  "$checksum" \
  "$metadata"

rotate_sets "$OUTPUT_DIR" "$KEEP"

if [ -n "$MIRROR_DIR" ]; then
  mkdir -p "$MIRROR_DIR"
  chmod 700 "$MIRROR_DIR" 2>/dev/null || true

  cp -a \
    "$archive" \
    "$checksum" \
    "$metadata" \
    "$MIRROR_DIR/"

  (
    cd "$MIRROR_DIR"
    sha256sum -c "$(basename "$checksum")" \
      >/dev/null
  )

  rotate_sets "$MIRROR_DIR" "$KEEP"
fi

write_backup_status "ok"
STATUS_SUCCESS="true"

if [ "$QUIET" != "true" ]; then
  echo "✓ Dump PostgreSQL"
  echo "✓ Snapshot del volumen Docker"
  echo "✓ Repositorio, configuración, documentación, scripts y recursos"
  echo "✓ Checksums y metadatos"
  echo "✓ Servicios restaurados y saludables"
  echo "✓ Retención: $KEEP conjuntos"
  du -h "$archive"

  if [ -n "$MIRROR_DIR" ]; then
    echo "✓ Espejo verificado: $MIRROR_DIR"
  fi
fi

printf '%s\n' "$archive"
