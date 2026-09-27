#!/usr/bin/env bash
set -Eeuo pipefail

# Configura una publicación Cloudflare opcional sobre una instalación
# BloodKeeper ya existente. El archivo .env de la aplicación es obligatorio
# y nunca se crea ni se modifica aquí. La configuración del túnel se guarda
# únicamente en .env.cloudflare.

ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${BLOODKEEPER_COMPOSE_FILE:-$ROOT/compose.yaml}"
ENV_FILE="${BLOODKEEPER_ENV_FILE:-$ROOT/.env}"
CLOUDFLARE_ENV_FILE="${BLOODKEEPER_CLOUDFLARE_ENV_FILE:-$ROOT/.env.cloudflare}"
CLOUDFLARE_COMPOSE_FILE="${BLOODKEEPER_CLOUDFLARE_COMPOSE_FILE:-$ROOT/compose.cloudflare.yaml}"
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

show_service_logs() {
  local service="$1"
  shift
  local -a stack=("$@")

  echo
  echo "Últimos logs de $service:"
  "${stack[@]}" logs --tail=100 "$service" 2>&1 || true
}

report_stack_failure() {
  local -a stack=("$@")

  echo
  echo "Estado de los servicios:"
  "${stack[@]}" ps -a 2>&1 || true
  show_service_logs api "${stack[@]}"
  show_service_logs web "${stack[@]}"
}

[ -f "$COMPOSE_FILE" ] || die "No existe $COMPOSE_FILE"
[ -f "$ENV_FILE" ] || die "No existe $ENV_FILE. Configura primero la instalación BloodKeeper."

if docker info >/dev/null 2>&1; then
  DOCKER=(docker)
elif sudo docker info >/dev/null 2>&1; then
  DOCKER=(sudo docker)
else
  die "Docker no está disponible."
fi

"${DOCKER[@]}" compose version >/dev/null 2>&1 \
  || die "Docker Compose no está disponible."

detect_project_name() {
  local container working_dir detected

  [ -n "$PROJECT_NAME" ] && return

  while read -r container; do
    [ -n "$container" ] || continue

    working_dir="$("${DOCKER[@]}" inspect "$container" \
      --format '{{index .Config.Labels "com.docker.compose.project.working_dir"}}' \
      2>/dev/null || true)"

    if [ "$working_dir" = "$ROOT" ]; then
      detected="$("${DOCKER[@]}" inspect "$container" \
        --format '{{index .Config.Labels "com.docker.compose.project"}}' \
        2>/dev/null || true)"
      if [ -n "$detected" ] && [ "$detected" != "<no value>" ]; then
        PROJECT_NAME="$detected"
        break
      fi
    fi
  done < <(
    "${DOCKER[@]}" ps -aq \
      --filter 'label=com.docker.compose.service=web' 2>/dev/null || true
  )

  PROJECT_NAME="${PROJECT_NAME:-$(basename -- "$ROOT")}"
}

detect_project_name

QUICK_CONTAINER="${PROJECT_NAME}-cloudflare-quick"
QUICK_LOG="${TMPDIR:-/tmp}/bloodkeeper-cloudflare-quick-${PROJECT_NAME}.log"
NAMED_OVERRIDE_FILE="${TMPDIR:-/tmp}/bloodkeeper-cloudflare-named-${PROJECT_NAME}.compose.yaml"

COMPOSE=(
  "${DOCKER[@]}" compose
  --project-directory "$ROOT"
  --env-file "$ENV_FILE"
  --project-name "$PROJECT_NAME"
  --file "$COMPOSE_FILE"
)

prepare_cloudflared_image() {
  if "${DOCKER[@]}" image inspect "$CLOUDFLARED_IMAGE" >/dev/null 2>&1; then
    return
  fi

  printf 'Descargando la imagen de Cloudflare: %s\n' "$CLOUDFLARED_IMAGE"
  "${DOCKER[@]}" pull "$CLOUDFLARED_IMAGE"
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
    "      BLOODKEEPER_VITE_ALLOWED_HOSTS: \"$host\"" \
    > "$file"
}

