#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(
  cd "$(dirname "${BASH_SOURCE[0]}")"
  pwd
)"

source "$SCRIPT_DIR/common.sh"

echo "==============================================="
echo "API TYPECHECK"
echo "==============================================="
run_npm api typecheck

echo
echo "==============================================="
echo "WEB TYPECHECK"
echo "==============================================="
run_npm web typecheck
