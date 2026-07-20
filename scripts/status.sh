#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/.."

echo "== Contenedores =="

docker compose ps

echo
echo "== API =="

if curl -fsS \
  http://127.0.0.1:3000/health
then
  echo
else
  echo "API no disponible"
fi

echo
echo "== Disco =="

df -h /
