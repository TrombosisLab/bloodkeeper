#!/usr/bin/env bash
set -Eeuo pipefail

DEV_SCRIPT_DIR="$(
  cd "$(dirname "${BASH_SOURCE[0]}")"
  pwd
)"

ROOT="$(
  cd "$DEV_SCRIPT_DIR/../.."
  pwd
)"

cd "$ROOT"

die() {
  echo "ERROR: $*" >&2
  return 1
}

require_service() {
  local service="$1"

  docker compose config --services |
    grep -Fxq "$service" ||
    die "El servicio Docker Compose '$service' no existe."
}

wait_for_service() {
  local service="$1"
  local container_id=""
  local state=""
  local attempts=90

  container_id="$(
    docker compose ps -q "$service"
  )"

  test -n "$container_id" ||
    die "No se encontró el contenedor de '$service'."

  while [ "$attempts" -gt 0 ]; do
    state="$(
      docker inspect \
        --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' \
        "$container_id" \
        2>/dev/null || true
    )"

    case "$state" in
      healthy|running)
        return 0
        ;;
      unhealthy|exited|dead)
        die "El servicio '$service' está en estado '$state'."
        ;;
    esac

    sleep 2
    attempts=$((attempts - 1))
  done

  die "El servicio '$service' no alcanzó un estado operativo."
}

ensure_running() {
  local service="$1"

  require_service "$service"

  if [ -z "$(docker compose ps -q "$service")" ]; then
    echo "Iniciando servicio '$service'..."
    docker compose up -d "$service"
  fi

  wait_for_service "$service"
}

run_npm() {
  local service="$1"
  local command="$2"

  ensure_running "$service"

  docker compose exec -T "$service" \
    npm run "$command" \
    </dev/null
}

run_container() {
  local service="$1"
  shift

  ensure_running "$service"

  docker compose exec -T "$service" \
    "$@" \
    </dev/null
}
