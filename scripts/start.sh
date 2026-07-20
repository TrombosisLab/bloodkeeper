#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/.."

echo "Iniciando Vampiro V5 Revolution..."

docker compose up -d

echo
docker compose ps
