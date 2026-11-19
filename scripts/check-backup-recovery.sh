#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERIFY_ARCHIVE=""

usage() {
  cat <<'EOF'
Uso:
  ./scripts/check-backup-recovery.sh
  ./scripts/check-backup-recovery.sh --verify-archive COPIA.tar.gz

La verificación opcional restaura la copia en una base temporal; no sustituye
la base activa.
EOF
}
die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

while (($#)); do
  case "$1" in
    --verify-archive)
      (($# >= 2)) || die 'falta la ruta de la copia.'
      VERIFY_ARCHIVE=$2; shift 2 ;;
    --help|-h) usage; exit 0 ;;
    *) usage; die "opción no reconocida: $1" ;;
  esac
done

cd "$ROOT"
echo '== Contrato de recuperación portable =='
for file in \
  docs/RECOVERY.md \
  scripts/portable-compose.sh \
  scripts/export-portable-backups.sh \
  scripts/install-host-backup-export.sh \
  scripts/restore-portable-backup.sh \
  apps/backup/worker.sh \
  apps/backup/scheduler.sh \
  compose.deploy.yaml
do
  [[ -f "$file" ]] || die "falta $file."
  echo "✓ $file"
done

for file in \
  scripts/export-portable-backups.sh \
  scripts/install-host-backup-export.sh \
  scripts/restore-portable-backup.sh \
  scripts/portable-compose.sh \
  apps/backup/worker.sh \
  apps/backup/scheduler.sh
do
  bash -n "$file" || die "error de sintaxis en $file."
done

grep -Fq 'source_revision=' apps/backup/worker.sh || die 'el manifiesto no registra la revisión de código.'
grep -Fq 'BLOODKEEPER_SOURCE_REVISION' compose.deploy.yaml || die 'Compose no transmite la revisión de código al trabajador.'
grep -Fq 'No se requiere crontab para las copias internas' docs/RECOVERY.md || die 'falta distinguir backup interno de exportación al anfitrión.'
grep -Fq 'restore-portable-backup.sh --verify' docs/RECOVERY.md || die 'falta el procedimiento de verificación.'
grep -Fq 'restore-portable-backup.sh --apply' docs/RECOVERY.md || die 'falta el procedimiento de restauración.'
grep -Fq 'install-host-backup-export.sh' docs/RECOVERY.md || die 'falta el procedimiento de exportación opcional.'
if grep -RE 'docker[.]sock|/var/run/docker' apps/backup compose.deploy.yaml >/dev/null 2>&1; then
  die 'el trabajador portable no debe montar el socket Docker.'
fi

"$ROOT/scripts/portable-compose.sh" config --quiet
echo '✓ Compose portable válido; exportador, retención, manifiesto y restaurador pasan comprobación estática.'

if [[ -n "$VERIFY_ARCHIVE" ]]; then
  "$ROOT/scripts/restore-portable-backup.sh" --verify "$VERIFY_ARCHIVE"
fi
echo 'RECUPERACIÓN PORTABLE VALIDADA'
