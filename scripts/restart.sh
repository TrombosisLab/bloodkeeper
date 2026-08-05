#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/.."
  pwd
)"

usage() {
  cat <<'EOF'
Uso:
  ./scripts/restart.sh
  ./scripts/restart.sh --help

Reinicia PostgreSQL, API y web de forma controlada, espera sus health
checks y ejecuta la comprobación operativa final.
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
        echo "✓ $container: healthy"
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

case "${1:-}" in
  "")
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

cd "$ROOT"

docker compose config --quiet

echo "============================================================"
echo "BLOODKEEPER — REINICIO CONTROLADO"
echo "============================================================"

for service in postgres api web; do
  if [ -z "$(docker compose ps -a -q "$service")" ]; then
    echo "Creando el contenedor ausente: $service"
    docker compose up -d "$service"
  fi
done

echo
echo "Reiniciando PostgreSQL..."
docker compose restart postgres
wait_for_health v5r-postgres

echo
echo "Reiniciando API y web..."
docker compose restart api web
wait_for_health v5r-api
wait_for_health v5r-web

echo
./scripts/check.sh

echo
echo "REINICIO COMPLETADO CORRECTAMENTE"
