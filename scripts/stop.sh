#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/.."

echo "Deteniendo Vampiro V5 Revolution..."

docker compose down
