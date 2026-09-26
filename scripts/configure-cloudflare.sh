#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${BLOODKEEPER_COMPOSE_FILE:-$ROOT/compose.yaml}"
ENV_FILE="${BLOODKEEPER_ENV_FILE:-$ROOT/.env}"
CLOUDFLARE_ENV_FILE="${BLOODKEEPER_CLOUDFLARE_ENV_FILE:-$ROOT/.env.cloudflare}"
PROJECT_NAME="${BLOODKEEPER_PROJECT_NAME:-}"
CLOUDFLARED_IMAGE="${BLOODKEEPER_CLOUDFLARED_IMAGE:-cloudflare/cloudflared:latest}"

QUICK_CONTAINER=""
QUICK_LOG=""
QUICK_NETWORK=""
QUICK_URL=""
QUICK_ACTIVE="false"
QUICK_OVERRIDE_FILE=""
NAMED_OVERRIDE_FILE=""

die() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

[ -f "$COMPOSE_FILE" ] || die "No existe $COMPOSE_FILE"
[ -f "$ENV_FILE" ] || die "No existe $ENV_FILE"

if docker info >/dev/null 2>&1; then
  DOCKER=(docker)
elif sudo docker info >/dev/null 2>&1; then
  DOCKER=(sudo docker)
else
  die "Docker no está disponible."
fi

"${DOCKER[@]}" compose version >/dev/null 2>&1 \
  || die "Docker Compose no está disponible."

running_web_container="$(
  "${DOCKER[@]}" ps -q \
    --filter 'label=com.docker.compose.service=web' \
    | sed -n '1p'
)"

if [ -z "$PROJECT_NAME" ] && [ -n "$running_web_container" ]; then
  PROJECT_NAME="$(
    "${DOCKER[@]}" inspect "$running_web_container" \
      --format '{{index .Config.Labels "com.docker.compose.project"}}'
  )"
fi

PROJECT_NAME="${PROJECT_NAME:-$(basename "$ROOT")}"

QUICK_CONTAINER="${PROJECT_NAME}-cloudflare-quick"
QUICK_LOG="${TMPDIR:-/tmp}/bloodkeeper-cloudflare-quick-${PROJECT_NAME}.log"
NAMED_OVERRIDE_FILE="${TMPDIR:-/tmp}/bloodkeeper-cloudflare-named-${PROJECT_NAME}.compose.yaml"

COMPOSE=(
  "${DOCKER[@]}" compose
  --env-file "$ENV_FILE"
  --project-name "$PROJECT_NAME"
  --file "$COMPOSE_FILE"
)

COMPOSE_CLOUDFLARE=(
  "${COMPOSE[@]}"
  --env-file "$CLOUDFLARE_ENV_FILE"
  --file "$ROOT/compose.cloudflare.yaml"
)

prepare_cloudflared_image() {
  if "${DOCKER[@]}" image inspect "$CLOUDFLARED_IMAGE" >/dev/null 2>&1; then
    return
  fi

  printf 'Descargando la imagen de Cloudflare...\n'
  "${DOCKER[@]}" pull "$CLOUDFLARED_IMAGE"
}

get_web_container() {
  local container

  container="$(
    "${DOCKER[@]}" ps -q \
      --filter 'label=com.docker.compose.service=web' \
      --filter "label=com.docker.compose.project=$PROJECT_NAME" \
      | sed -n '1p'
  )"

  if [ -n "$container" ]; then
    printf '%s' "$container"
  else
    "${COMPOSE[@]}" ps -q web 2>/dev/null || true
  fi
}

get_application_network() {
  local web_container network

  web_container="$(get_web_container)"
  [ -n "$web_container" ] || die "El contenedor web no está levantado."

  network="$(
    "${DOCKER[@]}" inspect "$web_container" \
      --format '{{range $name, $value := .NetworkSettings.Networks}}{{println $name}}{{end}}' \
      | sed -n '1p'
  )"

  [ -n "$network" ] || die "No se pudo localizar la red Docker."
  printf '%s' "$network"
}

