#!/usr/bin/env sh

ROOT="$(
  cd "$(dirname "$0")/.."
  pwd
)"

usage() {
  cat <<'EOF'
Uso:
  ./scripts/stop.sh --confirm
  ./scripts/stop.sh --help

Detiene y elimina los contenedores de BloodKeeper sin borrar el volumen
PostgreSQL. La parada es una acción de impacto y requiere --confirm.
EOF
}

fail() {
  printf 'ERROR: %s\n' "$*" >&2
  return 1
}

audit() {
  audit_line="AUDIT action=$1 outcome=$2 channel=$3"
  printf '%s\n' "$audit_line"
  if command -v logger >/dev/null 2>&1; then
    logger -t bloodkeeper-audit -- "$audit_line" 2>/dev/null || true
  fi
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
      fail "Parada no confirmada. Usa --confirm para ejecutarla."
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
    fail "stop.sh acepta únicamente --confirm."
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
  echo "BLOODKEEPER — PARADA CONFIRMADA"
  echo "============================================================"
  echo "Deteniendo Vampiro V5 Revolution..."

  audit "maintenance.stop" "start" "ssh"

  docker compose down || {
    audit "maintenance.stop" "failure" "ssh"
    fail "Docker Compose no pudo detener la plataforma."
    return 1
  }

  audit "maintenance.stop" "success" "ssh"

  echo
  echo "PARADA COMPLETADA"
  return 0
}

main "$@"
