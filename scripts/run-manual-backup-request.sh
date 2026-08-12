#!/usr/bin/env bash
ROOT="/home/trombosis/vampiro-v5-revolution"
REQUEST="/home/trombosis/bloodkeeper_backups/requests/manual-backup.request"
OUTPUT="/home/trombosis/bloodkeeper_backups/scheduled"
fail(){ printf 'ERROR: %s\n' "$*" >&2; return 1; }
audit(){
  local line
  line="AUDIT action=$1 outcome=$2 channel=$3"
  printf '%s\n' "$line"
  if command -v logger >/dev/null 2>&1; then
    logger -t bloodkeeper-audit -- "$line" 2>/dev/null || true
  fi
}
main(){
  [[ -e "$REQUEST" ]] || { printf '%s\n' "Sin solicitud pendiente."; return 0; }
  if [[ -L "$REQUEST" || ! -f "$REQUEST" ]]; then rm -f -- "$REQUEST" 2>/dev/null || true; fail "Solicitud inválida."; return 1; fi
  local content
  content="$(cat -- "$REQUEST" 2>/dev/null)" || { fail "No se puede leer la solicitud."; return 1; }
  if [[ "$content" != "manual-backup" ]]; then rm -f -- "$REQUEST" 2>/dev/null || true; fail "Contenido no reconocido."; return 1; fi
  rm -f -- "$REQUEST" || { fail "No se puede consumir la solicitud."; return 1; }
  cd "$ROOT" || return 1
  audit "backup.manual.execute" "start" "systemd"
  printf '%s\n' "Iniciando copia manual controlada."
  ./scripts/backup-full.sh --output-dir "$OUTPUT" --keep 7 --quiet
  local rc=$?
  if [[ "$rc" -ne 0 ]]; then
    audit "backup.manual.execute" "failure" "systemd"
    fail "La copia manual no terminó correctamente."
    return "$rc"
  fi
  audit "backup.manual.execute" "success" "systemd"
  printf '%s\n' "Copia manual completada."
  return 0
}
main
