#!/usr/bin/env bash
set -Eeuo pipefail
command -v python3 >/dev/null || { echo 'ERROR: falta python3'; exit 1; }
exec python3 "$(dirname "${BASH_SOURCE[0]}")/change-database-password.py" "$@"
