#!/usr/bin/env bash
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REQUEST_DIR="/home/trombosis/bloodkeeper_backups/requests"
fail(){ printf 'ERROR: %s\n' "$*" >&2; return 1; }
main(){
  cd "$ROOT" || return 1
  for f in scripts/run-manual-backup-request.sh scripts/install-manual-backup-request-service.sh; do [[ -x "$f" ]] || return 1; bash -n "$f" || return 1; done
  if grep -E 'eval|source[[:space:]]|sh -c|bash -c' scripts/run-manual-backup-request.sh >/dev/null 2>&1; then fail "Runner evalúa comandos."; return 1; fi
  grep -F './scripts/backup-full.sh' scripts/run-manual-backup-request.sh >/dev/null 2>&1 || return 1
  [[ "$(stat -c '%a' "$REQUEST_DIR")" == "700" ]] || { fail "Spool no es 700."; return 1; }
  systemctl is-enabled bloodkeeper-manual-backup.path >/dev/null 2>&1 || return 1
  systemctl is-active bloodkeeper-manual-backup.path >/dev/null 2>&1 || return 1
  grep -F 'PathExists=/home/trombosis/bloodkeeper_backups/requests/manual-backup.request' /etc/systemd/system/bloodkeeper-manual-backup.path >/dev/null 2>&1 || return 1
  grep -F 'ExecStart=/home/trombosis/vampiro-v5-revolution/scripts/run-manual-backup-request.sh' /etc/systemd/system/bloodkeeper-manual-backup.service >/dev/null 2>&1 || return 1
  docker compose config --quiet || return 1
  grep -F '/var/run/docker.sock' compose.yaml >/dev/null 2>&1 && { fail "Docker socket no permitido."; return 1; }
  printf '%s\n' "VALIDACIÓN 042-B CORRECTA"
}
main
