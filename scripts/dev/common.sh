#!/usr/bin/env bash
set -Eeuo pipefail

DEV_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$DEV_SCRIPT_DIR/../.." && pwd)"

cd "$REPO"

require_service() {
  local service="$1"

  if ! docker compose config --services | grep -Fxq "$service"; then
    echo "ERROR: el servicio Docker Compose '$service' no existe."
    exit 1
  fi
}

ensure_running() {
  local service="$1"
  local container_id

  container_id="$(docker compose ps -q "$service")"

  if [[ -z "$container_id" ]]; then
    echo "Iniciando servicio '$service'..."
    docker compose up -d "$service"
  fi
}

run_pnpm() {
  local service="$1"
  shift

  require_service "$service"
  ensure_running "$service"

  docker compose exec -T "$service" \
    sh -lc 'corepack pnpm "$@"' -- "$@"
}
