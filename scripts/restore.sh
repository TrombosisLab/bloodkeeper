#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/.."
  pwd
)"

MODE=""
ARCHIVE=""
CONFIRMED="false"

usage() {
  cat <<'EOF'
Uso:
  ./scripts/restore.sh --verify ARCHIVO.dump
  ./scripts/restore.sh --apply ARCHIVO.dump --confirm

Modos:
  --verify  Restaura en una base temporal, valida y la elimina.
  --apply   Sustituye la base actual mediante intercambio seguro.
            Crea una copia previa y exige --confirm.
EOF
}

die() {
  echo "ERROR: $*" >&2
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

while [ "$#" -gt 0 ]; do
  case "$1" in
    --verify)
      MODE="verify"
      test "$#" -ge 2 ||
        die "Falta el archivo de backup."
      ARCHIVE="$2"
      shift 2
      ;;
    --apply)
      MODE="apply"
      test "$#" -ge 2 ||
        die "Falta el archivo de backup."
      ARCHIVE="$2"
      shift 2
      ;;
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

test -n "$MODE" ||
  die "Selecciona --verify o --apply."

test -f "$ARCHIVE" ||
  die "No existe el archivo: $ARCHIVE"

ARCHIVE="$(
  cd "$(dirname "$ARCHIVE")"
  printf '%s/%s\n' "$PWD" "$(basename "$ARCHIVE")"
)"

cd "$ROOT"

docker compose config --quiet

health="$(
  docker inspect \
    --format \
    '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' \
    v5r-postgres \
    2>/dev/null || true
)"

test "$health" = "healthy" ||
  die "PostgreSQL no está saludable."

database="$(
  container_environment_value POSTGRES_DB
)"

username="$(
  container_environment_value POSTGRES_USER
)"

case "$database" in
  ''|*[!A-Za-z0-9_]*)
    die "POSTGRES_DB contiene caracteres no admitidos."
    ;;
esac

case "$username" in
  ''|*[!A-Za-z0-9_]*)
    die "POSTGRES_USER contiene caracteres no admitidos."
    ;;
esac

checksum="$ARCHIVE.sha256"

if [ -f "$checksum" ]; then
  (
    cd "$(dirname "$ARCHIVE")"
    sha256sum -c "$(basename "$checksum")"
  )
else
  echo "AVISO: no existe checksum junto al archivo."
fi

docker exec -i \
  v5r-postgres \
  pg_restore \
  --list \
  < "$ARCHIVE" \
  >/dev/null

drop_database() {
  local name="$1"

  docker exec \
    v5r-postgres \
    dropdb \
    --username="$username" \
    --if-exists \
    "$name"
}

create_database() {
  local name="$1"

  docker exec \
    v5r-postgres \
    createdb \
    --username="$username" \
    --owner="$username" \
    "$name"
}

restore_database() {
  local name="$1"

  docker exec -i \
    v5r-postgres \
    pg_restore \
    --username="$username" \
    --dbname="$name" \
    --no-owner \
    --no-privileges \
    < "$ARCHIVE"
}

validate_database() {
  local name="$1"
  local table_count
  local migration_count

  table_count="$(
    docker exec \
      v5r-postgres \
      psql \
      --username="$username" \
      --dbname="$name" \
      --tuples-only \
      --no-align \
      --command="
        SELECT COUNT(*)
        FROM information_schema.tables
        WHERE table_schema = 'public';
      " |
      tr -d '[:space:]'
  )"

  test "${table_count:-0}" -gt 0 ||
    die "La base restaurada no contiene tablas públicas."

  migration_count="$(
    docker exec \
      v5r-postgres \
      psql \
      --username="$username" \
      --dbname="$name" \
      --tuples-only \
      --no-align \
      --command='SELECT COUNT(*) FROM "_prisma_migrations";' |
      tr -d '[:space:]'
  )"

  test "${migration_count:-0}" -gt 0 ||
    die "La base restaurada no contiene migraciones Prisma."

  echo "✓ Tablas públicas: $table_count"
  echo "✓ Migraciones Prisma: $migration_count"
}

wait_for_health() {
  local container="$1"
  local attempts=60

  while [ "$attempts" -gt 0 ]; do
    local state

    state="$(
      docker inspect \
        --format \
        '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' \
        "$container" \
        2>/dev/null || true
    )"

    if [ "$state" = "healthy" ]; then
      return 0
    fi

    sleep 2
    attempts=$((attempts - 1))
  done

  return 1
}

verify_backup() {
  local temporary
  temporary="bk_verify_$(date -u +%Y%m%d%H%M%S)_$$"

  cleanup_verify() {
    drop_database "$temporary" >/dev/null 2>&1 || true
  }

  trap cleanup_verify EXIT

  create_database "$temporary"
  restore_database "$temporary"
  validate_database "$temporary"
  drop_database "$temporary"

  trap - EXIT

  echo "✓ Backup restaurado y validado en base temporal"
  echo "✓ Base temporal eliminada"
}

apply_backup() {
  test "$CONFIRMED" = "true" ||
    die "--apply requiere --confirm."

  local stamp
  local staging
  local previous
  local failed
  local pre_restore_backup

  stamp="$(date -u +%Y%m%d%H%M%S)"
  staging="bk_stage_${stamp}_$$"
  previous="bk_previous_${stamp}_$$"
  failed="bk_failed_${stamp}_$$"

  pre_restore_backup="$(
    "$ROOT/scripts/backup.sh" \
      --output-dir "$ROOT/backups/pre-restore" \
      --quiet |
      tail -n 1
  )"

  echo "✓ Copia previa: $pre_restore_backup"

  create_database "$staging"
  restore_database "$staging"
  validate_database "$staging"

  docker compose stop web api

  docker exec \
    v5r-postgres \
    psql \
    --username="$username" \
    --dbname=postgres \
    --set=ON_ERROR_STOP=1 \
    --command="
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname IN ('$database', '$staging')
        AND pid <> pg_backend_pid();

      ALTER DATABASE \"$database\"
        RENAME TO \"$previous\";

      ALTER DATABASE \"$staging\"
        RENAME TO \"$database\";
    "

  docker compose up -d api web

  if wait_for_health v5r-api &&
     wait_for_health v5r-web &&
     "$ROOT/scripts/check.sh"
  then
    drop_database "$previous"
    echo "✓ Restauración aplicada"
    echo "✓ Servicios saludables"
    echo "✓ Base anterior eliminada después de validar"
    return
  fi

  echo "ERROR: la validación falló; restaurando la base anterior." >&2

  docker compose stop web api || true

  docker exec \
    v5r-postgres \
    psql \
    --username="$username" \
    --dbname=postgres \
    --set=ON_ERROR_STOP=1 \
    --command="
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname IN ('$database', '$previous')
        AND pid <> pg_backend_pid();

      ALTER DATABASE \"$database\"
        RENAME TO \"$failed\";

      ALTER DATABASE \"$previous\"
        RENAME TO \"$database\";
    "

  docker compose up -d api web
  wait_for_health v5r-api || true
  wait_for_health v5r-web || true
  drop_database "$failed" || true

  die "Se recuperó la base anterior. Revisa los registros."
}

case "$MODE" in
  verify)
    verify_backup
    ;;
  apply)
    apply_backup
    ;;
esac
