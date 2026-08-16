#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/.."
  pwd
)"
COMPOSE="$ROOT/scripts/portable-compose.sh"

username="${BLOODKEEPER_RECOVERY_USERNAME:-}"
password="${BLOODKEEPER_RECOVERY_PASSWORD:-}"

if [ -z "$username$password" ]; then
  read -r -p 'Nombre de usuario existente: ' username
  read -r -s -p 'Nueva contraseña (mínimo 12 caracteres): ' password
  printf '\n'
  read -r -s -p 'Repite la nueva contraseña: ' password_repeat
  printf '\n'
  [ "$password" = "$password_repeat" ] || {
    unset password password_repeat
    printf 'ERROR: las contraseñas no coinciden.\n' >&2
    exit 1
  }
  unset password_repeat
elif [ -z "$username" ] || [ -z "$password" ]; then
  printf 'ERROR: BLOODKEEPER_RECOVERY_USERNAME y PASSWORD son obligatorias en conjunto.\n' >&2
  exit 2
fi

RECOVERY_USERNAME="$username" \
RECOVERY_PASSWORD="$password" \
  "$COMPOSE" run --rm -T \
    -e RECOVERY_USERNAME \
    -e RECOVERY_PASSWORD \
    api node dist/auth/tools/reset-user-password.js

unset username password
