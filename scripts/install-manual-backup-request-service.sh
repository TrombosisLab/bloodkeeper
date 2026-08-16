#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/.."
  pwd
)"
PATH_UNIT='/etc/systemd/system/bloodkeeper-manual-backup.path'
SERVICE_UNIT='/etc/systemd/system/bloodkeeper-manual-backup.service'

usage() {
  cat <<'EOF'
Uso:
  ./scripts/install-manual-backup-request-service.sh --status
  ./scripts/install-manual-backup-request-service.sh --remove

La instalación del watcher del host está retirada. BloodKeeper utiliza
el servicio Docker backup-worker incluido en compose.deploy.yaml.
EOF
}

show_status() {
  "$ROOT/scripts/portable-compose.sh" ps backup-worker || true
  if command -v systemctl >/dev/null 2>&1; then
    systemctl status bloodkeeper-manual-backup.path --no-pager 2>&1 || true
    systemctl status bloodkeeper-manual-backup.service --no-pager 2>&1 || true
  fi
}

remove_legacy() {
  command -v systemctl >/dev/null 2>&1 || {
    printf 'No hay systemd en este host; no existe watcher que retirar.\n'
    return
  }
  command -v sudo >/dev/null 2>&1 || {
    printf 'ERROR: se necesita sudo para retirar las unidades heredadas.\n' >&2
    return 1
  }

  sudo systemctl disable --now bloodkeeper-manual-backup.path >/dev/null 2>&1 || true
  sudo systemctl stop bloodkeeper-manual-backup.service >/dev/null 2>&1 || true
  sudo rm -f -- "$PATH_UNIT" "$SERVICE_UNIT"
  sudo systemctl daemon-reload
  printf 'Watcher heredado retirado. backup-worker permanece como único consumidor.\n'
}

case "${1:-}" in
  --status) show_status ;;
  --remove) remove_legacy ;;
  --install)
    printf 'ERROR: --install está retirado; el worker ya forma parte de Docker Compose.\n' >&2
    exit 2
    ;;
  --help|-h|'') usage ;;
  *) usage; exit 2 ;;
esac
