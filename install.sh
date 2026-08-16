#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(
  cd "$(dirname "${BASH_SOURCE[0]}")"
  pwd
)"
COMPOSE_FILE="$ROOT/compose.deploy.yaml"
ENV_FILE="${BLOODKEEPER_ENV_FILE:-$ROOT/.env}"
PROJECT_NAME="${BLOODKEEPER_PROJECT_NAME:-bloodkeeper}"
CREATED_ENV='false'

die() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "falta el comando obligatorio: $1"
}

DOCKER_COMMAND=(docker)
PULL_LOG=''

cleanup_pull_log() {
  if [ -n "$PULL_LOG" ]; then
    rm -f "$PULL_LOG"
    PULL_LOG=''
  fi
}
trap cleanup_pull_log EXIT

prepare_docker() {
  if command -v docker >/dev/null 2>&1 \
    && docker compose version >/dev/null 2>&1; then
    return
  fi

  if [ ! -r /etc/os-release ]; then
    die 'Docker no está instalado; instálalo con Docker Compose y repite'
  fi

  # shellcheck disable=SC1091
  source /etc/os-release
  if [ "${ID:-}" != 'ubuntu' ] || [ "${VERSION_ID:-}" != '24.04' ]; then
    die 'Docker no está instalado; la preparación automática sólo admite Ubuntu 24.04'
  fi

  [ -s "$ROOT/scripts/bootstrap-server.sh" ] \
    || die 'falta el adaptador de preparación de Ubuntu'

  if [ "${BLOODKEEPER_AUTO_INSTALL_DOCKER:-0}" != '1' ]; then
    if [ "${BLOODKEEPER_NONINTERACTIVE:-0}" = '1' ] || [ ! -t 0 ]; then
      die 'Docker no está instalado; usa BLOODKEEPER_AUTO_INSTALL_DOCKER=1 para autorizar su instalación no interactiva'
    fi

    answer='s'
    read -r -p 'Docker no está instalado. ¿Preparar este host Ubuntu? [S/n] ' answer
    case "$answer" in
      n|N|no|NO)
        die 'instalación de Docker cancelada'
        ;;
    esac
  fi

  bash "$ROOT/scripts/bootstrap-server.sh" --prepare-host
}

configure_docker_access() {
  if docker info >/dev/null 2>&1; then
    DOCKER_COMMAND=(docker)
    return
  fi

  if [ "$(id -u)" -ne 0 ] \
    && command -v sudo >/dev/null 2>&1 \
    && sudo docker info >/dev/null 2>&1; then
    DOCKER_COMMAND=(sudo docker)
    printf 'Docker se utilizará mediante sudo durante esta sesión.\n'
    return
  fi

  die 'Docker está instalado pero el usuario actual no puede utilizarlo'
}

docker_command() {
  "${DOCKER_COMMAND[@]}" "$@"
}

warn_low_disk_space() {
  warning_mb="${BLOODKEEPER_WARN_FREE_MB:-2048}"
  case "$warning_mb" in
    ''|*[!0-9]*) die 'BLOODKEEPER_WARN_FREE_MB debe ser numérico' ;;
  esac

  docker_root="$(
    docker_command info --format '{{.DockerRootDir}}' 2>/dev/null || true
  )"
  [ -d "$docker_root" ] || docker_root='/'
  available_kb="$(df -Pk "$docker_root" | awk 'NR == 2 {print $4}')"
  case "$available_kb" in
    ''|*[!0-9]*)
      printf 'AVISO: no se pudo determinar el espacio disponible para Docker.\n' >&2
      return
      ;;
  esac
  available_mb=$((available_kb / 1024))

  printf 'Espacio disponible para Docker: %s MiB en %s.\n' \
    "$available_mb" "$docker_root"
  if [ "$available_mb" -lt "$warning_mb" ]; then
    printf 'AVISO: queda poco espacio; la extracción de imágenes puede fallar.\n' >&2
  fi
}

case "$PROJECT_NAME" in
  ''|*[!a-z0-9_-]*|[-_]* )
    die 'BLOODKEEPER_PROJECT_NAME debe usar minúsculas, números, guion o guion bajo'
    ;;
esac

prepare_docker
require_command docker
docker compose version >/dev/null 2>&1 \
  || die 'Docker Compose no está disponible'
configure_docker_access

for file in \
  "$COMPOSE_FILE" \
  "$ROOT/apps/api/Dockerfile.release" \
  "$ROOT/apps/web/Dockerfile.release" \
  "$ROOT/apps/web/nginx.release.conf"; do
  [ -s "$file" ] || die "instalación incompleta: falta $file"
done

if [ -d "$ROOT/.git" ] && command -v git >/dev/null 2>&1; then
  DEFAULT_VERSION="sha-$(git -C "$ROOT" rev-parse --short=7 HEAD)"
else
  DEFAULT_VERSION='latest'
fi

