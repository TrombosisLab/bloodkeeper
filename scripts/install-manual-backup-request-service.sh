#!/usr/bin/env bash
PATH_UNIT="/etc/systemd/system/bloodkeeper-manual-backup.path"
SERVICE_UNIT="/etc/systemd/system/bloodkeeper-manual-backup.service"
REQUEST_DIR="/home/trombosis/bloodkeeper_backups/requests"
usage(){ printf '%s\n' 'Uso: --install | --status | --remove'; }
fail(){ printf 'ERROR: %s\n' "$*" >&2; return 1; }
install_units(){
  sudo -v || return 1
  mkdir -p "$REQUEST_DIR" && chmod 700 "$REQUEST_DIR" || return 1
  local p s
  p="$(mktemp)"; s="$(mktemp)"
  cat > "$p" <<'UNIT'
[Unit]
Description=BloodKeeper manual backup request watcher
After=local-fs.target

[Path]
PathExists=/home/trombosis/bloodkeeper_backups/requests/manual-backup.request
Unit=bloodkeeper-manual-backup.service

[Install]
WantedBy=multi-user.target
UNIT
  cat > "$s" <<'UNIT'
[Unit]
Description=BloodKeeper controlled manual backup
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
User=trombosis
Group=trombosis
WorkingDirectory=/home/trombosis/vampiro-v5-revolution
ExecStart=/home/trombosis/vampiro-v5-revolution/scripts/run-manual-backup-request.sh
UNIT
  sudo install -m 0644 "$p" "$PATH_UNIT" || { rm -f "$p" "$s"; return 1; }
  sudo install -m 0644 "$s" "$SERVICE_UNIT" || { rm -f "$p" "$s"; return 1; }
  rm -f "$p" "$s"
  sudo systemctl daemon-reload || return 1
  sudo systemctl enable --now bloodkeeper-manual-backup.path || return 1
  printf '%s\n' "Watcher manual instalado."
}
show_status(){ systemctl status bloodkeeper-manual-backup.path --no-pager 2>&1 || true; systemctl status bloodkeeper-manual-backup.service --no-pager 2>&1 || true; }
remove_units(){
  sudo -v || return 1
  sudo systemctl disable --now bloodkeeper-manual-backup.path >/dev/null 2>&1 || true
  sudo systemctl stop bloodkeeper-manual-backup.service >/dev/null 2>&1 || true
  sudo rm -f "$PATH_UNIT" "$SERVICE_UNIT" || return 1
  sudo systemctl daemon-reload || return 1
  printf '%s\n' "Watcher manual retirado."
}
main(){ case "${1:-}" in --install) install_units;; --status) show_status;; --remove) remove_units;; --help|-h) usage;; *) usage; fail "Operación no reconocida."; return 2;; esac; }
main "$@"
