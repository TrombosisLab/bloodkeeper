#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/.."

echo
echo "== Docker Compose =="

docker compose config --quiet

echo "OK: configuración válida"

echo
echo "== Contenedores =="

docker compose ps

echo
echo "== Frontend =="

curl --fail --silent --show-error \
  http://127.0.0.1:5173 \
  >/dev/null

echo "OK: frontend accesible"

echo
echo "== API =="

RESPONSE="$(curl --fail --silent --show-error \
  http://127.0.0.1:3000/health)"

echo "$RESPONSE"

echo "$RESPONSE" | grep -q '"status":"ok"'

echo "OK: API saludable"

echo
echo "== Sistema =="

echo "OK: comprobaciones completadas"
