#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/.."

echo "== Docker Compose =="

docker compose config --quiet

echo "OK: configuración válida"

echo
echo "== Estado Docker =="

docker compose ps

echo
echo "== Health de contenedores =="

for container in \
  v5r-postgres \
  v5r-api \
  v5r-web
do

  STATUS="$(
    docker inspect \
      --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' \
      "$container"
  )"

  echo "$container: $STATUS"

  if [ "$STATUS" != "healthy" ]; then
    echo "ERROR: $container no está saludable"
    exit 1
  fi

done

echo
echo "== Frontend =="

curl -fsS \
  http://127.0.0.1:5173 \
  >/dev/null

echo "OK: frontend accesible"

echo
echo "== API + PostgreSQL =="

RESPONSE="$(
  curl -fsS \
    http://127.0.0.1:3000/health
)"

echo "$RESPONSE"

echo "$RESPONSE" |
  grep -q '"status":"ok"'

echo "$RESPONSE" |
  grep -q '"database":"ok"'

echo "OK: API y PostgreSQL saludables"

echo
echo "== Integración Web -> API =="

PROXY_RESPONSE="$(
  curl -fsS \
    http://127.0.0.1:5173/api/health
)"

echo "$PROXY_RESPONSE"

echo "$PROXY_RESPONSE" |
  grep -q '"database":"ok"'

echo "OK: frontend comunica con API"

echo
echo "TODAS LAS COMPROBACIONES CORRECTAS"
