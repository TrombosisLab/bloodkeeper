#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/.."
  pwd
)"

WITH_FULL_BACKUP="false"
TEMP_DIR=""

usage() {
  cat <<'EOF'
Uso:
  ./scripts/check-backup-recovery.sh
  ./scripts/check-backup-recovery.sh --with-full-backup

La segunda opción crea una copia completa real, detiene brevemente los
servicios para capturar el volumen y verifica la restauración temporal.
EOF
}

die() {
  echo "ERROR: $*" >&2
  return 1
}

cleanup() {
  if [ -n "$TEMP_DIR" ] && [ -d "$TEMP_DIR" ]; then
    rm -rf "$TEMP_DIR"
  fi
}

trap cleanup EXIT

while [ "$#" -gt 0 ]; do
  case "$1" in
    --with-full-backup)
      WITH_FULL_BACKUP="true"
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
  docs/RECOVERY.md \
  docs/VALIDATION.md \
  scripts/backup.sh \
  scripts/restore.sh \
  scripts/backup-full.sh \
  scripts/restore-full.sh \
  scripts/install-backup-schedule.sh
do
  test -f "$file" ||
    die "Falta $file."

  echo "✓ $file"
done

echo
echo "== Contrato SPEC-007 =="

require_text() {
  local text="$1"
  local file="$2"
  local label="$3"

  grep -Fqi "$text" "$file" ||
    die "Falta el contrato documental: $label"
}

require_text 'SPEC-007' docs/RECOVERY.md 'identificación de SPEC-007'
require_text 'Base de datos PostgreSQL' docs/RECOVERY.md 'base de datos'
require_text 'Volumen Docker de PostgreSQL' docs/RECOVERY.md 'volumen Docker'
require_text '03:00' docs/RECOVERY.md 'programación diaria'
require_text 'siete conjuntos' docs/RECOVERY.md 'retención'
require_text 'No se aplican copias incrementales' docs/RECOVERY.md 'incrementales'
require_text 'servidor limpio' docs/RECOVERY.md 'servidor limpio'
require_text 'Verificación periódica' docs/RECOVERY.md 'integridad periódica'

echo "✓ Alcance completo"
echo "✓ Programación y retención definidas"
echo "✓ Recuperación e integridad documentadas"

echo
echo "== Automatización =="

for file in \
  scripts/backup-full.sh \
  scripts/restore-full.sh \
  scripts/install-backup-schedule.sh
do
  test -x "$file" ||
    die "$file no es ejecutable."

  bash -n "$file"
  echo "✓ $file"
done

test -f apps/backup/worker.sh ||
  die "Falta el worker portable de backups."

test -f apps/backup/scheduler.sh ||
  die "Falta el scheduler portable de backups."

grep -Fq '  backup-scheduler:' compose.yaml ||
  die "Falta el servicio backup-scheduler en Compose."

grep -Fq 'dockerfile: apps/backup/scheduler.Dockerfile' compose.yaml ||
  die "Falta la imagen Docker del scheduler."

grep -Fq 'backup_requests:/requests' compose.yaml ||
  die "Falta el volumen de solicitudes del scheduler."

if grep -RE 'crontab|systemd|docker.sock' apps/backup/scheduler.sh compose.yaml >/dev/null 2>&1; then
  die "El scheduler portable no debe depender del host."
fi

bash -n apps/backup/scheduler.sh
echo "Scheduler Docker portable validado"

echo "✓ Tarea diaria instalada"

echo
echo "== Estado operativo =="

docker compose config --quiet
./scripts/check.sh

if [ "$WITH_FULL_BACKUP" = "true" ]; then
  echo
  echo "== Copia completa y restauración temporal =="

  TEMP_DIR="$(
    mktemp -d /tmp/bloodkeeper-spec007-check.XXXXXX
  )"

  archive="$(
    ./scripts/backup-full.sh \
      --output-dir "$TEMP_DIR" \
      --keep 2 \
      --quiet |
    tail -n 1
  )"

  test -s "$archive"
  test -s "$archive.sha256"
  test -s "$archive.meta"

  ./scripts/restore-full.sh \
    --verify "$archive"

  echo "✓ Copia completa creada y verificada"
fi

echo
echo "BACKUP Y RECUPERACIÓN SPEC-007 CORRECTOS"
