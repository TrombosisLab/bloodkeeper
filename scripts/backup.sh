#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/.."
  pwd
)"

OUTPUT_DIR="${BLOODKEEPER_BACKUP_DIR:-$ROOT/backups}"
QUIET="false"

usage() {
  cat <<'EOF'
Uso:
  ./scripts/backup.sh
  ./scripts/backup.sh --output-dir RUTA
  ./scripts/backup.sh --quiet

Crea una copia PostgreSQL en formato custom, su checksum SHA-256 y
metadatos no sensibles.
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
    --output-dir)
      test "$#" -ge 2 ||
        die "Falta la ruta de destino."

      OUTPUT_DIR="$2"
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

test -n "$database" ||
  die "No se pudo resolver POSTGRES_DB."

test -n "$username" ||
  die "No se pudo resolver POSTGRES_USER."

mkdir -p "$OUTPUT_DIR"
chmod 700 "$OUTPUT_DIR" 2>/dev/null || true
umask 077

stamp="$(date -u +%Y%m%dT%H%M%SZ)"
base="bloodkeeper_${database}_${stamp}"
archive="$OUTPUT_DIR/$base.dump"
partial="$archive.partial.$$"
checksum="$archive.sha256"
metadata="$archive.meta"

cleanup() {
  rm -f "$partial"
}

trap cleanup EXIT

test ! -e "$archive" ||
  die "La copia ya existe: $archive"

docker exec \
  v5r-postgres \
  pg_dump \
  --username="$username" \
  --dbname="$database" \
  --format=custom \
  --compress=6 \
  --no-owner \
  --no-privileges \
  > "$partial"

test -s "$partial" ||
  die "pg_dump generó un archivo vacío."

docker exec -i \
  v5r-postgres \
  pg_restore \
  --list \
  < "$partial" \
  >/dev/null

mv "$partial" "$archive"

(
  cd "$OUTPUT_DIR"
  sha256sum "$(basename "$archive")" \
    > "$(basename "$checksum")"
)

cat > "$metadata" <<EOF
created_utc=$stamp
database=$database
format=postgresql_custom
git_head=$(git rev-parse HEAD 2>/dev/null || printf 'unknown')
compose_project=$(basename "$ROOT")
EOF

chmod 600 \
  "$archive" \
  "$checksum" \
  "$metadata"

if [ "$QUIET" != "true" ]; then
  echo "✓ Copia PostgreSQL creada"
  echo "✓ Archivo verificado con pg_restore --list"
  echo "✓ SHA-256 y metadatos generados"
  du -h "$archive"
fi

printf '%s\n' "$archive"
