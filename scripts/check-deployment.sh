#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/.."
  pwd
)"

WITH_BACKUP="false"
TEMP_DIR=""

usage() {
  cat <<'EOF'
Uso:
  ./scripts/check-deployment.sh
  ./scripts/check-deployment.sh --with-backup
  ./scripts/check-deployment.sh --help

Opciones:
  --with-backup  Crea una copia temporal y verifica su restauración
                 sin sustituir la base activa.
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
  scripts/backup.sh \
  scripts/restore.sh
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

grep -Fq './scripts/backup.sh' \
  docs/DEPLOYMENT.md ||
  die "El backup previo no está documentado."

grep -Fq './scripts/restore.sh --verify' \
  docs/DEPLOYMENT.md ||
  die "La verificación de backup no está documentada."

grep -Fq '## Recuperación desde servidor limpio' \
  docs/RECOVERY.md ||
  die "Falta el procedimiento de recuperación desde servidor limpio."

grep -Fq 'Ubuntu Server 24.04 LTS.' \
  docs/RECOVERY.md ||
  die "La recuperación no identifica el servidor Ubuntu LTS."

grep -Fq './scripts/restore-full.sh' \
  docs/RECOVERY.md ||
  die "La recuperación completa no documenta restore-full.sh."

grep -Fq './scripts/bootstrap-server.sh' \
  docs/RECOVERY.md ||
  die "La recuperación completa no documenta bootstrap-server.sh."

grep -Fq 'restore.sh --apply' \
  docs/RECOVERY.md ||
  die "La recuperación completa no documenta la restauración de base."

grep -Fq './scripts/check.sh' \
  docs/RECOVERY.md ||
  die "La recuperación completa no documenta la validación final."

test -x scripts/restore-full.sh ||
  die "restore-full.sh no está disponible o no es ejecutable."

test -x scripts/restore.sh ||
  die "restore.sh no está disponible o no es ejecutable."

grep -Fq 'SPEC-006' \
  docs/DEPLOYMENT.md ||
  die "DEPLOYMENT.md no identifica SPEC-006."

echo "✓ Preparación, construcción, arranque y recuperación documentados"

echo
echo "== Estado operativo =="

./scripts/check-docker-architecture.sh

if [ "$WITH_BACKUP" = "true" ]; then
  echo
  echo "== Backup y restauración temporal =="

  TEMP_DIR="$(
    mktemp -d /tmp/bloodkeeper-spec006-check.XXXXXX
  )"

  archive="$(
    ./scripts/backup.sh \
      --output-dir "$TEMP_DIR" \
      --quiet |
    tail -n 1
  )"

  test -s "$archive" ||
    die "El backup está vacío."

  test -s "$archive.sha256" ||
    die "Falta el checksum del backup."

  test -s "$archive.meta" ||
    die "Faltan los metadatos del backup."

  ./scripts/restore.sh --verify "$archive"

  echo "✓ Backup real y restauración temporal correctos"
fi

echo
echo "DESPLIEGUE SPEC-006 CORRECTO"
