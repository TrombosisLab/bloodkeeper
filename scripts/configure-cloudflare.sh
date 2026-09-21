#!/usr/bin/env bash
set -Eeuo pipefail

# Configura una publicación Cloudflare opcional para una instalación existente.
# No modifica la instalación local ni guarda secretos en el repositorio.

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if [ -n "${BLOODKEEPER_COMPOSE_FILE:-}" ]; then
  COMPOSE_FILE="$BLOODKEEPER_COMPOSE_FILE"
elif [ -s "$ROOT/compose.yaml" ]; then
  COMPOSE_FILE="$ROOT/compose.yaml"
else
  COMPOSE_FILE="$ROOT/compose.deploy.yaml"
fi
ENV_FILE="${BLOODKEEPER_ENV_FILE:-$ROOT/.env}"
CLOUDFLARE_ENV_FILE="${BLOODKEEPER_CLOUDFLARE_ENV_FILE:-$ROOT/.env.cloudflare}"
PROJECT_NAME="${BLOODKEEPER_PROJECT_NAME:-}"
QUICK_IMAGE="${BLOODKEEPER_CLOUDFLARED_IMAGE:-cloudflare/cloudflared:latest}"
QUICK_CONTAINER=''
QUICK_LOG=''
QUICK_NETWORK=''
QUICK_URL=''
QUICK_ACTIVE='false'
QUICK_OVERRIDE_FILE=''

die() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "falta la dependencia del sistema: $1"
}

prepare_cloudflared_image() {
  image="$1"
  if "${DOCKER[@]}" image inspect "$image" >/dev/null 2>&1; then
    return
  fi

  printf 'Descargando la imagen de Cloudflare: %s\n' "$image"
  "${DOCKER[@]}" pull "$image" \
    || die 'No se pudo descargar la imagen de cloudflared. Revisa la conexión de la VM.'
}

restore_web_without_tunnel_host() {
  if [ -z "$QUICK_OVERRIDE_FILE" ]; then
    return
  fi

  printf 'Restaurando Web sin el hostname temporal de Cloudflare...\n'
  "${COMPOSE[@]}" up -d --force-recreate --no-deps web >/dev/null 2>&1 || \
    printf 'ADVERTENCIA: no se pudo recrear Web sin el hostname temporal.\n' >&2
  rm -f "$QUICK_OVERRIDE_FILE"
  QUICK_OVERRIDE_FILE=''
}

write_quick_compose_override() {
  local host="${QUICK_URL#https://}"
  [[ "$host" =~ ^[A-Za-z0-9.-]+$ ]] || die 'El hostname recibido de Cloudflare no es válido.'

  QUICK_OVERRIDE_FILE="${TMPDIR:-/tmp}/bloodkeeper-cloudflare-quick-${PROJECT_NAME}.compose.yaml"
  umask 077
  printf '%s\n' \
    'services:' \
    '  web:' \
    '    environment:' \
    "      BLOODKEEPER_VITE_ALLOWED_HOSTS: $host" \
    > "$QUICK_OVERRIDE_FILE"
}

cleanup_quick_tunnel() {
  if [ "$QUICK_ACTIVE" = 'true' ] || [ -n "$QUICK_OVERRIDE_FILE" ]; then
    printf '\nApagando el túnel temporal...\n'
    "${DOCKER[@]}" rm -f "$QUICK_CONTAINER" >/dev/null 2>&1 || true
    QUICK_ACTIVE='false'
    restore_web_without_tunnel_host
  fi
}

trap cleanup_quick_tunnel EXIT INT TERM

if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  DOCKER=(docker)
elif command -v sudo >/dev/null 2>&1 && sudo docker info >/dev/null 2>&1; then
  DOCKER=(sudo docker)
else
  die 'Docker no está disponible para el usuario actual.'
fi

require_command grep
require_command sed
require_command tail
require_command seq
"${DOCKER[@]}" compose version >/dev/null 2>&1 \
  || die 'Docker Compose no está disponible. Ejecuta primero install.sh.'

