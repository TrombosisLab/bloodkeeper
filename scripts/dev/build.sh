#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(
  cd "$(dirname "${BASH_SOURCE[0]}")"
  pwd
)"

source "$SCRIPT_DIR/common.sh"

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