random_hex() {
  docker_command run --rm --network none alpine:3.22 \
    sh -c 'od -An -N32 -tx1 /dev/urandom | tr -d " \n"'
}

create_environment() {
  if [ -f "$ENV_FILE" ]; then
    chmod 600 "$ENV_FILE" 2>/dev/null || true
    printf 'Configuración local existente conservada: %s\n' "$ENV_FILE"
    return
  fi

  mkdir -p "$(dirname "$ENV_FILE")"
  password="$(random_hex)"
  case "$password" in
    *[!0-9a-f]*|'') die 'no se pudo generar una contraseña segura' ;;
  esac

  database="${BLOODKEEPER_POSTGRES_DB:-bloodkeeper}"
  username="${BLOODKEEPER_POSTGRES_USER:-bloodkeeper}"
  version="${BLOODKEEPER_VERSION:-$DEFAULT_VERSION}"
  web_port="${BLOODKEEPER_WEB_PORT:-5173}"
  api_port="${BLOODKEEPER_API_PORT:-3000}"

  case "$database:$username" in
    *[!A-Za-z0-9_:]*) die 'nombre de base de datos o usuario no válido' ;;
  esac
  case "$web_port:$api_port" in
    *[!0-9:]*) die 'los puertos deben ser numéricos' ;;
  esac

  umask 077
  cat > "$ENV_FILE" <<EOF
APP_ENV=production
POSTGRES_DB=$database
POSTGRES_USER=$username
POSTGRES_PASSWORD=$password
DATABASE_URL=postgresql://$username:$password@postgres:5432/$database?schema=public
BLOODKEEPER_VERSION=$version
BLOODKEEPER_WEB_PORT=$web_port
BLOODKEEPER_API_PORT=$api_port
EOF
  chmod 600 "$ENV_FILE" 2>/dev/null || true
  unset password
  CREATED_ENV='true'
  printf 'Configuración local nueva creada sin datos ni cuentas: %s\n' "$ENV_FILE"
}

create_environment

COMPOSE=(
  "${DOCKER_COMMAND[@]}"
  compose
  --env-file "$ENV_FILE"
  --project-name "$PROJECT_NAME"
  --file "$COMPOSE_FILE"
)

"${COMPOSE[@]}" config --quiet

run_pull() {
  cleanup_pull_log
  PULL_LOG="$(mktemp)"

  if "${COMPOSE[@]}" pull 2>&1 | tee "$PULL_LOG"; then
    cleanup_pull_log
    return 0
  fi

  return 1
}

pull_failed_for_authentication() {
  grep -Eiq \
    'unauthorized|authentication required|pull access denied|requested access .* denied|insufficient_scope' \
    "$PULL_LOG"
}

abort_for_pull_failure() {
  if grep -Fiq 'no space left on device' "$PULL_LOG"; then
    die 'espacio insuficiente al descargar imágenes; libera espacio y repite (no es un fallo de autenticación)'
  fi

  if pull_failed_for_authentication; then
    die 'la cuenta autenticada no tiene acceso a las imágenes privadas de GHCR'
  fi

  if grep -Eiq \
    'i/o timeout|TLS handshake timeout|temporary failure|no such host|network is unreachable|connection refused' \
    "$PULL_LOG"; then
    die 'falló la conexión durante la descarga de imágenes; revisa red y DNS'
  fi

  die 'falló la descarga de imágenes por una causa no relacionada con autenticación; revisa la salida anterior'
}

authenticate_ghcr() {
  if command -v gh >/dev/null 2>&1 \
    && gh auth status --hostname github.com >/dev/null 2>&1; then
    gh_username="$(gh api user --jq .login)"
    gh auth token \
      | docker_command login ghcr.io \
          --username "$gh_username" \
          --password-stdin
    unset gh_username
    return
  fi

  docker_command login ghcr.io
}

pull_images() {
  if [ "${BLOODKEEPER_SKIP_PULL:-0}" = '1' ]; then
    printf 'Descarga de imágenes omitida por validación local.\n'
    return
  fi

  if run_pull; then
    return
  fi

  if ! pull_failed_for_authentication; then
    abort_for_pull_failure
  fi

  if [ "${BLOODKEEPER_NONINTERACTIVE:-0}" = '1' ] || [ ! -t 0 ]; then
    if ! command -v gh >/dev/null 2>&1 \
      || ! gh auth status --hostname github.com >/dev/null 2>&1; then
      die 'GHCR requiere autenticación; inicia sesión o proporciona una sesión válida de gh'
    fi
  fi

  printf '\nGitHub Container Registry requiere autenticación para este paquete privado.\n'
  authenticate_ghcr || die 'autenticación GHCR cancelada o fallida'
  run_pull || abort_for_pull_failure
}

