#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/.."
  pwd
)"

SERVICE="all"
LINES="100"
FOLLOW="false"

usage() {
  cat <<'EOF'
Uso:
  ./scripts/logs.sh
  ./scripts/logs.sh [all|postgres|api|web] [--lines N] [--follow]

Ejemplos:
  ./scripts/logs.sh
  ./scripts/logs.sh api --lines 200
  ./scripts/logs.sh postgres --follow
EOF
}

die() {
  echo "ERROR: $*" >&2
  return 1
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    all|postgres|api|web)
      SERVICE="$1"
      shift
      ;;
    --lines)
      test "$#" -ge 2 ||
        die "Falta el número de líneas."

      LINES="$2"
      shift 2
      ;;
    --follow|-f)
      FOLLOW="true"
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

case "$LINES" in
  ''|*[!0-9]*)
    die "--lines debe ser un entero positivo."
    ;;
esac

test "$LINES" -gt 0 ||
  die "--lines debe ser mayor que cero."

cd "$ROOT"

docker compose config --quiet

args=(
  logs
  --no-color
  --tail="$LINES"
)

if [ "$FOLLOW" = "true" ]; then
  args+=(--follow)
fi

if [ "$SERVICE" = "all" ]; then
  docker compose "${args[@]}"
else
  docker compose "${args[@]}" "$SERVICE"
fi