write_host_override() {
  local file="$1"
  local host="$2"

  [[ "$host" =~ ^[A-Za-z0-9.-]+$ ]] \
    || die "El hostname no es válido."

  umask 077

  printf '%s\n' \
    'services:' \
    '  web:' \
    '    environment:' \
    "      BLOODKEEPER_VITE_ALLOWED_HOSTS: $host" \
    > "$file"
}

restore_web_without_public_host() {
  local override_file="$1"

  "${COMPOSE[@]}" up -d --force-recreate --no-deps web
  rm -f "$override_file"
}

quick_container_is_running() {
  local state

  state="$(
    "${DOCKER[@]}" inspect \
      --format '{{.State.Running}}' \
      "$QUICK_CONTAINER" 2>/dev/null || true
  )"

  [ "$state" = "true" ]
}

cleanup_quick_tunnel() {
  if [ "$QUICK_ACTIVE" = "true" ] || [ -n "$QUICK_OVERRIDE_FILE" ]; then
    echo
    echo "Apagando el túnel temporal..."

    "${DOCKER[@]}" rm -f "$QUICK_CONTAINER" >/dev/null 2>&1 || true
    QUICK_ACTIVE="false"

    if [ -n "$QUICK_OVERRIDE_FILE" ]; then
      restore_web_without_public_host "$QUICK_OVERRIDE_FILE" \
        || echo "ADVERTENCIA: no se pudo restaurar Web."
      QUICK_OVERRIDE_FILE=""
    fi
  fi
}

trap cleanup_quick_tunnel EXIT INT TERM

start_quick_tunnel() {
  QUICK_NETWORK="$(get_application_network)"
  prepare_cloudflared_image
  : > "$QUICK_LOG"

  "${DOCKER[@]}" rm -f "$QUICK_CONTAINER" >/dev/null 2>&1 || true

  echo "Iniciando túnel temporal..."

  "${DOCKER[@]}" run --rm \
    --name "$QUICK_CONTAINER" \
    --network "$QUICK_NETWORK" \
    "$CLOUDFLARED_IMAGE" \
    tunnel --no-autoupdate --url http://web:5173 \
    > "$QUICK_LOG" 2>&1 &

  QUICK_ACTIVE="true"

  for _ in $(seq 1 60); do
    QUICK_URL="$(
      sed -nE \
        's/.*(https:\/\/[^[:space:]]+\.trycloudflare\.com).*/\1/p' \
        "$QUICK_LOG" \
        | tail -n 1 || true
    )"

    [ -n "$QUICK_URL" ] && break
    sleep 1
  done

  [ -n "$QUICK_URL" ] \
    || die "No se obtuvo la URL temporal. Revisa $QUICK_LOG"

  QUICK_OVERRIDE_FILE="${TMPDIR:-/tmp}/bloodkeeper-cloudflare-quick-${PROJECT_NAME}.compose.yaml"

  write_host_override "$QUICK_OVERRIDE_FILE" "${QUICK_URL#https://}"

  quick_compose=(
    "${COMPOSE[@]}"
    --file "$QUICK_OVERRIDE_FILE"
  )

  "${quick_compose[@]}" up -d --force-recreate --no-deps web

  echo
  echo "============================================================"
  echo "TÚNEL TEMPORAL ACTIVO"
  echo "============================================================"
  printf 'URL: %s\n' "$QUICK_URL"
  echo "La URL dejará de funcionar al apagar este script."
  printf 'Log: %s\n' "$QUICK_LOG"
}

