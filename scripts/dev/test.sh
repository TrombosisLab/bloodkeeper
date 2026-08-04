#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(
  cd "$(dirname "${BASH_SOURCE[0]}")"
  pwd
)"

source "$SCRIPT_DIR/common.sh"

echo "==============================================="
echo "WEB TESTS"
echo "==============================================="
run_npm web test

echo
echo "==============================================="
echo "API TESTS"
echo "==============================================="
run_npm api test

echo
echo "==============================================="
echo "API INTEGRATION TESTS"
echo "==============================================="
run_npm api test:integration
