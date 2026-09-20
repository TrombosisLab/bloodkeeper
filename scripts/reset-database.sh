#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$({ cd "$(dirname "${BASH_SOURCE[0]}")/.."; pwd; })"
BACKUP_DIR="${BLOODKEEPER_RESET_BACKUP_DIR:-$ROOT/backups/reset-safety}"
CONFIRMED="false"
RESET_STARTED="false"
RESTORE_ATTEMPTED="false"
ARCHIVE=""

usage() {
  cat <<'EOF'
Uso:
  ./scripts/reset-database.sh --confirm

Restablece la base de datos actual, conserva el repositorio y los volúmenes
de copias, vuelve a aplicar las migraciones y reinicia la aplicación.

Antes de borrar crea una copia de seguridad en:
  $BLOODKEEPER_RESET_BACKUP_DIR
  o, por defecto, backups/reset-safety/
EOF
}

die() {
  printf 'ERROR: %s\n' "$*" >&2
  return 1
}

container_environment_value() {
  local key="$1"
  local entry

  while IFS= read -r entry; do
    case "$entry" in
      "$key="*)
        printf '%s\n' "${entry#*=}"
        return 0
        ;;
    esac
  done < <(
    docker inspect \
      --format='{{range .Config.Env}}{{println .}}{{end}}' \
      v5r-postgres
  )

  return 1
}

wait_for_postgres() {
  local attempts=60
  local state=""

  while [ "$attempts" -gt 0 ]; do
    state="$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' v5r-postgres 2>/dev/null || true)"
    case "$state" in
      healthy) return 0 ;;
      unhealthy|exited|dead) die "PostgreSQL está en estado $state." ;;
    esac
    sleep 2
    attempts=$((attempts - 1))
  done

  die 'PostgreSQL no alcanzó un estado saludable.'
}

rollback_after_failure() {
  local code="$1"

  if [ "$code" -eq 0 ] || [ "$RESET_STARTED" != 'true' ] || [ "$RESTORE_ATTEMPTED" = 'true' ] || [ -z "$ARCHIVE" ] || [ ! -s "$ARCHIVE" ]; then
    return "$code"
  fi

  RESTORE_ATTEMPTED="true"
  printf '\n[ROLLBACK] La limpieza falló; intentando restaurar la copia previa...\n' >&2
  docker compose stop web api backup-worker backup-scheduler >/dev/null 2>&1 || true
  if "$ROOT/scripts/restore.sh" --apply "$ARCHIVE" --confirm; then
    printf '[ROLLBACK] Se restauró la base de datos previa.\n' >&2
  else
    printf '[ROLLBACK] No se pudo restaurar automáticamente. Conserva esta copia: %s\n' "$ARCHIVE" >&2
  fi

  docker compose up -d backup-init backup-worker backup-scheduler >/dev/null 2>&1 || true
  docker compose up -d api web >/dev/null 2>&1 || true
  return "$code"
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --confirm)
      CONFIRMED="true"
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

[ "$CONFIRMED" = 'true' ] || {
  usage
  die 'La limpieza requiere --confirm.'
}

cd "$ROOT"
docker compose config --quiet

health="$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' v5r-postgres 2>/dev/null || true)"
[ "$health" = 'healthy' ] || die 'PostgreSQL no está saludable.'

database="$(container_environment_value POSTGRES_DB)"
username="$(container_environment_value POSTGRES_USER)"

case "$database:$username" in
  ''|*[!A-Za-z0-9_:]*) die 'La configuración de base de datos contiene caracteres no admitidos.' ;;
esac

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR" 2>/dev/null || true

printf 'BLOODKEEPER — LIMPIEZA CONTROLADA DE LA BASE DE DATOS\n'
printf 'Repositorio: %s\n' "$ROOT"
printf 'Base de datos: %s\n' "$database"
printf 'Copia de seguridad: %s\n' "$BACKUP_DIR"
printf 'Se conservarán el repositorio y los volúmenes de copias.\n\n'

"$ROOT/scripts/backup.sh" --output-dir "$BACKUP_DIR"
ARCHIVE="$(find "$BACKUP_DIR" -maxdepth 1 -type f -name "bloodkeeper_${database}_*.dump" -printf '%T@ %p\n' | sort -nr | head -1 | cut -d' ' -f2-)"
[ -s "$ARCHIVE" ] || die 'No se pudo localizar la copia de seguridad previa.'

trap 'code=$?; rollback_after_failure "$code"; exit "$code"' EXIT

printf '\n[1/4] Deteniendo servicios que usan la base de datos...\n'
docker compose stop web api backup-worker backup-scheduler
RESET_STARTED="true"

printf '[2/4] Eliminando y recreando la base vacía...\n'
docker compose exec -T postgres psql \
  --username="$username" \
  --dbname=postgres \
  -v ON_ERROR_STOP=1 \
  -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$database' AND pid <> pg_backend_pid();" \
  -c "DROP DATABASE IF EXISTS \"$database\";" \
  -c "CREATE DATABASE \"$database\" OWNER \"$username\";"

printf '[3/4] Aplicando migraciones desde cero...\n'
docker compose run --no-deps --rm -T api npx prisma migrate deploy

printf '[4/4] Levantando BloodKeeper...\n'
docker compose up -d backup-init backup-worker backup-scheduler
docker compose up -d api web
"$ROOT/scripts/restart.sh" --confirm

RESET_STARTED="false"
trap - EXIT

printf '\n✓ Base de datos limpia y migraciones aplicadas.\n'
printf '✓ Copia previa conservada en: %s\n' "$ARCHIVE"
printf 'Siguiente paso: ejecuta scripts/create-initial-admin.sh para crear la primera cuenta.\n'
