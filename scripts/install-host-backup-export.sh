#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CRON_FILE=/etc/cron.d/bloodkeeper-portable-backup-export
ACTION=""
DESTINATION="${BLOODKEEPER_HOST_BACKUP_DIR:-$ROOT/backups/host/portable}"
HOUR=4
MINUTE=0
KEEP=30
REQUIRE_MOUNT=false

usage() {
  cat <<'EOF'
Uso:
  sudo ./scripts/install-host-backup-export.sh --enable [--destination RUTA] [--hour UTC] [--minute N] [--keep N] [--require-mounted]
  sudo ./scripts/install-host-backup-export.sh --disable
  sudo ./scripts/install-host-backup-export.sh --status

La tarea exporta diariamente copias Docker verificadas al anfitrión.
EOF
}
die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

while (($#)); do
  case "$1" in
    --enable|--disable|--status)
      [[ -z "$ACTION" ]] || die 'indica solo una acción.'
      ACTION="${1#--}"; shift ;;
    --destination|--hour|--minute|--keep)
      (($# >= 2)) || die "falta valor para $1."
      case "$1" in
        --destination) DESTINATION=$2 ;;
        --hour) HOUR=$2 ;;
        --minute) MINUTE=$2 ;;
        --keep) KEEP=$2 ;;
      esac
      shift 2 ;;
    --require-mounted) REQUIRE_MOUNT=true; shift ;;
    --help|-h) usage; exit 0 ;;
    *) usage; die "opción no reconocida: $1" ;;
  esac
done
[[ -n "$ACTION" ]] || { usage; exit 2; }
[[ "$ACTION" == status ]] && { if [[ -f "$CRON_FILE" ]]; then cat "$CRON_FILE"; else printf 'Exportación automática desactivada.\n'; fi; exit 0; }
[[ "$(id -u)" -eq 0 ]] || die 'ejecuta esta acción con sudo.'

if [[ "$ACTION" == disable ]]; then
  rm -f -- "$CRON_FILE"
  printf 'Exportación automática desactivada; las copias existentes no se han borrado.\n'
  exit 0
fi

[[ "$HOUR" =~ ^[0-9]+$ ]] || die '--hour debe ser un entero entre 0 y 23 UTC.'
[[ "$MINUTE" =~ ^[0-9]+$ ]] || die '--minute debe ser un entero entre 0 y 59.'
[[ "$KEEP" =~ ^[0-9]+$ ]] || die '--keep debe ser un entero no negativo.'
HOUR=$((10#$HOUR)); MINUTE=$((10#$MINUTE)); KEEP=$((10#$KEEP))
((HOUR <= 23)) || die '--hour debe estar entre 0 y 23 UTC.'
((MINUTE <= 59)) || die '--minute debe estar entre 0 y 59.'
[[ "$DESTINATION" != / ]] || die 'no se permite usar / como destino.'
[[ "$DESTINATION" != *%* && "$DESTINATION" != *$'\n'* ]] || die 'la ruta de destino contiene caracteres no válidos para cron.'
if [[ "$DESTINATION" != /* ]]; then DESTINATION="$ROOT/$DESTINATION"; fi
[[ -x "$ROOT/scripts/export-portable-backups.sh" ]] || die 'no se encuentra el exportador portable.'
command -v cron >/dev/null 2>&1 || command -v crond >/dev/null 2>&1 || die 'no se detecta cron; no se instaló ninguna tarea.'
flock_path="$(command -v flock)" || die 'falta flock; no se instaló ninguna tarea.'
if [[ "$REQUIRE_MOUNT" == true ]]; then
  command -v findmnt >/dev/null 2>&1 || die 'falta findmnt para exigir un disco montado.'
fi

printf -v qscript '%q' "$ROOT/scripts/export-portable-backups.sh"
printf -v qdestination '%q' "$DESTINATION"
printf -v qflock '%q' "$flock_path"
require_mount_arg=''
if [[ "$REQUIRE_MOUNT" == true ]]; then require_mount_arg=' --require-mounted'; fi
tmp="$(mktemp /etc/cron.d/.bloodkeeper-export.XXXXXX)"
trap 'rm -f -- "$tmp"' EXIT
cat > "$tmp" <<EOF
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
CRON_TZ=UTC
$MINUTE $HOUR * * * root $qflock -n /run/lock/bloodkeeper-host-backup-export.lock $qscript --destination $qdestination --keep $KEEP$require_mount_arg >> /var/log/bloodkeeper-backup-export.log 2>&1
EOF
chmod 644 "$tmp"
mv -f -- "$tmp" "$CRON_FILE"
trap - EXIT
printf 'Exportación automática instalada: cada día a las %02d:%02d UTC.\n' "$HOUR" "$MINUTE"
printf 'Destino: %s (conserva %s conjuntos; 0 significa sin borrado automático).\n' "$DESTINATION" "$KEEP"
if ! systemctl is-active --quiet cron 2>/dev/null; then
  printf 'AVISO: comprueba que el servicio cron esté activo en este anfitrión.\n'
fi