build_web_image() {
  local -a stack=("$@")
  local image

  image="$("${stack[@]}" images -q web 2>/dev/null | sed -n '1p' || true)"

  # Si existe una imagen antigua que no contiene el usuario configurado por
  # apps/web/Dockerfile, la reconstruimos sin caché. Esto evita el fallo:
  # "unable to find user node".
  if [ -n "$image" ] && ! "${DOCKER[@]}" run --rm \
      --entrypoint sh "$image" -c 'id node >/dev/null 2>&1'; then
    echo "La imagen web existente no contiene el usuario node."
    echo "Reconstruyendo Web sin caché..."
    "${stack[@]}" build --pull --no-cache web
  else
    "${stack[@]}" build --pull web
  fi
}

wait_for_healthy() {
  local service="$1"
  shift
  local -a stack=("$@")
  local container status

  for _ in $(seq 1 90); do
    container="$("${stack[@]}" ps -q "$service" 2>/dev/null | sed -n '1p' || true)"

    if [ -n "$container" ]; then
      status="$("${DOCKER[@]}" inspect "$container" \
        --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' \
        2>/dev/null || true)"

      case "$status" in
        healthy)
          return 0
          ;;
        unhealthy|exited|dead)
          show_service_logs "$service" "${stack[@]}"
          return 1
          ;;
      esac
    fi

    sleep 1
  done

  show_service_logs "$service" "${stack[@]}"
  return 1
}

start_web() {
  local -a stack=("$@")

  "${stack[@]}" config --quiet || return 1
  build_web_image "${stack[@]}" || return 1

  if ! "${stack[@]}" up -d --force-recreate web; then
    report_stack_failure "${stack[@]}"
    return 1
  fi

  if ! wait_for_healthy web "${stack[@]}"; then
    report_stack_failure "${stack[@]}"
    return 1
  fi
}

wait_for_running() {
  local service="$1"
  shift
  local -a stack=("$@")
  local container status

  for _ in $(seq 1 45); do
    container="$("${stack[@]}" ps -q "$service" 2>/dev/null | sed -n '1p' || true)"

    if [ -n "$container" ]; then
      status="$("${DOCKER[@]}" inspect "$container" \
        --format '{{.State.Status}}' 2>/dev/null || true)"

      [ "$status" = "running" ] && {
        printf '%s' "$container"
        return 0
      }

      case "$status" in
        exited|dead)
          show_service_logs "$service" "${stack[@]}"
          return 1
          ;;
      esac
    fi

    sleep 1
  done

  show_service_logs "$service" "${stack[@]}"
  return 1
}

