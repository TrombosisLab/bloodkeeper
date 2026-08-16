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

case "$PROJECT_NAME" in
  ''|*[!a-z0-9_-]*|[-_]* )
    die 'BLOODKEEPER_PROJECT_NAME debe usar minúsculas, números, guion o guion bajo'
    ;;
esac

require_command docker
docker compose version >/dev/null 2>&1 \
  || die 'Docker Compose no está disponible'
docker info >/dev/null 2>&1 \
  || die 'Docker está instalado pero el usuario actual no puede utilizarlo'

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
  docker run --rm --network none alpine:3.22 \
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
  docker compose
  --env-file "$ENV_FILE"
  --project-name "$PROJECT_NAME"
  --file "$COMPOSE_FILE"
)

"${COMPOSE[@]}" config --quiet

pull_images() {
  if [ "${BLOODKEEPER_SKIP_PULL:-0}" = '1' ]; then
    printf 'Descarga de imágenes omitida por validación local.\n'
    return
  fi

  if "${COMPOSE[@]}" pull; then
    return
  fi

  if [ "${BLOODKEEPER_NONINTERACTIVE:-0}" = '1' ] || [ ! -t 0 ]; then
    die 'no se pudieron descargar las imágenes privadas; ejecuta docker login ghcr.io y repite'
  fi

  printf '\nGitHub Container Registry requiere autenticación para este paquete privado.\n'
  docker login ghcr.io || die 'autenticación GHCR cancelada o fallida'
  "${COMPOSE[@]}" pull \
    || die 'las imágenes siguen sin estar disponibles para esta cuenta'
}

wait_for_service() {
  service="$1"
  attempts=90

  while [ "$attempts" -gt 0 ]; do
    container_id="$("${COMPOSE[@]}" ps -a -q "$service" 2>/dev/null || true)"
    state='missing'
    if [ -n "$container_id" ]; then
      state="$(
        docker inspect \
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
