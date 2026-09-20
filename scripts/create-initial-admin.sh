#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/.."
  pwd
)"
COMPOSE="$ROOT/scripts/portable-compose.sh"

username="${BLOODKEEPER_ADMIN_USERNAME:-}"
display_name="${BLOODKEEPER_ADMIN_DISPLAY_NAME:-}"
password="${BLOODKEEPER_ADMIN_PASSWORD:-}"

if [ -z "$username$display_name$password" ]; then
  read -r -p 'Nombre de usuario: ' username
  read -r -p 'Nombre visible: ' display_name
  read -r -s -p 'Contraseña (mínimo 12 caracteres): ' password
  printf '\n'
  read -r -s -p 'Repite la contraseña: ' password_repeat
  printf '\n'
  [ "$password" = "$password_repeat" ] || {
    unset password password_repeat
    printf 'ERROR: las contraseñas no coinciden.\n' >&2
    exit 1
  }
  unset password_repeat
elif [ -z "$username" ] || [ -z "$display_name" ] || [ -z "$password" ]; then
  printf 'ERROR: las tres variables BLOODKEEPER_ADMIN_* son obligatorias en conjunto.\n' >&2
  exit 2
fi

api_health="$(
  docker inspect \
    --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' \
    v5r-api \
    2>/dev/null || true
)"

if [ "$api_health" = 'healthy' ]; then
  docker exec -i \
    -e "ADMIN_USERNAME=$username" \
    -e "ADMIN_DISPLAY_NAME=$display_name" \
    -e "ADMIN_PASSWORD=$password" \
    v5r-api \
    node dist/auth/tools/create-initial-admin.js
else
  if docker inspect v5r-api >/dev/null 2>&1; then
    printf 'ERROR: v5r-api existe pero no está saludable; no se usará una PostgreSQL paralela.\n' >&2
    exit 1
  fi

  ADMIN_USERNAME="$username" \
  ADMIN_DISPLAY_NAME="$display_name" \
  ADMIN_PASSWORD="$password" \
    "$COMPOSE" run --rm -T \
      -e ADMIN_USERNAME \
      -e ADMIN_DISPLAY_NAME \
      -e ADMIN_PASSWORD \
      api node dist/auth/tools/create-initial-admin.js
fi

unset username display_name password
