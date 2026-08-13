#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(
  cd "$(dirname "${BASH_SOURCE[0]}")"
  pwd
)"

ROOT="$(
  cd "$SCRIPT_DIR/../.."
  pwd
)"

cd "$ROOT"

echo "==============================================="
echo "GIT Y SHELL"
echo "==============================================="
git diff --check
bash -n scripts/*.sh
bash -n scripts/dev/*.sh
echo "✓ Diff y sintaxis shell"

echo
echo "==============================================="
echo "COMPOSE Y ESTRUCTURA"
echo "==============================================="
docker compose config --quiet
./scripts/check-project-structure.sh
./scripts/check-docker-architecture.sh

echo
"$SCRIPT_DIR/format.sh"

echo
"$SCRIPT_DIR/lint.sh"

echo
"$SCRIPT_DIR/release-check.sh" --version-only

echo
"$SCRIPT_DIR/typecheck.sh"

echo
"$SCRIPT_DIR/test.sh"

echo
"$SCRIPT_DIR/build.sh"

echo
echo "==============================================="
echo "SMOKE TEST FINAL"
echo "==============================================="
./scripts/check.sh

echo
echo "VALIDACIÓN DE DESARROLLO COMPLETA"
