#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/.."
  pwd
)"

WITH_BACKUP_ARCHIVE=""

usage() {
  cat <<'EOF'
Uso:
  ./scripts/check-deployment.sh
  ./scripts/check-deployment.sh --with-backup COPIA.tar.gz
  ./scripts/check-deployment.sh --help

Opciones:
  --with-backup  Verifica una copia portable en una base temporal,
                 sin sustituir la base activa.
EOF
}

die() {
  echo "ERROR: $*" >&2
  return 1
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --with-backup)
      [ "$#" -ge 2 ] || die "Falta la ruta del paquete portable."
      WITH_BACKUP_ARCHIVE="$2"
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

cd "$ROOT"

echo "== Archivos oficiales =="

for file in \
  compose.yaml \
  .env.example \
  docs/DEPLOYMENT.md \
  docs/RECOVERY.md \
  docs/VALIDATION.md \
  scripts/bootstrap-server.sh \
  scripts/start.sh \
  scripts/stop.sh \
  scripts/check.sh \
  scripts/logs.sh \
  scripts/restore-portable-backup.sh
do
  test -f "$file" ||
    die "Falta $file."

  echo "✓ $file"
done

echo
echo "== Servidor y configuración =="

./scripts/bootstrap-server.sh --check-host
docker compose config --quiet

test -f .env ||
  die "Falta .env."

test "$(stat -c '%a' .env)" = "600" ||
  die ".env debe tener permisos 600."

git check-ignore -q .env ||
  die ".env no está ignorado por Git."

test -z "$(
  git ls-files --error-unmatch .env 2>/dev/null || true
)" ||
  die ".env está versionado."

echo "✓ Host, Compose y entorno correctos"

echo
echo "== Contrato de despliegue =="

grep -Fq 'compose build api web' \
  scripts/bootstrap-server.sh ||
  die "Falta la construcción automatizada de imágenes."

grep -Fq 'npx prisma migrate deploy' \
  scripts/bootstrap-server.sh ||
  die "Falta la aplicación automatizada de migraciones."

grep -Fq 'compose up -d postgres' \
  scripts/bootstrap-server.sh ||
  die "Falta el arranque automatizado de PostgreSQL."

grep -Fq 'compose up -d api web' \
  scripts/bootstrap-server.sh ||
  die "Falta el arranque automatizado de API y web."

grep -Fq 'validate_services' \
  scripts/bootstrap-server.sh ||
  die "Falta la validación final del despliegue."

grep -Fq 'docker compose up -d' \
  scripts/start.sh ||
  die "start.sh no inicia los servicios."

grep -Fq 'docker compose down' \
  scripts/stop.sh ||
  die "stop.sh no detiene los servicios."

if grep -Eq \
  'docker compose down[[:space:]].*(--volumes|-v)' \
  scripts/stop.sh
then
  die "stop.sh elimina volúmenes."
fi

grep -Fq 'scripts/restore-portable-backup.sh' docs/DEPLOYMENT.md ||
  die "La recuperación de copia portable no está documentada."

grep -Fq '## Recuperación desde servidor limpio' \
  docs/RECOVERY.md ||
  die "Falta el procedimiento de recuperación desde servidor limpio."

grep -Fq 'distribución portable' docs/RECOVERY.md ||
  die "La recuperación no documenta la distribución portable."

grep -Fqi 'No se requiere crontab para las copias internas' docs/RECOVERY.md ||
  die "Las copias internas no documentan su independencia del programador anfitrión."

grep -Fq 'backup-worker' compose.yaml ||
  die "Falta el ejecutor Docker de backups."

grep -Fq 'backup-scheduler' compose.yaml ||
  die "Falta el scheduler Docker de backups."

grep -Fq 'restore-portable-backup.sh --verify' docs/RECOVERY.md ||
  die "Falta el comando de verificación de copias portables."
grep -Fq 'restore-portable-backup.sh --apply' docs/RECOVERY.md ||
  die "Falta el comando de restauración portable."
grep -Fq 'install-host-backup-export.sh' docs/RECOVERY.md ||
  die "Falta la exportación opcional al anfitrión."
test -f scripts/restore-portable-backup.sh || die "Falta el restaurador portable."
test -f scripts/export-portable-backups.sh || die "Falta el exportador portable."
test -f scripts/install-host-backup-export.sh || die "Falta el instalador cron opcional."

grep -Fq 'SPEC-006' \
  docs/DEPLOYMENT.md ||
  die "DEPLOYMENT.md no identifica SPEC-006."

echo "✓ Preparación, construcción, arranque y recuperación documentados"

echo
echo "== Estado operativo =="

./scripts/check-docker-architecture.sh

if [ -n "$WITH_BACKUP_ARCHIVE" ]; then
  echo
  echo "== Verificación portable sin sustituir datos =="
  ./scripts/restore-portable-backup.sh --verify "$WITH_BACKUP_ARCHIVE"
fi

echo
echo "DESPLIEGUE SPEC-006 CORRECTO"
