#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/.."
  pwd
)"

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

cd "$ROOT"

echo "== Archivos oficiales =="

for file in \
  docs/SYSTEM_MONITORING.md \
  docs/VALIDATION.md \
  scripts/status.sh \
  scripts/check.sh \
  scripts/logs.sh
do
  test -f "$file" ||
    die "Falta $file."

  echo "✓ $file"
done

echo
echo "== Contrato SPEC-008 =="

require_text 'SPEC-008' docs/SYSTEM_MONITORING.md 'identificación de SPEC-008'
require_text 'Estado general' docs/SYSTEM_MONITORING.md 'estado general'
require_text 'Estado de los contenedores' docs/SYSTEM_MONITORING.md 'contenedores'
require_text 'Estado de PostgreSQL' docs/SYSTEM_MONITORING.md 'PostgreSQL'
require_text 'CPU' docs/SYSTEM_MONITORING.md 'CPU'
require_text 'memoria' docs/SYSTEM_MONITORING.md 'memoria'
require_text 'disco' docs/SYSTEM_MONITORING.md 'disco'
require_text 'copias de seguridad' docs/SYSTEM_MONITORING.md 'backups'
require_text 'Versión instalada' docs/SYSTEM_MONITORING.md 'versión'
require_text 'panel de administración' docs/SYSTEM_MONITORING.md 'presentación visual diferida'

grep -Fq '== Estado de las copias de seguridad ==' \
  scripts/status.sh ||
  die "status.sh no muestra backups."

grep -Fq '== Versión instalada ==' \
  scripts/status.sh ||
  die "status.sh no muestra la versión."

grep -Fq 'ESTADO GENERAL: ERROR' \
  scripts/status.sh ||
  die "status.sh no detecta errores."

./scripts/logs.sh all --lines 1 \
  >/dev/null ||
  die "logs.sh no puede consultar registros."

echo "✓ Estado completo consultable"
echo "✓ Diagnóstico y detección de fallos presentes"
echo "✓ Presentación visual correctamente diferida"

echo
echo "== Validación operativa =="

bash -n scripts/status.sh
bash -n scripts/check.sh
bash -n scripts/logs.sh

./scripts/status.sh
./scripts/check.sh
./scripts/logs.sh all --lines 5 >/dev/null

echo
echo "MONITORIZACIÓN SPEC-008 CORRECTA"
