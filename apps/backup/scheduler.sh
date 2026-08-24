#!/bin/sh
set -u

REQUEST_DIR="$(printenv BACKUP_REQUEST_DIR 2>/dev/null || printf '%s' /requests)"
REQUEST_FILE="$REQUEST_DIR/manual-backup.request"
PROCESSING_FILE="$REQUEST_DIR/manual-backup.processing"
HOUR="$(printenv BACKUP_SCHEDULE_HOUR 2>/dev/null || printf '%s' 3)"
MINUTE="$(printenv BACKUP_SCHEDULE_MINUTE 2>/dev/null || printf '%s' 0)"

valid_number() {
  case "$1" in
    ''|*[!0-9]*) return 1 ;;
  esac
  return 0
}

queue_backup() {
  if [ -e "$REQUEST_FILE" ] || [ -e "$PROCESSING_FILE" ]; then
    printf '%s\n' 'Programacion: ya existe una solicitud pendiente.'
    return 0
  fi
  temporary="$(mktemp "$REQUEST_DIR/.scheduled-backup.XXXXXX" 2>/dev/null || true)"
  if [ -z "$temporary" ]; then
    printf '%s\n' 'ERROR: no se pudo preparar la solicitud programada.' >&2
    return 1
  fi
  printf '%s\n' 'manual-backup' > "$temporary"
  if mv -f "$temporary" "$REQUEST_FILE"; then
    printf 'Solicitud de backup programada creada: %s\n' "$REQUEST_FILE"
    return 0
  fi
  rm -f -- "$temporary" 2>/dev/null || true
  printf '%s\n' 'ERROR: no se pudo publicar la solicitud programada.' >&2
  return 1
}

main() {
valid_number "$HOUR" || {
  printf '%s\n' 'ERROR: BACKUP_SCHEDULE_HOUR debe ser un entero.' >&2
  return 2
}
valid_number "$MINUTE" || {
  printf '%s\n' 'ERROR: BACKUP_SCHEDULE_MINUTE debe ser un entero.' >&2
  return 2
}
[ "$HOUR" -le 23 ] || {
  printf '%s\n' 'ERROR: BACKUP_SCHEDULE_HOUR fuera de rango.' >&2
  return 2
}
[ "$MINUTE" -le 59 ] || {
  printf '%s\n' 'ERROR: BACKUP_SCHEDULE_MINUTE fuera de rango.' >&2
  return 2
}

mkdir -p "$REQUEST_DIR" || return 1
umask 077
: > /tmp/backup-scheduler.ready
hour_text="$(printf '%02d' "$HOUR")"
minute_text="$(printf '%02d' "$MINUTE")"
last_slot=''

printf 'Scheduler Docker preparado. Hora UTC: %s:%s.\n' "$hour_text" "$minute_text"

while :; do
  slot="$(date -u +%Y-%m-%dT%H:%M)"
  if [ "$(date -u +%H)" = "$hour_text" ] &&
     [ "$(date -u +%M)" = "$minute_text" ] &&
     [ "$slot" != "$last_slot" ]; then
    queue_backup || true
    last_slot="$slot"
  fi
  sleep 20
done
}

main "$@"
