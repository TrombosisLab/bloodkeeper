#!/usr/bin/env bash

ROOT="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/.."
  pwd
)"

usage() {
  cat <<'EOF'
Uso:
  ./scripts/restart.sh --confirm
  ./scripts/restart.sh --help

Reinicia PostgreSQL, API y web de forma controlada, espera sus health
checks y ejecuta la comprobación operativa final.

El reinicio es una acción de impacto y requiere --confirm.
EOF
}

fail() {
  printf 'ERROR: %s\n' "$*" >&2
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
        2>/dev/null
    )"

    case "$state" in
      healthy)
        echo "✓ $container: healthy"
        return 0
        ;;
      unhealthy|exited|dead)
        fail "$container está en estado $state."
        return 1
        ;;
    esac

    sleep 2
    attempts=$((attempts - 1))
  done

  fail "$container no alcanzó estado healthy."
  return 1
}

main() {
  case "${1:-}" in
    --confirm)
      ;;
    --help|-h)
      usage
      return 0
      ;;
    "")
      usage
      fail "Reinicio no confirmado. Usa --confirm para ejecutarlo."
      return 1
      ;;
    *)
      usage
      fail "Argumento no reconocido: $1"
      return 1
      ;;
  esac

  if [ "$#" -ne 1 ]; then
    usage
    fail "restart.sh acepta únicamente --confirm."
    return 1
  fi

  cd "$ROOT" || {
    fail "No se puede acceder al repositorio."
    return 1
  }

  docker compose config --quiet || {
    fail "La configuración Docker Compose no es válida."
    return 1
  }

  echo "============================================================"
  echo "BLOODKEEPER — REINICIO CONTROLADO CONFIRMADO"
  echo "============================================================"

  local service
  for service in postgres api web; do
    if [ -z "$(docker compose ps -a -q "$service")" ]; then
      echo "Creando el contenedor ausente: $service"
      docker compose up -d "$service" || {
        fail "No se pudo crear el servicio $service."
        return 1
      }
    fi
  done

  echo
  echo "Reiniciando PostgreSQL..."
  docker compose restart postgres || {
    fail "No se pudo reiniciar PostgreSQL."
    return 1
  }
  wait_for_health v5r-postgres || return 1

  echo
  echo "Reiniciando API y web..."
  docker compose restart api web || {
    fail "No se pudieron reiniciar API y web."
    return 1
  }
  wait_for_health v5r-api || return 1
  wait_for_health v5r-web || return 1

  echo
  ./scripts/check.sh || {
    fail "La comprobación funcional posterior al reinicio falló."
    return 1
  }

  echo
  echo "REINICIO COMPLETADO CORRECTAMENTE"
  return 0
}

main "$@"
