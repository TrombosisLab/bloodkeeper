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

echo "== Directorios raíz =="

for directory in \
  apps \
  backups \
  docker \
  docs \
  packages \
  scripts
do
  test -d "$directory" ||
    die "Falta el directorio $directory."

  echo "✓ $directory"
done

for obsolete in \
  app \
  modules \
  tests \
  logs \
  prompts
do
  test ! -e "$obsolete" ||
    die "Existe el directorio raíz redundante $obsolete."
done

echo
echo "== Aplicaciones y paquete compartido =="

for path in \
  apps/api/src \
  apps/api/tests \
  apps/api/prisma \
  apps/web/src \
  apps/web/tests \
  packages/character-rules
do
  test -d "$path" ||
    die "Falta $path."

  echo "✓ $path"
done

manifest_name() {
  local file="$1"

  python3 - "$file" <<'PYJSON'
import json
import sys

with open(sys.argv[1], encoding="utf-8") as stream:
    manifest = json.load(stream)

name = manifest.get("name")

if not isinstance(name, str):
    raise SystemExit(1)

print(name)
PYJSON
}

test "$(
  manifest_name apps/api/package.json
)" = "@v5r/api" ||
  die "El manifiesto API no tiene la identidad esperada."

test "$(
  manifest_name apps/web/package.json
)" = "@v5r/web" ||
  die "El manifiesto web no tiene la identidad esperada."

test "$(
  manifest_name packages/character-rules/package.json
)" = "@v5r/character-rules" ||
  die "El paquete compartido no tiene la identidad esperada."

grep -Fq \
  '"@v5r/character-rules": "file:../../packages/character-rules"' \
  apps/api/package.json ||
  die "API no consume el paquete compartido."

grep -Fq \
  '"@v5r/character-rules": "file:../../packages/character-rules"' \
  apps/web/package.json ||
  die "Web no consume el paquete compartido."

echo "✓ Identidades y dependencia compartida"

echo
echo "== Pruebas =="

api_tests="$(
  find apps/api/tests \
    -maxdepth 1 \
    -type f \
    \( -name '*.test.mjs' -o -name '*.integration.mjs' \) |
    wc -l |
    tr -d ' '
)"

web_tests="$(
  find apps/web/tests \
    -maxdepth 1 \
    -type f \
    -name '*.test.mjs' |
    wc -l |
    tr -d ' '
)"

test "$api_tests" -gt 0 ||
  die "API no contiene pruebas."

test "$web_tests" -gt 0 ||
  die "Web no contiene pruebas."

unexpected_tests="$(
  find . \
    -type f \
    \( \
      -name '*.test.*' -o \
      -name '*.spec.*' -o \
      -name '*.integration.*' \
    \) \
    -not -path './apps/api/tests/*' \
    -not -path './apps/web/tests/*' \
    -not -path './.git/*' \
    -not -path '*/node_modules/*' \
    -not -path '*/dist/*' \
    -print
)"

test -z "$unexpected_tests" || {
  echo "$unexpected_tests"
  die "Existen pruebas fuera de sus aplicaciones."
}

echo "✓ API: $api_tests archivos de prueba"
echo "✓ Web: $web_tests archivos de prueba"

echo
echo "== Scripts y código raíz =="

unexpected_scripts="$(
  find . \
    -type f \
    \( -name '*.sh' -o -name '*.bash' \) \
    -not -path './scripts/*' \
    -not -path './install.sh' \
    -not -path './apps/backup/worker.sh' \
    -not -path './.git/*' \
    -not -path '*/node_modules/*' \
    -not -path '*/dist/*' \
    -print
)"

test -z "$unexpected_scripts" || {
  echo "$unexpected_scripts"
  die "Existen scripts fuera de scripts/."
}

root_source="$(
  find . \
    -mindepth 1 \
    -maxdepth 1 \
    -type f \
    \( \
      -name '*.ts' -o \
      -name '*.tsx' -o \
      -name '*.js' -o \
      -name '*.mjs' -o \
      -name '*.cjs' \
    \) \
    -print
)"

test -z "$root_source" || {
  echo "$root_source"
  die "Existe código fuente ambiguo en la raíz."
}

echo "✓ Automatización y código correctamente ubicados"

echo
echo "== Documentación =="

unexpected_docs="$(
  find . \
    -type f \
    -name '*.md' \
    -not -path './docs/*' \
    -not -path './README.md' \
    -not -path './backups/README.md' \
    -not -path './docker/README.md' \
    -not -path './scripts/README.md' \
    -not -path './.git/*' \
    -not -path '*/node_modules/*' \
    -not -path '*/dist/*' \
    -print
)"

test -z "$unexpected_docs" || {
  echo "$unexpected_docs"
  die "Existe documentación fuera de las ubicaciones permitidas."
}

test -f docs/PROJECT_STRUCTURE.md ||
  die "Falta la documentación de estructura."

echo "✓ Documentación correctamente ubicada"

echo
echo "== Secretos y datos de ejecución =="

test -f .env ||
  die "Falta .env."

test "$(stat -c '%a' .env)" = "600" ||
  die ".env debe tener permisos 600."

git check-ignore -q .env ||
  die ".env no está ignorado por Git."

test -z "$(git ls-files --error-unmatch .env 2>/dev/null || true)" ||
  die ".env está versionado."

runtime_files="$(
  git ls-files |
    grep -E \
      '(^|/)(logs?|backups?)/.*\.(log|dump|sql|tar|tgz|gz|zip)$' \
    || true
)"

test -z "$runtime_files" || {
  echo "$runtime_files"
  die "Hay datos de ejecución versionados."
}

echo "✓ Secretos, logs y backups fuera del repositorio"

echo
echo "== Compose y operación =="

docker compose config --quiet
./scripts/check.sh

echo
echo "ESTRUCTURA DEL PROYECTO CORRECTA"
