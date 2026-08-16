#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/.."
  pwd
)"
ENV_FILE="${BLOODKEEPER_ENV_FILE:-$ROOT/.env}"
COMPOSE_FILE="${BLOODKEEPER_COMPOSE_FILE:-$ROOT/compose.deploy.yaml}"
PROJECT_NAME="${BLOODKEEPER_PROJECT_NAME:-bloodkeeper}"

case "$ENV_FILE" in
  /*) ;;
  *) ENV_FILE="$ROOT/$ENV_FILE" ;;
esac
case "$COMPOSE_FILE" in
  /*) ;;
  *) COMPOSE_FILE="$ROOT/$COMPOSE_FILE" ;;
esac
case "$PROJECT_NAME" in
  ''|*[!a-z0-9_-]*|[-_]*)
    printf 'ERROR: nombre de proyecto Docker no válido: %s\n' "$PROJECT_NAME" >&2
    exit 2
    ;;
esac

[ -f "$ENV_FILE" ] || {
  printf 'ERROR: falta %s; ejecuta ./install.sh primero.\n' "$ENV_FILE" >&2
  exit 1
}
[ -f "$COMPOSE_FILE" ] || {
  printf 'ERROR: falta el Compose portable: %s\n' "$COMPOSE_FILE" >&2
  exit 1
}

exec docker compose \
  --env-file "$ENV_FILE" \
  --project-name "$PROJECT_NAME" \
  --file "$COMPOSE_FILE" \
  "$@"
