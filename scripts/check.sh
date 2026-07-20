#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/.."

echo "== Docker Compose =="
docker compose config --quiet

echo "== Contenedores =="
docker compose ps

echo "== Frontend =="
curl --fail --silent --show-error \
  http://127.0.0.1:5173 \
  >/dev/null

echo "OK: frontend accesible"
