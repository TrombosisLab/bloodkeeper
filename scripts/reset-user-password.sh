#!/usr/bin/env bash

ROOT="$HOME/vampiro-v5-revolution"

main() {
  cd "$ROOT" || return 1

  local username
  local password
  local password_repeat
  local result

  read -r -p "Nombre de usuario existente: " username
  read -r -s -p "Nueva contraseña (mínimo 12 caracteres): " password
  echo
  read -r -s -p "Repite la nueva contraseña: " password_repeat
  echo

  if [ "$password" != "$password_repeat" ]; then
    echo "Las contraseñas no coinciden."
    unset password password_repeat
    return 1
  fi

  docker compose run     --rm     -T     -e RECOVERY_USERNAME="$username"     -e RECOVERY_PASSWORD="$password"     api     npm run admin:reset-password

  result="$?"

  unset password password_repeat

  return "$result"
}

main
RESULT="$?"

[ "$RESULT" -eq 0 ]
