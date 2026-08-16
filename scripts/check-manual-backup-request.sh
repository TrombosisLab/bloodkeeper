#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fail(){ printf 'ERROR: %s\n' "$*" >&2; return 1; }
main(){
  cd "$ROOT"
  sh -n apps/backup/worker.sh
  docker compose config --quiet
  if grep -RE '(systemctl|systemd[.]path|/home/trombosis|/var/run/docker[.]sock|/run/docker[.]sock)' apps/backup compose.yaml >/dev/null 2>&1; then
    fail 'El trabajador portable depende del anfitrion o del socket Docker.'
    return 1
  fi
  docker compose config --format json | python3 -c '
import json, sys
c=json.load(sys.stdin); s=c["services"]
assert "backup-init" in s and "backup-worker" in s
def mount(service, target):
    return next(v for v in s[service].get("volumes", []) if v.get("target") == target)
assert mount("api", "/run/bloodkeeper-backup")["type"] == "volume"
assert mount("api", "/run/bloodkeeper-backup").get("read_only") is True
assert mount("api", "/run/bloodkeeper-backup-requests")["type"] == "volume"
assert mount("api", "/run/bloodkeeper-backup-requests").get("read_only") is not True
for target in ("/status", "/requests", "/backups"):
    assert mount("backup-worker", target)["type"] == "volume"
assert not any(v.get("type") == "bind" for x in s.values() for v in x.get("volumes", []))
' || { fail 'Contrato de volumenes portable incorrecto.'; return 1; }
  if [ -n "$(docker compose ps -q backup-worker 2>/dev/null || true)" ]; then
    [ "$(docker inspect --format='{{.State.Health.Status}}' v5r-backup-worker)" = 'healthy' ] || return 1
    if docker compose exec -T api sh -c 'touch /run/bloodkeeper-backup/.write-test' >/dev/null 2>&1; then
      docker compose exec -T api rm -f /run/bloodkeeper-backup/.write-test >/dev/null 2>&1 || true
      fail 'El volumen de estado permite escritura desde la API.'
      return 1
    fi
    docker compose exec -T api sh -c 'test -w /run/bloodkeeper-backup-requests'
    docker compose exec -T backup-worker sh -c 'test -w /status && test -w /requests && test -w /backups'
  fi
  printf '%s\n' 'VALIDACION 042-B PORTABLE CORRECTA'
}
main
