#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "==============================================="
echo "WEB TYPECHECK"
echo "==============================================="
"$SCRIPT_DIR/typecheck.sh"

echo
echo "==============================================="
echo "WEB TESTS"
echo "==============================================="
"$SCRIPT_DIR/test.sh"

echo
echo "==============================================="
echo "WEB BUILD"
echo "==============================================="
"$SCRIPT_DIR/build.sh"
