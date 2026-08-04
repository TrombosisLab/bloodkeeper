#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$HOME/vampiro-v5-revolution"

cd "$ROOT"

test -z "$(git status --porcelain)" || {
  echo "El working tree debe estar limpio antes de crear la cuenta."
  exit 1
}

read -r -p "Nombre de usuario: " username
read -r -p "Nombre visible: " display_name
read -r -s -p "Contraseña (mínimo 12 caracteres): " password
echo
read -r -s -p "Repite la contraseña: " password_repeat
echo

if [ "$password" != "$password_repeat" ]; then
  echo "Las contraseñas no coinciden."
  exit 1
fi

docker compose run \
  --rm \
  -T \
  -e ADMIN_USERNAME="$username" \
  -e ADMIN_DISPLAY_NAME="$display_name" \
  -e ADMIN_PASSWORD="$password" \
  api \
  npm run admin:create

unset password password_repeat
