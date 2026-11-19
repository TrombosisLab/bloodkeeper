#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MODE=""
ARCHIVE=""
CONFIRMED=false
RESTORE_SUCCEEDED=false
OLD_RENAMED=false
TEMP_DATABASE=""
PREVIOUS_DATABASE=""
FAILED_DATABASE=""
DATABASE=""
USERNAME=""
PRE_RESTORE_BACKUP=""

usage() {
  cat <<'EOF'
Uso:
  ./scripts/restore-portable-backup.sh --verify COPIA.tar.gz
  ./scripts/restore-portable-backup.sh --apply COPIA.tar.gz --confirm

--verify restaura la copia en una base temporal y no sustituye la actual.
--apply prepara y valida la copia, guarda la base actual y pide escribir
RESTAURAR antes de sustituir los datos.
EOF
}
die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

while (($#)); do
  case "$1" in
    --verify|--apply)
      [[ -z "$MODE" ]] || die 'indica solo --verify o --apply.'
      MODE="${1#--}"; (($# >= 2)) || die 'falta la ruta de la copia.'
      ARCHIVE=$2; shift 2 ;;
    --confirm) CONFIRMED=true; shift ;;
    --help|-h) usage; exit 0 ;;
    *) usage; die "opción no reconocida: $1" ;;
  esac
done
[[ -n "$MODE" && -n "$ARCHIVE" ]] || { usage; exit 2; }
[[ -f "$ARCHIVE" && ! -L "$ARCHIVE" ]] || die 'la copia no existe o no es un archivo normal.'
ARCHIVE="$(cd "$(dirname "$ARCHIVE")" && printf '%s/%s\n' "$PWD" "$(basename "$ARCHIVE")")"
archive_name="$(basename "$ARCHIVE")"
[[ "$archive_name" =~ ^bloodkeeper_full_[0-9]{8}T[0-9]{6}Z\.tar\.gz$ ]] || die 'nombre de copia portable no reconocido.'

COMPOSE=("$ROOT/scripts/portable-compose.sh")
TEMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/bloodkeeper-restore.XXXXXX")"
cleanup() {
  local result=$?
  [[ -z "$PRE_RESTORE_BACKUP" ]] || rm -f -- "$PRE_RESTORE_BACKUP.partial"
  if [[ "$RESTORE_SUCCEEDED" != true && "$OLD_RENAMED" == true ]]; then
    printf '\nLa restauración no terminó; intentando recuperar la base anterior…\n' >&2
    "${COMPOSE[@]}" stop web api backup-worker backup-scheduler >/dev/null 2>&1 || true
    if database_exists "$DATABASE"; then
      if ! database_exists "$FAILED_DATABASE"; then
        psql_admin -c "ALTER DATABASE \"$DATABASE\" RENAME TO \"$FAILED_DATABASE\"" >/dev/null 2>&1 || true
      fi
    fi
    if database_exists "$PREVIOUS_DATABASE"; then
      psql_admin -c "ALTER DATABASE \"$PREVIOUS_DATABASE\" RENAME TO \"$DATABASE\"" >/dev/null 2>&1 || true
      printf 'La base anterior se conserva como %s.\n' "$DATABASE" >&2
    fi
    if database_exists "$FAILED_DATABASE"; then
      printf 'La base restaurada para diagnóstico se conserva como %s.\n' "$FAILED_DATABASE" >&2
    fi
    "${COMPOSE[@]}" up -d api web backup-worker backup-scheduler >/dev/null 2>&1 || true
  elif [[ -n "$TEMP_DATABASE" && -n "$DATABASE" && -n "$USERNAME" ]]; then
    drop_database "$TEMP_DATABASE" >/dev/null 2>&1 || true
  fi
  rm -rf -- "$TEMP_DIR"
  return "$result"
}
trap cleanup EXIT

[[ -x "$ROOT/scripts/portable-compose.sh" ]] || die 'no se encuentra el lanzador Docker portable.'
docker info >/dev/null 2>&1 || die 'Docker no está iniciado o el usuario no tiene acceso.'
"${COMPOSE[@]}" config --quiet

