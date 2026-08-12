#!/usr/bin/env bash
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STATUS_FILE="$HOME/bloodkeeper_backups/status/backup-status.json"
fail(){ printf 'ERROR: %s\n' "$*" >&2; return 1; }
main(){
  cd "$ROOT" || { fail "No se puede acceder al repo"; return 1; }
  echo "== Manifiesto sanitizado =="
  test -r "$STATUS_FILE" || { fail "No se puede leer $STATUS_FILE"; return 1; }
  python3 -m json.tool "$STATUS_FILE" >/dev/null || { fail "JSON inválido"; return 1; }
  for field in status lastRunAt lastSuccessfulBackupAt archiveName sizeBytes integrity error; do
    grep -F "\"$field\"" "$STATUS_FILE" >/dev/null || { fail "Falta $field"; return 1; }
  done
  if grep -E '/home/|DATABASE_URL|POSTGRES_PASSWORD|SESSION_SECRET|password|postgresql://' "$STATUS_FILE" >/dev/null; then fail "Estado no sanitizado"; return 1; fi
  echo "✓ JSON válido y sanitizado"
  echo
  echo "== Compose =="
  docker compose config --quiet || { fail "Compose inválido"; return 1; }
  grep -F 'target: /run/bloodkeeper-backup' compose.yaml >/dev/null || return 1
  grep -F 'read_only: true' compose.yaml >/dev/null || return 1
  ! grep -F '/var/run/docker.sock' compose.yaml >/dev/null || { fail "Docker socket no permitido"; return 1; }
  ! grep -E 'privileged:[[:space:]]*true' compose.yaml >/dev/null || { fail "privileged no permitido"; return 1; }
  echo "✓ Aislamiento preservado"
  echo
  echo "== API runtime =="
  docker compose exec -T api sh -c 'test -r /run/bloodkeeper-backup/backup-status.json && test ! -e /home/trombosis/bloodkeeper_backups/scheduled' || { fail "Superficie de lectura inesperada"; return 1; }
  if docker compose exec -T api sh -c 'touch /run/bloodkeeper-backup/.write-test' >/dev/null 2>&1; then
    docker compose exec -T api rm -f /run/bloodkeeper-backup/.write-test >/dev/null 2>&1 || true
    fail "Mount escribible"; return 1
  fi
  echo "✓ Estado visible y no escribible"
  echo
  echo "== Endpoint =="
  code="$(curl -sS -o /tmp/check-admin-backup-status-body.txt -w '%{http_code}' http://127.0.0.1:3000/administration/backups/status 2>/dev/null)" || { fail "Curl falló"; return 1; }
  test "$code" = "401" || { cat /tmp/check-admin-backup-status-body.txt; fail "Esperado 401, recibido $code"; return 1; }
  echo "✓ Endpoint protegido"
  echo
  echo "ESTADO ADMINISTRATIVO DE BACKUPS CORRECTO"
  return 0
}
main