quick_menu() {
  while [ "$QUICK_ACTIVE" = "true" ]; do
    echo
    echo "¿Qué quieres hacer?"
    echo "  [m] Mantener el túnel abierto"
    echo "  [e] Ver estado"
    echo "  [l] Ver últimas líneas del log"
    echo "  [a] Apagar el túnel"
    echo "  [q] Salir y apagar el túnel"

    read -r -p "Opción: " action

    case "$action" in
      m|M)
        printf 'El túnel sigue activo en %s\n' "$QUICK_URL"
        ;;
      e|E)
        if quick_container_is_running; then
          echo "Estado: activo"
        else
          echo "Estado: detenido"
          QUICK_ACTIVE="false"
        fi
        ;;
      l|L)
        tail -n 20 "$QUICK_LOG" || true
        ;;
      a|A|q|Q)
        cleanup_quick_tunnel
        ;;
      *)
        echo "Opción no reconocida."
        ;;
    esac
  done
}

configure_named_tunnel() {
  [ -f "$ROOT/compose.cloudflare.yaml" ] \
    || die "No existe compose.cloudflare.yaml."

  echo
  echo "El túnel permanente requiere:"
  echo "  1. Un dominio activo en Cloudflare."
  echo "  2. Un Named Tunnel creado desde Zero Trust."
  echo "  3. La ruta pública apuntando a http://web:5173."
  echo "  4. Una aplicación Access con los correos autorizados."
  echo

  local hostname token

  read -r -p "Hostname público: " hostname
  [[ "$hostname" =~ ^[A-Za-z0-9.-]+$ ]] \
    || die "El hostname no es válido."

  echo "Pega el token del túnel. No se mostrará."
  read -r -s -p "Token Cloudflare: " token
  printf '\n'

  [ -n "$token" ] || die "El token no puede estar vacío."

  umask 077

  printf 'BLOODKEEPER_PUBLIC_HOSTNAME=%s\n' "$hostname" \
    > "$CLOUDFLARE_ENV_FILE"

  printf 'CLOUDFLARE_TUNNEL_TOKEN=%s\n' "$token" \
    >> "$CLOUDFLARE_ENV_FILE"

  chmod 600 "$CLOUDFLARE_ENV_FILE"
  unset token

  write_host_override "$NAMED_OVERRIDE_FILE" "$hostname"

  named_compose=(
    "${COMPOSE_CLOUDFLARE[@]}"
    --file "$NAMED_OVERRIDE_FILE"
  )

  "${named_compose[@]}" config --quiet
  prepare_cloudflared_image
  "${named_compose[@]}" up -d --force-recreate web cloudflared

  echo
  printf 'Cloudflare Tunnel activado para %s\n' "$hostname"
  printf 'Configuración privada: %s\n' "$CLOUDFLARE_ENV_FILE"
}

stop_named_tunnel() {
  echo
  echo "Deteniendo el túnel permanente..."

  if [ -f "$CLOUDFLARE_ENV_FILE" ]; then
    "${COMPOSE_CLOUDFLARE[@]}" stop cloudflared \
      >/dev/null 2>&1 || true

    "${COMPOSE_CLOUDFLARE[@]}" rm -f cloudflared \
      >/dev/null 2>&1 || true
  fi

  rm -f "$NAMED_OVERRIDE_FILE"

  "${COMPOSE[@]}" up -d --force-recreate --no-deps web

  echo "Túnel permanente detenido."
  printf 'Se conserva: %s\n' "$CLOUDFLARE_ENV_FILE"
}

echo "BLOODKEEPER — PUBLICACIÓN OPCIONAL"
printf 'Instalación local detectada en: %s\n\n' "$ROOT"

echo "  [1] Tunnel temporal de prueba"
echo "  [2] Tunnel permanente + Access"
echo "  [3] Detener el túnel permanente"
echo "  [q] Cancelar"

read -r -p "Elige una opción: " mode

case "$mode" in
  1)
    start_quick_tunnel
    quick_menu
    ;;
  2)
    configure_named_tunnel
    ;;
  3)
    stop_named_tunnel
    ;;
  q|Q)
    echo "No se ha cambiado la configuración de BloodKeeper."
    ;;
  *)
    die "Opción no válida."
    ;;
esac