[[ -s "$ARCHIVE.sha256" ]] || die 'falta el archivo .sha256 junto a la copia.'
checksum_line="$(cat "$ARCHIVE.sha256")"
[[ "$(wc -l < "$ARCHIVE.sha256")" -eq 1 && "$checksum_line" =~ ^[0-9a-f]{64}[[:space:]][[:space:]]${archive_name}$ ]] || die 'formato del checksum exterior no válido.'
(cd "$(dirname "$ARCHIVE")" && sha256sum -c "$(basename "$ARCHIVE").sha256") || die 'el checksum exterior no coincide.'
manifest="$TEMP_DIR/MANIFEST.env"
tar -xOzf "$ARCHIVE" ./MANIFEST.env > "$manifest" 2>/dev/null || die 'el paquete está dañado o no contiene manifiesto.'
grep -qx 'format=bloodkeeper_portable_database_v1' "$manifest" || die 'formato de copia no reconocido.'
BACKUP_REVISION="$(awk -F= '$1 == "source_revision" { print $2; exit }' "$manifest")"
if [[ "$BACKUP_REVISION" =~ ^[0-9a-f]{40}$ ]] && git -C "$ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  CURRENT_REVISION="$(git -C "$ROOT" rev-parse HEAD)"
  git -C "$ROOT" merge-base --is-ancestor "$BACKUP_REVISION" "$CURRENT_REVISION" || die 'la copia procede de una versión posterior o distinta; usa primero el código compatible con esa copia.'
  if [[ "$BACKUP_REVISION" != "$CURRENT_REVISION" ]]; then
    printf 'La copia procede de %s y el servidor está en %s; se aplicarán migraciones hacia delante.\n' "$BACKUP_REVISION" "$CURRENT_REVISION"
  fi
fi
internal_checksum="$(tar -xOzf "$ARCHIVE" ./SHA256SUMS 2>/dev/null)" || die 'falta el checksum interno de la base de datos.'
[[ "$internal_checksum" =~ ^([0-9a-f]{64})[[:space:]][[:space:]]database\.dump$ ]] || die 'formato del checksum interno no válido.'
expected_dump_hash="${BASH_REMATCH[1]}"
actual_dump_hash="$(tar -xOzf "$ARCHIVE" ./database.dump 2>/dev/null | sha256sum | awk '{print $1}')" || die 'falta database.dump en el paquete.'
[[ "$actual_dump_hash" == "$expected_dump_hash" ]] || die 'el checksum interno de la base no coincide.'
DATABASE="$("${COMPOSE[@]}" exec -T postgres printenv POSTGRES_DB | tr -d '\r\n')"
USERNAME="$("${COMPOSE[@]}" exec -T postgres printenv POSTGRES_USER | tr -d '\r\n')"
[[ "$DATABASE" =~ ^[A-Za-z0-9_]+$ && "$USERNAME" =~ ^[A-Za-z0-9_]+$ ]] || die 'configuración de base o usuario no válida.'
stamp="$(date -u +%Y%m%d%H%M%S)_$$"
TEMP_DATABASE="bk_restore_${stamp}"
PREVIOUS_DATABASE="bk_previous_${stamp}"
FAILED_DATABASE="bk_failed_${stamp}"

psql_admin() {
  "${COMPOSE[@]}" exec -T postgres psql --username="$USERNAME" --dbname=postgres --no-psqlrc --set=ON_ERROR_STOP=1 "$@"
}
database_exists() {
  local name="$1"
  [[ -n "$name" ]] || return 1
  [[ "$(psql_admin --tuples-only --no-align --command="SELECT 1 FROM pg_database WHERE datname = '$name'" 2>/dev/null | tr -d '[:space:]')" == 1 ]]
}
create_database() { psql_admin --command="CREATE DATABASE \"$1\" OWNER \"$USERNAME\"" >/dev/null; }
drop_database() { psql_admin --command="DROP DATABASE IF EXISTS \"$1\" WITH (FORCE)" >/dev/null; }
validate_database() {
  local table_count migration_count
  table_count="$(psql_admin --dbname="$1" --tuples-only --no-align --command="SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'" | tr -d '[:space:]')"
  migration_count="$(psql_admin --dbname="$1" --tuples-only --no-align --command='SELECT COUNT(*) FROM "_prisma_migrations"' | tr -d '[:space:]')"
  [[ "$table_count" =~ ^[0-9]+$ && "$table_count" -gt 0 ]] || die 'la base restaurada no contiene tablas.'
  [[ "$migration_count" =~ ^[0-9]+$ && "$migration_count" -gt 0 ]] || die 'la base restaurada no contiene el historial de migraciones.'
  printf '✓ Tablas encontradas: %s; migraciones registradas: %s\n' "$table_count" "$migration_count"
}
"${COMPOSE[@]}" up -d --wait --wait-timeout 180 postgres || die 'PostgreSQL no está saludable.'
create_database "$TEMP_DATABASE"
tar -xOzf "$ARCHIVE" ./database.dump | "${COMPOSE[@]}" exec -T postgres pg_restore --username="$USERNAME" --dbname="$TEMP_DATABASE" --no-owner --no-privileges --exit-on-error || die 'no se pudo restaurar el dump temporal.'
validate_database "$TEMP_DATABASE"
if [[ "$MODE" == verify ]]; then
  drop_database "$TEMP_DATABASE"
  TEMP_DATABASE=""
  RESTORE_SUCCEEDED=true
  printf '✓ Copia válida: restaurada y comprobada en una base temporal; la base activa no se modificó.\n'
  exit 0
