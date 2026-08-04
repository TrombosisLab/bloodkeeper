#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/.."
  pwd
)"

ACTION="install"
HOUR="3"
MINUTE="0"
KEEP="7"
OUTPUT_DIR="$HOME/bloodkeeper_backups/scheduled"
MIRROR_DIR=""
BEGIN_MARKER="# BEGIN BLOODKEEPER SPEC-007 FULL BACKUP"
END_MARKER="# END BLOODKEEPER SPEC-007 FULL BACKUP"

usage() {
  cat <<'EOF'
Uso:
  ./scripts/install-backup-schedule.sh --install
  ./scripts/install-backup-schedule.sh --status
  ./scripts/install-backup-schedule.sh --remove

Opciones de instalación:
  --hour N
  --minute N
  --keep N
  --output-dir RUTA
  --mirror-dir RUTA

Por defecto programa una copia completa diaria a las 03:00 y conserva
los siete conjuntos más recientes.
EOF
}

die() {
  echo "ERROR: $*" >&2
  return 1
}

remove_block() {
  awk \
    -v begin="$BEGIN_MARKER" \
    -v end="$END_MARKER" '
      $0 == begin {
        skipping = 1
        next
      }

      $0 == end {
        skipping = 0
        next
      }

      !skipping {
        print
      }
    '
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --install)
      ACTION="install"
      shift
      ;;
    --status)
      ACTION="status"
      shift
      ;;
    --remove)
      ACTION="remove"
      shift
      ;;
    --hour)
      HOUR="$2"
      shift 2
      ;;
    --minute)
      MINUTE="$2"
      shift 2
      ;;
    --keep)
      KEEP="$2"
      shift 2
      ;;
    --output-dir)
      OUTPUT_DIR="$2"
      shift 2
      ;;
    --mirror-dir)
      MIRROR_DIR="$2"
      shift 2
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      usage
      die "Argumento no reconocido: $1"
      ;;
  esac
done

current="$(
  crontab -l 2>/dev/null || true
)"

case "$ACTION" in
  status)
    printf '%s\n' "$current" |
      sed -n \
        "\|^$BEGIN_MARKER$|,\|^$END_MARKER$|p"
    ;;

  remove)
    filtered="$(
      printf '%s\n' "$current" |
        remove_block
    )"

    if [ -n "$filtered" ]; then
      printf '%s\n' "$filtered" |
        crontab -
    else
      crontab -r 2>/dev/null || true
    fi

    echo "✓ Programación SPEC-007 eliminada"
    ;;

  install)
    for value in "$HOUR" "$MINUTE" "$KEEP"; do
      case "$value" in
        ''|*[!0-9]*)
          die "Hora, minuto y retención deben ser enteros."
          ;;
      esac
    done

    test "$HOUR" -le 23
    test "$MINUTE" -le 59
    test "$KEEP" -ge 1

    case "$ROOT$OUTPUT_DIR$MIRROR_DIR" in
      *[[:space:]]*)
        die "Las rutas programadas no pueden contener espacios."
        ;;
    esac

    mkdir -p "$OUTPUT_DIR"
    chmod 700 "$OUTPUT_DIR" 2>/dev/null || true

    command_line="$ROOT/scripts/backup-full.sh --output-dir $OUTPUT_DIR --keep $KEEP"

    if [ -n "$MIRROR_DIR" ]; then
      mkdir -p "$MIRROR_DIR"
      chmod 700 "$MIRROR_DIR" 2>/dev/null || true
      command_line="$command_line --mirror-dir $MIRROR_DIR"
    fi

    filtered="$(
      printf '%s\n' "$current" |
        remove_block
    )"

    {
      if [ -n "$filtered" ]; then
        printf '%s\n' "$filtered"
      fi

      echo "$BEGIN_MARKER"
      echo "$MINUTE $HOUR * * * cd $ROOT && $command_line >> $OUTPUT_DIR/backup.log 2>&1"
      echo "$END_MARKER"
    } |
      crontab -

    echo "✓ Copia completa diaria programada a las $(printf '%02d:%02d' "$HOUR" "$MINUTE")"
    echo "✓ Retención: $KEEP conjuntos"
    echo "✓ Destino: $OUTPUT_DIR"

    if [ -n "$MIRROR_DIR" ]; then
      echo "✓ Espejo: $MIRROR_DIR"
    else
      echo "AVISO: configura --mirror-dir cuando exista almacenamiento fuera de la VM."
    fi
    ;;
esac
