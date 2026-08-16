#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/.."
  pwd
)"

die() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

cd "$ROOT"

bash -n install.sh scripts/bootstrap-server.sh

for contract in \
  'prepare_docker' \
  'BLOODKEEPER_AUTO_INSTALL_DOCKER' \
  'configure_docker_access' \
  'BLOODKEEPER_WARN_FREE_MB' \
  'no space left on device' \
  'BLOODKEEPER_SKIP_BUILD' \
  'build_images' \
  '"${COMPOSE[@]}" build --pull'
do
  grep -Fq "$contract" install.sh \
    || die "falta el contrato del instalador: $contract"
done

grep -Fq \
  'bash "$ROOT/scripts/bootstrap-server.sh" --prepare-host' \
  install.sh \
  || die 'install.sh no reutiliza el adaptador Ubuntu'

grep -Fq \
  'construye localmente las imágenes release' \
  docs/PORTABLE_INSTALLATION.md \
  || die 'falta documentar la construcción local'

grep -Fq \
  'BLOODKEEPER_AUTO_INSTALL_DOCKER=1' \
  docs/PORTABLE_INSTALLATION.md \
  || die 'falta documentar la preparación automática no interactiva'

grep -Fq \
  './scripts/check-portable-installer.sh' \
  .github/workflows/validate-local-builds.yml \
  || die 'CI no valida el instalador portátil'

for dockerfile in \
  'apps/api/Dockerfile.release' \
  'apps/web/Dockerfile.release' \
  'apps/backup/Dockerfile'
do
  grep -Fq "dockerfile: $dockerfile" compose.deploy.yaml \
    || die "compose.deploy.yaml no construye $dockerfile"
done

if grep -Eiq \
  'ghcr\.io|docker[[:space:]]+login|gh auth token|BLOODKEEPER_SKIP_PULL' \
  install.sh compose.deploy.yaml; then
  die 'el instalador conserva una dependencia de registro privado'
fi

POSTGRES_DB=bloodkeeper \
POSTGRES_USER=bloodkeeper \
POSTGRES_PASSWORD=validation-only \
DATABASE_URL='postgresql://bloodkeeper:validation-only@postgres:5432/bloodkeeper?schema=public' \
  docker compose --file compose.deploy.yaml config --quiet

printf 'INSTALADOR PORTÁTIL: CONTRATO CORRECTO\n'
