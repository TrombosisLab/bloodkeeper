#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fail(){ printf 'ERROR: %s\n' "$*" >&2; return 1; }
main(){
  cd "$ROOT"
  docker compose config --quiet
  grep -F 'target: /run/bloodkeeper-backup' compose.yaml >/dev/null
  grep -F 'source: backup_status' compose.yaml >/dev/null
  if grep -E 'source:.*(HOME|/home/|/Users/)' compose.yaml >/dev/null 2>&1; then
    fail 'El estado de copias depende de una ruta del anfitrion.'
    return 1
  fi
  if [ -n "$(docker compose ps -q api 2>/dev/null || true)" ]; then
    if docker compose exec -T api sh -c 'touch /run/bloodkeeper-backup/.write-test' >/dev/null 2>&1; then
      docker compose exec -T api rm -f /run/bloodkeeper-backup/.write-test >/dev/null 2>&1 || true
      fail 'El volumen de estado permite escritura desde la API.'
      return 1
    fi
    code="$(curl -sS -o /tmp/check-admin-backup-status-body.txt -w '%{http_code}' http://127.0.0.1:3000/administration/backups/status 2>/dev/null)" || { fail 'Curl fallo'; return 1; }
    [ "$code" = '401' ] || { cat /tmp/check-admin-backup-status-body.txt; fail "Esperado 401, recibido $code"; return 1; }
    rm -f /tmp/check-admin-backup-status-body.txt
  fi
  printf '%s\n' 'VALIDACION 042-A PORTABLE CORRECTA'
}
main
