#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/.."
  pwd
)"

ARCHIVE=""
TARGET_DIR=""
OLD_STACK_STOPPED="false"
RESTORATION_SUCCESS="false"

usage() {
  cat <<'EOF'
Uso:
  ./scripts/restore-full-guided.sh \
    --archive ARCHIVO.tar.gz \
    [--target-dir RUTA]

El flujo:
  1. verifica el paquete completo;
  2. extrae la instalación en una ruta nueva;
  3. detiene la instalación actual sin borrar sus volúmenes;
  4. reconstruye API y Web con bootstrap-server.sh;
  5. verifica el dump incluido;
  6. pide confirmación antes de aplicar los datos;
  7. aplica el dump y valida los servicios.

La instalación anterior no se elimina automáticamente.
EOF
}

die() {
  printf 'ERROR: %s\n' "$*" >&2
  return 1
}

absolute_path() {
  local value="$1"

  case "$value" in
    /*) printf '%s\n' "$value" ;;
    *) printf '%s/%s\n' "$ROOT" "$value" ;;
  esac
}

restart_previous_installation() {
  if [ "$OLD_STACK_STOPPED" != "true" ]; then
    return 0
  fi

  printf '\nLa restauración no terminó. Intentando recuperar la instalación anterior...\n'

  if [ -d "$TARGET_DIR" ] && [ -f "$TARGET_DIR/compose.yaml" ]; then
    (
      cd "$TARGET_DIR"
      docker compose down
    ) || true
  fi

  (
    cd "$ROOT"
    docker compose up -d
  ) || true

  printf 'La instalación anterior se ha dejado como intento de recuperación.\n' >&2
}

on_exit() {
  local code="$?"

  trap - EXIT

  if [ "$code" -ne 0 ] && [ "$RESTORATION_SUCCESS" != "true" ]; then
    restart_previous_installation
  fi

  exit "$code"
}

trap on_exit EXIT

while [ "$#" -gt 0 ]; do
  case "$1" in
    --archive)
      test "$#" -ge 2 || die 'Falta el paquete completo.'
      ARCHIVE="$2"
      shift 2
      ;;
    --target-dir)
      test "$#" -ge 2 || die 'Falta la ruta de recuperación.'
      TARGET_DIR="$2"
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

if [ "$(id -u)" -ne 0 ]; then
  die 'ejecuta este flujo con sudo.'
fi

test -n "$ARCHIVE" || die 'Debes indicar --archive.'
ARCHIVE="$(absolute_path "$ARCHIVE")"
test -f "$ARCHIVE" || die "No existe el paquete: $ARCHIVE"

case "$ARCHIVE" in
  *.tar.gz) ;;
  *) die 'El archivo debe terminar en .tar.gz.' ;;
esac

if [ -z "$TARGET_DIR" ]; then
  TARGET_DIR="$ROOT-restored"
else
  TARGET_DIR="$(absolute_path "$TARGET_DIR")"
fi

test "$TARGET_DIR" != "$ROOT" ||
  die 'La ruta de recuperación debe ser distinta del repositorio actual.'
test "$TARGET_DIR" != '/' ||
  die 'No se permite usar / como ruta de recuperación.'
test ! -e "$TARGET_DIR" ||
  die "La ruta de recuperación ya existe: $TARGET_DIR"

printf '============================================================\n'
printf 'BLOODKEEPER — RESTAURACIÓN COMPLETA AUTOMATIZADA\n'
printf '============================================================\n'
printf 'Paquete: %s\n' "$ARCHIVE"
printf 'Destino: %s\n' "$TARGET_DIR"
printf '\n'
printf 'Primero se verificará el paquete sin modificar la base activa.\n'

"$ROOT/scripts/restore-full.sh" --verify "$ARCHIVE"

printf '\nLa verificación ha terminado correctamente.\n'
read -r -p 'Escribe CONTINUAR para extraer y detener la instalación actual: ' confirmation
test "$confirmation" = 'CONTINUAR' || die 'Operación cancelada.'

"$ROOT/scripts/restore-full.sh" \
  --extract "$ARCHIVE" \
  --target-dir "$TARGET_DIR" \
  --confirm

printf '\nDeteniendo la instalación actual sin borrar sus volúmenes...\n'
"$ROOT/scripts/stop.sh" --confirm
OLD_STACK_STOPPED="true"

printf '\nReconstruyendo y arrancando la instalación recuperada...\n'
(
  cd "$TARGET_DIR"
  ./scripts/bootstrap-server.sh --deploy
)

DUMP="$(
  find "$TARGET_DIR/backups/full-recovery" \
    -maxdepth 1 \
    -type f \
    -name '*.dump' \
    -print \
    -quit
)"

test -n "$DUMP" || die 'No se encontró el dump dentro de la recuperación.'

printf '\nVerificando el dump recuperado...\n'
(
  cd "$TARGET_DIR"
  ./scripts/restore.sh --verify "$DUMP"
)

printf '\nLa instalación recuperada está preparada.\n'
printf 'La siguiente operación sustituirá la base actual de la instalación recuperada.\n'
read -r -p 'Escribe RESTAURAR para aplicar definitivamente los datos: ' confirmation
test "$confirmation" = 'RESTAURAR' || die 'Operación cancelada antes de aplicar los datos.'

(
  cd "$TARGET_DIR"
  ./scripts/restore.sh --apply "$DUMP" --confirm
  ./scripts/check.sh
)

RESTORATION_SUCCESS="true"

printf '\n============================================================\n'
printf 'RESTAURACIÓN COMPLETA FINALIZADA\n'
printf '============================================================\n'
printf 'Instalación activa: %s\n' "$TARGET_DIR"
printf 'La instalación anterior permanece en: %s\n' "$ROOT"