wait_for_service() {
  service="$1"
  attempts=90

  while [ "$attempts" -gt 0 ]; do
    container_id="$("${COMPOSE[@]}" ps -a -q "$service" 2>/dev/null || true)"
    state='missing'
    if [ -n "$container_id" ]; then
      state="$(
        docker_command inspect \
          --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' \
          "$container_id" \
          2>/dev/null || true
      )"
    fi

    case "$state" in
      healthy|running)
        printf '✓ %s: %s\n' "$service" "$state"
        return
        ;;
      unhealthy|exited|dead)
        "${COMPOSE[@]}" ps -a
        "${COMPOSE[@]}" logs --tail=100 "$service"
        die "$service terminó en estado $state"
        ;;
    esac

    sleep 2
    attempts=$((attempts - 1))
  done

  "${COMPOSE[@]}" ps -a
  "${COMPOSE[@]}" logs --tail=100 "$service"
  die "$service no alcanzó un estado saludable"
}

warn_low_disk_space

pull_images

printf '\nIniciando base de datos y volúmenes portátiles...\n'
"${COMPOSE[@]}" up -d postgres backup-init
wait_for_service postgres

printf '\nAplicando migraciones...\n'
"${COMPOSE[@]}" run --rm -T api npx prisma migrate deploy

printf '\nIniciando BloodKeeper...\n'
"${COMPOSE[@]}" up -d
for service in postgres backup-worker api web; do
  wait_for_service "$service"
done

printf '\nValidando la comunicación interna...\n'
health="$(
  "${COMPOSE[@]}" exec -T web \
    wget -qO- http://127.0.0.1:5173/api/health
)"
printf '%s\n' "$health" | grep -q '"status":"ok"' \
  || die 'la API no informa estado correcto a través de la web'
printf '%s\n' "$health" | grep -q '"database":"ok"' \
  || die 'la base de datos no informa estado correcto'

create_initial_admin() {
  if [ "${BLOODKEEPER_SKIP_ADMIN:-0}" = '1' ]; then
    printf 'Creación de administrador omitida por configuración.\n'
    return
  fi

  admin_username="${BLOODKEEPER_ADMIN_USERNAME:-}"
  admin_display_name="${BLOODKEEPER_ADMIN_DISPLAY_NAME:-}"
  admin_password="${BLOODKEEPER_ADMIN_PASSWORD:-}"

  if [ -z "$admin_username$admin_display_name$admin_password" ]; then
    if [ "$CREATED_ENV" != 'true' ]; then
      printf 'No se crea otra cuenta: esta instalación ya tenía configuración local.\n'
      return
    fi
    if [ "${BLOODKEEPER_NONINTERACTIVE:-0}" = '1' ] || [ ! -t 0 ]; then
      printf 'AVISO: instalación nueva sin administrador; usa las variables BLOODKEEPER_ADMIN_* al repetir.\n'
      return
    fi

    answer='s'
    read -r -p '¿Crear ahora la primera cuenta administradora? [S/n] ' answer
    case "$answer" in
      n|N|no|NO) return ;;
    esac

    read -r -p 'Nombre de usuario administrador: ' admin_username
    read -r -p 'Nombre visible: ' admin_display_name
    read -r -s -p 'Contraseña (mínimo 12 caracteres): ' admin_password
    printf '\n'
    read -r -s -p 'Repite la contraseña: ' admin_password_repeat
    printf '\n'
    [ "$admin_password" = "$admin_password_repeat" ] \
      || die 'las contraseñas no coinciden'
    unset admin_password_repeat
  elif [ -z "$admin_username" ] || [ -z "$admin_display_name" ] || [ -z "$admin_password" ]; then
    die 'BLOODKEEPER_ADMIN_USERNAME, DISPLAY_NAME y PASSWORD deben proporcionarse juntas'
  fi

  ADMIN_USERNAME="$admin_username" \
  ADMIN_DISPLAY_NAME="$admin_display_name" \
  ADMIN_PASSWORD="$admin_password" \
    "${COMPOSE[@]}" run --rm -T \
      -e ADMIN_USERNAME \
      -e ADMIN_DISPLAY_NAME \
      -e ADMIN_PASSWORD \
      api node dist/auth/tools/create-initial-admin.js

  unset admin_username admin_display_name admin_password
  printf 'Primera cuenta administradora creada.\n'
}

create_initial_admin

web_port="$(sed -n 's/^BLOODKEEPER_WEB_PORT=//p' "$ENV_FILE" | tail -n 1)"
web_port="${web_port:-5173}"

printf '\n============================================================\n'
printf 'BLOODKEEPER INSTALADO CORRECTAMENTE\n'
printf '============================================================\n'
printf 'Acceso local: http://localhost:%s\n' "$web_port"
printf 'Desde la red: usa el nombre o la dirección actual de esta máquina y el puerto %s.\n' "$web_port"
printf 'Datos: volúmenes Docker nuevos o previamente existentes del proyecto %s.\n' "$PROJECT_NAME"
printf 'Configuración privada: %s\n' "$ENV_FILE"
