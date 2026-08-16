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
  'pull_failed_for_authentication' \
  'gh auth token'
do
  grep -Fq "$contract" install.sh \
    || die "falta el contrato del instalador: $contract"
done

grep -Fq \
  'bash "$ROOT/scripts/bootstrap-server.sh" --prepare-host' \
  install.sh \
  || die 'install.sh no reutiliza el adaptador Ubuntu'

grep -Fq \
  'La falta de espacio no activa un reintento de autenticación' \
  docs/PORTABLE_INSTALLATION.md \
  || die 'falta documentar la clasificación de errores'

grep -Fq \
  'BLOODKEEPER_AUTO_INSTALL_DOCKER=1' \
  docs/PORTABLE_INSTALLATION.md \
  || die 'falta documentar la preparación automática no interactiva'

grep -Fq \
  './scripts/check-portable-installer.sh' \
  .github/workflows/publish-images.yml \
  || die 'CI no valida el instalador portátil'

printf 'INSTALADOR PORTÁTIL: CONTRATO CORRECTO\n'
