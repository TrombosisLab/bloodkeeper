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

cd "$ROOT"

echo "== Git =="

git rev-parse --is-inside-work-tree |
  grep -Fxq true ||
  die "La ruta actual no es un repositorio Git."

branch="$(
  git branch --show-current
)"

test -n "$branch" ||
  die "No existe una rama Git activa."

echo "Rama: $branch"
git status --short --branch
git diff --check

echo
echo "== Documentación =="

for file in \
  docs/DEVELOPMENT_WORKFLOW.md \
  docs/VALIDATION.md \
  docs/PROJECT_STRUCTURE.md \
  docs/DOCKER_ARCHITECTURE.md
do
  test -f "$file" ||
    die "Falta $file."

  echo "✓ $file"
done

grep -Fq 'SPEC-005' docs/DEVELOPMENT_WORKFLOW.md ||
  die "El workflow no identifica SPEC-005."

grep -Fq './scripts/dev/check.sh' docs/DEVELOPMENT_WORKFLOW.md ||
  die "El workflow no documenta la validación estándar."

grep -Fq 'No se hace push sin autorización expresa' \
  docs/DEVELOPMENT_WORKFLOW.md ||
  die "No está documentado el control de push."

echo
echo "== Automatización =="

for file in \
  scripts/dev/common.sh \
  scripts/dev/typecheck.sh \
  scripts/dev/test.sh \
  scripts/dev/build.sh \
  scripts/dev/check.sh
do
  test -x "$file" ||
    die "$file no es ejecutable."

  bash -n "$file"
  echo "✓ $file"
done

if grep -RInE \
  'run_pnpm|corepack[[:space:]]+pnpm|pnpm[[:space:]]+--filter' \
  scripts/dev
then
  die "Persisten comandos pnpm obsoletos."
fi

grep -Fq 'run_npm api typecheck' \
  scripts/dev/typecheck.sh ||
  die "Falta typecheck de API."

grep -Fq 'run_npm web typecheck' \
  scripts/dev/typecheck.sh ||
  die "Falta typecheck de web."

grep -Fq 'run_npm api test:integration' \
  scripts/dev/test.sh ||
  die "Faltan pruebas de integración."

grep -Fq 'run_container api npx prisma validate' \
  scripts/dev/build.sh ||
  die "Falta validación Prisma."

echo "✓ npm y Docker son el flujo oficial"

echo
echo "== Validación completa =="

./scripts/dev/check.sh

echo
echo "WORKFLOW DE DESARROLLO CORRECTO"
