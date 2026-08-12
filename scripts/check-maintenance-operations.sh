#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/.."
  pwd
)"

WITH_RESTART="false"
WITH_BACKUP="false"
TEMP_DIR=""

usage() {
  cat <<'EOF'
Uso:
  ./scripts/check-maintenance-operations.sh
  ./scripts/check-maintenance-operations.sh --with-restart
  ./scripts/check-maintenance-operations.sh --with-backup
  ./scripts/check-maintenance-operations.sh \
    --with-restart \
    --with-backup

Opciones:
  --with-restart  Ejecuta un reinicio real y controlado.
  --with-backup   Crea un dump temporal y valida su restauración.
EOF
}

die() {
  echo "ERROR: $*" >&2
  return 1
}

require_text() {
  local text="$1"
  local file="$2"
  local label="$3"

  grep -Fqi "$text" "$file" ||
    die "Falta el contrato: $label"
}

cleanup() {
  if [ -n "$TEMP_DIR" ] && [ -d "$TEMP_DIR" ]; then
    rm -rf "$TEMP_DIR"
  fi
}

trap cleanup EXIT

while [ "$#" -gt 0 ]; do
  case "$1" in
    --with-restart)
      WITH_RESTART="true"
      shift
      ;;
    --with-backup)
      WITH_BACKUP="true"
      shift
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

cd "$ROOT"

echo "== Archivos oficiales =="

for file in \
  docs/MAINTENANCE_OPERATIONS.md \
  docs/VALIDATION.md \
  scripts/start.sh \
  scripts/stop.sh \
  scripts/restart.sh \
  scripts/status.sh \
  scripts/logs.sh \
  scripts/check.sh \
  scripts/backup.sh \
  scripts/restore.sh \
  scripts/prepare-update.sh
do
  test -f "$file" ||
    die "Falta $file."

  echo "✓ $file"
done

echo
echo "== Contrato SPEC-009 =="

require_text 'SPEC-009' \
  docs/MAINTENANCE_OPERATIONS.md \
  'identificación de SPEC-009'

for text in \
  'Iniciar' \
  'Detener' \
  'Reiniciar' \
  'Estado' \
  'Logs' \
  'Health checks' \
  'Backup' \
  'Restauración' \
  'Preparar una actualización' \
  'Snapshot de VirtualBox' \
  'Reversión'
do
  require_text \
    "$text" \
    docs/MAINTENANCE_OPERATIONS.md \
    "$text"
done

grep -Fq 'docker compose up -d' \
  scripts/start.sh ||
  die "start.sh no inicia la plataforma."

grep -Fq 'docker compose down' \
  scripts/stop.sh ||
  die "stop.sh no detiene la plataforma."

if grep -Eq \
  'docker compose down[[:space:]].*(--volumes|-v)' \
  scripts/stop.sh
then
  die "stop.sh elimina volúmenes."
fi

grep -Fq -- '--confirm' \
  scripts/stop.sh ||
  die "stop.sh no exige confirmación explícita."

grep -Fq 'docker compose restart postgres' \
  scripts/restart.sh ||
  die "restart.sh no reinicia PostgreSQL."

grep -Fq './scripts/check.sh' \
  scripts/restart.sh ||
  die "restart.sh no valida el resultado."


grep -Fq -- '--confirm' \
  scripts/restart.sh ||
  die "restart.sh no exige confirmación explícita."

grep -Fq './scripts/backup-full.sh' \
  scripts/prepare-update.sh ||
  die "prepare-update.sh no protege datos."

grep -Fq './scripts/restore-full.sh' \
  scripts/prepare-update.sh ||
  die "prepare-update.sh no verifica la copia."

grep -Fq -- '--confirm' \
  scripts/prepare-update.sh ||
  die "prepare-update.sh no exige confirmación."

grep -Fq 'if [ "$MODE" = "prepare" ]; then' \
  scripts/prepare-update.sh ||
  die "prepare-update.sh no limita el requisito de árbol limpio al modo prepare."

grep -Fq 'La versión instalada no se ha modificado' \
  scripts/prepare-update.sh ||
  die "prepare-update.sh no limita su alcance."

echo "✓ Nueve operaciones mínimas cubiertas"
echo "✓ Operaciones destructivas protegidas"
echo "✓ Preparación separada de la aplicación de una actualización"
echo

echo "== Sintaxis y permisos =="

for file in \
  scripts/start.sh \
  scripts/stop.sh \
  scripts/restart.sh \
  scripts/status.sh \
  scripts/logs.sh \
  scripts/check.sh \
  scripts/backup.sh \
  scripts/restore.sh \
  scripts/prepare-update.sh
do
  bash -n "$file"
  test -x "$file" ||
    die "$file no es ejecutable."
  echo "✓ $file"
done

echo
echo "== Operación no destructiva =="

./scripts/status.sh
./scripts/logs.sh all --lines 3 >/dev/null
./scripts/check.sh
./scripts/prepare-update.sh \
  --check \
  --target HEAD

if [ "$WITH_BACKUP" = "true" ]; then
  echo
  echo "== Backup y restauración temporal =="

  TEMP_DIR="$(
    mktemp -d /tmp/bloodkeeper-spec009-check.XXXXXX
  )"

  archive="$(
    ./scripts/backup.sh \
      --output-dir "$TEMP_DIR" \
      --quiet |
    tail -n 1
  )"

  test -s "$archive"
  test -s "$archive.sha256"
  test -s "$archive.meta"

  ./scripts/restore.sh \
    --verify "$archive"

  echo "✓ Backup y restauración temporal"
fi

if [ "$WITH_RESTART" = "true" ]; then
  echo
  echo "== Reinicio real controlado =="

  ./scripts/restart.sh --confirm
fi

echo
echo "MANTENIMIENTO SPEC-009 CORRECTO"