wait_for_tunnel_connection() {
  local service="$1"
  shift
  local -a stack=("$@")
  local container output

  container="$(wait_for_running "$service" "${stack[@]}")" || return 1

  for _ in $(seq 1 45); do
    output="$("${DOCKER[@]}" logs "$container" 2>&1 || true)"
    if grep -Eqi 'registered tunnel connection|connection.*registered' <<< "$output"; then
      printf '%s' "$container"
      return 0
    fi
    sleep 1
  done

  echo "Cloudflared está ejecutándose, pero no confirmó una conexión al túnel." >&2
  "${DOCKER[@]}" logs --tail=100 "$container" >&2 || true
  return 1
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

write_cloudflare_env() {
  local hostname="$1"
  local token="$2"
  local temp

  umask 077
  temp="$(mktemp "${CLOUDFLARE_ENV_FILE}.tmp.XXXXXX")"
  printf 'BLOODKEEPER_PUBLIC_HOSTNAME=%s\n' "$hostname" > "$temp"
  printf 'CLOUDFLARE_TUNNEL_TOKEN=%s\n' "$token" >> "$temp"
  chmod 600 "$temp"
  mv -f -- "$temp" "$CLOUDFLARE_ENV_FILE"
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
      rm -f -- "$QUICK_OVERRIDE_FILE"
      if ! start_web "${COMPOSE[@]}"; then
        echo "ADVERTENCIA: no se pudo restaurar Web sin el hostname público." >&2
      fi
      QUICK_OVERRIDE_FILE=""
    fi
  fi
}

trap cleanup_quick_tunnel EXIT INT TERM

start_quick_tunnel() {
  local -a quick_compose

  if ! start_web "${COMPOSE[@]}"; then
    die "La aplicación no alcanzó un estado saludable; no se inicia el túnel temporal."
  fi

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

  if ! start_web "${quick_compose[@]}"; then
    die "No se pudo permitir el hostname temporal en Web."
  fi

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
  local hostname token
  local -a named_compose

  [ -f "$CLOUDFLARE_COMPOSE_FILE" ] \
    || die "No existe $CLOUDFLARE_COMPOSE_FILE"

  echo
  echo "El túnel permanente requiere:"
  echo "  1. Un dominio activo en Cloudflare."
  echo "  2. Un Named Tunnel creado desde Zero Trust."
  echo "  3. La ruta pública apuntando a http://web:5173."
  echo "  4. Una aplicación Access con los correos autorizados."
  echo

  read -r -p "Hostname público: " hostname
  [[ "$hostname" =~ ^[A-Za-z0-9.-]+$ ]] \
    || die "El hostname no es válido."

  echo "Pega el token del túnel. No se mostrará."
  read -r -s -p "Token Cloudflare: " token
  printf '\n'

  [ -n "$token" ] || die "El token no puede estar vacío."

  write_cloudflare_env "$hostname" "$token"
  unset token

  write_host_override "$NAMED_OVERRIDE_FILE" "$hostname"

  named_compose=(
    "${COMPOSE[@]}"
    --env-file "$CLOUDFLARE_ENV_FILE"
    --file "$CLOUDFLARE_COMPOSE_FILE"
    --file "$NAMED_OVERRIDE_FILE"
  )

  "${named_compose[@]}" config --quiet
  prepare_cloudflared_image

  # Primero se deja Web saludable con el hostname permitido. Solo después
  # se inicia Cloudflared; así nunca se anuncia un túnel que apunta a una
  # aplicación que todavía no está lista.
  if ! start_web "${named_compose[@]}"; then
    die "La aplicación no alcanzó un estado saludable; no se inicia Cloudflared."
  fi

  if ! "${named_compose[@]}" up -d --force-recreate cloudflared; then
    report_stack_failure "${named_compose[@]}"
    die "No se pudo iniciar Cloudflared."
  fi

  if ! wait_for_tunnel_connection cloudflared "${named_compose[@]}" >/dev/null; then
    die "Cloudflared no confirmó la conexión con Cloudflare."
  fi

  echo
  printf 'Cloudflare Tunnel activado para %s\n' "$hostname"
  printf 'Configuración privada: %s\n' "$CLOUDFLARE_ENV_FILE"
}

stop_named_tunnel() {
  local -a named_compose

  echo
  echo "Deteniendo el túnel permanente..."

  if [ -f "$CLOUDFLARE_ENV_FILE" ] && [ -f "$CLOUDFLARE_COMPOSE_FILE" ]; then
    named_compose=(
      "${COMPOSE[@]}"
      --env-file "$CLOUDFLARE_ENV_FILE"
      --file "$CLOUDFLARE_COMPOSE_FILE"
    )

    "${named_compose[@]}" stop cloudflared >/dev/null 2>&1 || true
    "${named_compose[@]}" rm -f cloudflared >/dev/null 2>&1 || true
  fi

  rm -f -- "$NAMED_OVERRIDE_FILE"

  if ! start_web "${COMPOSE[@]}"; then
    die "No se pudo restaurar Web sin el hostname público."
  fi

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