find_running_web_container() {
  if [ -n "$PROJECT_NAME" ]; then
    "${DOCKER[@]}" ps -q \
      --filter 'label=com.docker.compose.service=web' \
      --filter "label=com.docker.compose.project=$PROJECT_NAME" \
      | sed -n '1p'
  else
    "${DOCKER[@]}" ps -q \
      --filter 'label=com.docker.compose.service=web' \
      | sed -n '1p'
  fi
}

running_web_container="$(find_running_web_container)"
if [ -z "$PROJECT_NAME" ] && [ -n "$running_web_container" ]; then
  PROJECT_NAME="$("${DOCKER[@]}" inspect "$running_web_container" \
    --format '{{index .Config.Labels "com.docker.compose.project"}}')"
fi
PROJECT_NAME="${PROJECT_NAME:-$(basename "$ROOT")}"
QUICK_CONTAINER="${PROJECT_NAME}-cloudflare-quick"
QUICK_LOG="${TMPDIR:-/tmp}/bloodkeeper-cloudflare-quick-${PROJECT_NAME}.log"

[ -s "$COMPOSE_FILE" ] || die "falta el archivo Compose: $COMPOSE_FILE"
[ -s "$ENV_FILE" ] || die "falta la configuración local: $ENV_FILE. Ejecuta primero install.sh."

COMPOSE=(
  "${DOCKER[@]}" compose
  --env-file "$ENV_FILE"
  --project-name "$PROJECT_NAME"
  --file "$COMPOSE_FILE"
)

compose_cloudflare=(
  "${COMPOSE[@]}"
  --env-file "$CLOUDFLARE_ENV_FILE"
  --file "$ROOT/compose.cloudflare.yaml"
)

get_web_container() {
  running_web_container="$(find_running_web_container)"
  if [ -n "$running_web_container" ]; then
    printf '%s' "$running_web_container"
    return
  fi
  "${COMPOSE[@]}" ps -q web 2>/dev/null || true
}

get_application_network() {
  web_container="$(get_web_container)"
  [ -n "$web_container" ] || die 'El contenedor web no está levantado. Ejecuta primero install.sh.'

  network="$("${DOCKER[@]}" inspect "$web_container" \
    --format '{{range $name, $value := .NetworkSettings.Networks}}{{println $name}}{{end}}' \
    | sed -n '1p')"
  [ -n "$network" ] || die 'No se pudo localizar la red Docker de BloodKeeper.'
  printf '%s' "$network"
}

quick_container_is_running() {
  state="$("${DOCKER[@]}" inspect \
    --format '{{.State.Running}}' \
    "$QUICK_CONTAINER" 2>/dev/null || true)"
  [ "$state" = 'true' ]
}

start_quick_tunnel() {
  QUICK_NETWORK="$(get_application_network)"
  prepare_cloudflared_image "$QUICK_IMAGE"
  : > "$QUICK_LOG"

  "${DOCKER[@]}" rm -f "$QUICK_CONTAINER" >/dev/null 2>&1 || true
  printf 'Iniciando túnel temporal...\n'
  "${DOCKER[@]}" run --rm \
    --name "$QUICK_CONTAINER" \
    --network "$QUICK_NETWORK" \
    "$QUICK_IMAGE" \
    tunnel --no-autoupdate --url http://web:5173 \
    >"$QUICK_LOG" 2>&1 &
  QUICK_ACTIVE='true'

  for _ in $(seq 1 60); do
    QUICK_URL="$(sed -nE 's/.*(https:\/\/[^[:space:]]+\.trycloudflare\.com).*/\1/p' "$QUICK_LOG" | tail -n 1 || true)"
    if [ -n "$QUICK_URL" ]; then
      break
    fi
    sleep 1
  done

  if [ -z "$QUICK_URL" ]; then
    if ! quick_container_is_running; then
      cat "$QUICK_LOG" >&2
      die 'El túnel temporal terminó antes de obtener una URL.'
    fi
    die "No se obtuvo la URL temporal después de 60 segundos. Revisa $QUICK_LOG"
  fi

  write_quick_compose_override
  printf 'Aplicando temporalmente el hostname a Vite...\n'
  "${COMPOSE[@]}" --file "$QUICK_OVERRIDE_FILE" up -d --force-recreate --no-deps web

  printf '\n============================================================\n'
  printf 'TÚNEL TEMPORAL ACTIVO\n'
  printf '============================================================\n'
  printf 'URL: %s\n' "$QUICK_URL"
  printf 'Esta URL deja de funcionar al apagar este script.\n'
  printf 'Es una prueba temporal y no configura Cloudflare Access.\n'
  printf 'Log: %s\n' "$QUICK_LOG"
}

