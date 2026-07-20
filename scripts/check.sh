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
echo "== PostgreSQL =="

docker compose exec -T postgres \
  pg_isready \
  -U "${POSTGRES_USER:-v5r_app}" \
  -d "${POSTGRES_DB:-vampiro_v5}"

echo "OK: PostgreSQL disponible"

echo
echo "== Frontend =="

curl --fail --silent --show-error \
  http://127.0.0.1:5173 \
  >/dev/null

echo "OK: frontend accesible"

echo
echo "== API + Base de datos =="

RESPONSE="$(
  curl --fail --silent --show-error \
    http://127.0.0.1:3000/health
)"

echo "$RESPONSE"

echo "$RESPONSE" | grep -q '"status":"ok"'
echo "$RESPONSE" | grep -q '"database":"ok"'

echo "OK: API y PostgreSQL saludables"

echo
echo "== Sistema =="

echo "OK: comprobaciones completadas"
