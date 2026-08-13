#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(
  cd "$(dirname "${BASH_SOURCE[0]}")"
  pwd
)"

source "$SCRIPT_DIR/common.sh"

echo "==============================================="
echo "LOCKFILES Y BUILD REPRODUCIBLE"
echo "==============================================="

test -f "$ROOT/apps/api/package-lock.json"
test -f "$ROOT/apps/web/package-lock.json"

grep -Fq 'COPY --chown=node:node apps/api/package*.json ./apps/api/' "$ROOT/apps/api/Dockerfile"
grep -Fq 'RUN npm ci' "$ROOT/apps/api/Dockerfile"
grep -Fq 'COPY --chown=node:node apps/web/package*.json ./apps/web/' "$ROOT/apps/web/Dockerfile"
grep -Fq 'RUN npm ci' "$ROOT/apps/web/Dockerfile"

echo "✓ API y Web usan package-lock.json + npm ci"
echo
echo "==============================================="
echo "PRISMA VALIDATE"
echo "==============================================="
run_container api npx prisma validate

echo
echo "==============================================="
echo "API BUILD"
echo "==============================================="
run_npm api build

echo
echo "==============================================="
echo "WEB BUILD"
echo "==============================================="
run_npm web build