fi

[[ "$CONFIRMED" == true ]] || die '--apply requiere además --confirm.'
[[ -t 0 ]] || die 'la aplicación requiere una terminal interactiva para la confirmación final.'
printf '\nATENCIÓN: se sustituirán los datos de BloodKeeper en este servidor.\n'
printf 'Se guardará primero una copia local de la base actual. Escribe RESTAURAR para continuar: '
read -r answer
[[ "$answer" == RESTAURAR ]] || die 'operación cancelada; no se han cambiado los datos.'

mkdir -p "$ROOT/backups/pre-restore"
chmod 700 "$ROOT/backups" "$ROOT/backups/pre-restore" 2>/dev/null || true
PRE_RESTORE_BACKUP="$ROOT/backups/pre-restore/bloodkeeper-before-restore-${stamp}.dump"
"${COMPOSE[@]}" exec -T postgres pg_dump --username="$USERNAME" --dbname="$DATABASE" --format=custom --compress=6 --no-owner --no-privileges > "$PRE_RESTORE_BACKUP.partial"
[[ -s "$PRE_RESTORE_BACKUP.partial" ]] || die 'no se pudo crear la copia previa de seguridad.'
"${COMPOSE[@]}" exec -T postgres pg_restore --list < "$PRE_RESTORE_BACKUP.partial" >/dev/null || die 'la copia previa no superó la verificación.'
mv -- "$PRE_RESTORE_BACKUP.partial" "$PRE_RESTORE_BACKUP"
chmod 600 "$PRE_RESTORE_BACKUP"
sha256sum "$PRE_RESTORE_BACKUP" > "$PRE_RESTORE_BACKUP.sha256"
chmod 600 "$PRE_RESTORE_BACKUP.sha256"
printf '✓ Copia previa: %s\n' "$PRE_RESTORE_BACKUP"

"${COMPOSE[@]}" stop web api backup-worker backup-scheduler
psql_admin --command="SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DATABASE' AND pid <> pg_backend_pid()" >/dev/null
psql_admin --command="ALTER DATABASE \"$DATABASE\" RENAME TO \"$PREVIOUS_DATABASE\"" >/dev/null
OLD_RENAMED=true
psql_admin --command="ALTER DATABASE \"$TEMP_DATABASE\" RENAME TO \"$DATABASE\"" >/dev/null
TEMP_DATABASE=""

"${COMPOSE[@]}" run --rm --no-deps -T api npx prisma migrate deploy || die 'fallaron las migraciones; se recuperará la base anterior.'
"${COMPOSE[@]}" up -d api web backup-worker backup-scheduler || die 'no se pudieron iniciar los servicios restaurados.'

wait_healthy() {
  local service="$1" id state attempts=90
  while ((attempts > 0)); do
    id="$("${COMPOSE[@]}" ps -q "$service" 2>/dev/null || true)"
    if [[ -n "$id" ]]; then
      state="$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$id" 2>/dev/null || true)"
      [[ "$state" == healthy ]] && return 0
      [[ "$state" == unhealthy || "$state" == exited || "$state" == dead ]] && return 1
    fi
    sleep 2
    attempts=$((attempts - 1))
  done
  return 1
}
for service in postgres backup-worker api web backup-scheduler; do
  wait_healthy "$service" || die "$service no alcanzó estado saludable; se recuperará la base anterior."
done
health="$("${COMPOSE[@]}" exec -T web wget -qO- http://127.0.0.1:5173/api/health)" || die 'la verificación web/API falló; se recuperará la base anterior.'
grep -q '"status":"ok"' <<<"$health" && grep -q '"database":"ok"' <<<"$health" || die 'la aplicación no confirmó salud de base de datos; se recuperará la base anterior.'

drop_database "$PREVIOUS_DATABASE"
OLD_RENAMED=false
RESTORE_SUCCEEDED=true
printf '\n✓ Restauración completada y servicios verificados.\n'
printf 'Copia aplicada: %s\nCopia previa verificada: %s\n' "$ARCHIVE" "$PRE_RESTORE_BACKUP"