quick_menu() {
  while [ "$QUICK_ACTIVE" = 'true' ]; do
    printf '\n¿Qué quieres hacer?\n'
    printf '  [m] Mantener el túnel abierto\n'
    printf '  [e] Ver estado\n'
    printf '  [l] Ver últimas líneas del log\n'
    printf '  [a] Apagar el túnel\n'
    printf '  [q] Salir y apagar el túnel\n'
    read -r -p 'Opción: ' action
    case "$action" in
      m|M)
        printf 'El túnel sigue activo en %s\n' "$QUICK_URL"
        ;;
      e|E)
        if quick_container_is_running; then
          printf 'Estado: activo\n'
        else
          printf 'Estado: detenido\n'
          QUICK_ACTIVE='false'
        fi
        ;;
      l|L)
        tail -n 20 "$QUICK_LOG" || true
        ;;
      a|A|q|Q)
        cleanup_quick_tunnel
        ;;
      *)
        printf 'Opción no reconocida.\n'
        ;;
    esac
  done
}

configure_named_tunnel() {
  [ -s "$ROOT/compose.cloudflare.yaml" ] || die 'falta compose.cloudflare.yaml para activar el túnel permanente.'

  printf '\nEl túnel permanente requiere:\n'
  printf '  1. Un dominio activo en Cloudflare.\n'
  printf '  2. Un Named Tunnel creado desde Zero Trust.\n'
  printf '  3. La ruta pública apuntando a http://web:5173.\n'
  printf '  4. Una aplicación Access con los correos autorizados.\n\n'
  printf 'Consulta: https://developers.cloudflare.com/tunnel/get-started/\n'
  printf 'Consulta: https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/self-hosted-public-app/\n\n'

  hostname=''
  read -r -p 'Hostname público (ej. app.trombosis.eu): ' hostname
  [[ "$hostname" =~ ^[A-Za-z0-9.-]+$ ]] || die 'El hostname no es válido.'

  printf 'Pega el token del túnel. No se mostrará ni se guardará en Git.\n'
  read -r -s -p 'Token Cloudflare: ' token
  printf '\n'
  [ -n "$token" ] || die 'El token no puede estar vacío.'

  umask 077
  printf 'BLOODKEEPER_PUBLIC_HOSTNAME=%s\n' "$hostname" > "$CLOUDFLARE_ENV_FILE"
  printf 'CLOUDFLARE_TUNNEL_TOKEN=%s\n' "$token" >> "$CLOUDFLARE_ENV_FILE"
  chmod 600 "$CLOUDFLARE_ENV_FILE"
  unset token

  "${compose_cloudflare[@]}" config --quiet
  prepare_cloudflared_image "$QUICK_IMAGE"
  "${compose_cloudflare[@]}" up -d cloudflared

  printf '\nCloudflare Tunnel activado para %s\n' "$hostname"
  printf 'Configuración privada: %s\n' "$CLOUDFLARE_ENV_FILE"
}

printf 'BLOODKEEPER — PUBLICACIÓN OPCIONAL\n'
printf 'Instalación local detectada en: %s\n\n' "$ROOT"
printf '  [1] Tunnel temporal de prueba\n'
printf '  [2] Tunnel permanente + Access\n'
printf '  [q] Cancelar\n'
read -r -p 'Elige una opción: ' mode

case "$mode" in
  1)
    start_quick_tunnel
    quick_menu
    ;;
  2)
    configure_named_tunnel
    ;;
  q|Q)
    printf 'No se ha cambiado la configuración de BloodKeeper.\n'
    ;;
  *)
    die 'Opción no válida.'
    ;;
esac
