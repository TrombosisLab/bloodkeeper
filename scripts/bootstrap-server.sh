#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/.."
  pwd
)"

MODE="deploy"

usage() {
  cat <<'EOF'
Uso:
  ./scripts/bootstrap-server.sh
  ./scripts/bootstrap-server.sh --deploy
  ./scripts/bootstrap-server.sh --prepare-host
  ./scripts/bootstrap-server.sh --check-host
  ./scripts/bootstrap-server.sh --help

Modos:
  --deploy        Prepara Ubuntu si es necesario, configura el proyecto,
                  construye imágenes, aplica migraciones y arranca.
  --prepare-host  Instala o valida Git, Docker Engine y Docker Compose.
  --check-host    Comprueba requisitos sin modificar el servidor.

Variables opcionales:
  PROJECT_POSTGRES_DB
  PROJECT_POSTGRES_USER
  PROJECT_POSTGRES_PASSWORD
EOF
}

die() {
  echo "ERROR: $*" >&2
  return 1
}

require_supported_host() {
  test -r /etc/os-release ||
    die "No se puede identificar el sistema operativo."

  # shellcheck disable=SC1091
  source /etc/os-release

  test "${ID:-}" = "ubuntu" ||
    die "Este script admite Ubuntu Server."

  test "${VERSION_ID:-}" = "24.04" ||
    die "Se requiere Ubuntu Server 24.04 LTS."

  case "$(dpkg --print-architecture)" in
    amd64|arm64|armhf|ppc64el|s390x)
      ;;
    *)
      die "Arquitectura no admitida por este despliegue."
      ;;
  esac
}

as_root() {
  if [ "$(id -u)" -eq 0 ]; then
    "$@"
  else
    command -v sudo >/dev/null 2>&1 ||
      die "Se necesita sudo para preparar el servidor."

    sudo "$@"
  fi
}

docker_available() {
  command -v docker >/dev/null 2>&1 &&
    docker compose version >/dev/null 2>&1
}

docker_accessible() {
  docker info >/dev/null 2>&1
}

compose() {
  if docker_accessible; then
    docker compose "$@"
  else
    as_root docker compose "$@"
  fi
}

install_docker() {
  if docker_available; then
    echo "Docker Engine y Docker Compose ya están instalados."
    return
  fi

  echo "Instalando Docker desde el repositorio oficial..."

  as_root apt-get update
  as_root apt-get install -y \
    ca-certificates \
    curl \
    git

  as_root apt-get remove -y \
    docker.io \
    docker-compose \
    docker-compose-v2 \
    docker-doc \
    docker-buildx \
    podman-docker \
    containerd \
    runc \
    2>/dev/null || true

  as_root install -m 0755 -d /etc/apt/keyrings

  as_root curl -fsSL \
    https://download.docker.com/linux/ubuntu/gpg \
    -o /etc/apt/keyrings/docker.asc

  as_root chmod a+r /etc/apt/keyrings/docker.asc

  local codename
  local architecture

  # shellcheck disable=SC1091
  source /etc/os-release

  codename="${UBUNTU_CODENAME:-$VERSION_CODENAME}"
  architecture="$(dpkg --print-architecture)"

  {
    echo "Types: deb"
    echo "URIs: https://download.docker.com/linux/ubuntu"
    echo "Suites: $codename"
    echo "Components: stable"
    echo "Architectures: $architecture"
    echo "Signed-By: /etc/apt/keyrings/docker.asc"
  } |
    as_root tee \
      /etc/apt/sources.list.d/docker.sources \
      >/dev/null

  as_root apt-get update
  as_root apt-get install -y \
    docker-ce \
    docker-ce-cli \
    containerd.io \
    docker-buildx-plugin \
    docker-compose-plugin

  as_root systemctl enable --now docker

  if [ "$(id -u)" -ne 0 ]; then
    as_root usermod -aG docker "$USER"
  fi

  docker_available ||
    die "Docker Compose no quedó instalado."

  echo "Docker instalado."
  echo "El grupo docker se aplicará plenamente al abrir una nueva sesión SSH."
}

ensure_git() {
  if command -v git >/dev/null 2>&1; then
    return
  fi

  as_root apt-get update
  as_root apt-get install -y git
}

random_password() {
  od -An -N32 -tx1 /dev/urandom |
    tr -d ' \n'
}

ensure_environment() {
  cd "$ROOT"

  if [ -f .env ]; then
    chmod 600 .env
    echo ".env existente conservado."
    return
  fi

  local database
  local username
  local password

  database="${PROJECT_POSTGRES_DB:-vampiro_v5}"
  username="${PROJECT_POSTGRES_USER:-v5r_app}"
  password="${PROJECT_POSTGRES_PASSWORD:-$(random_password)}"

  umask 077

  cat > .env <<EOF
APP_ENV=development
POSTGRES_DB=$database
POSTGRES_USER=$username
POSTGRES_PASSWORD=$password
DATABASE_URL=postgresql://$username:$password@postgres:5432/$database?schema=public
EOF

  chmod 600 .env
  echo ".env creado con credenciales locales aleatorias."
}

check_project_files() {
  cd "$ROOT"

  for file in \
    compose.yaml \
    .env.example \
    apps/api/Dockerfile \
    apps/web/Dockerfile \
    scripts/check.sh
  do
    test -f "$file" ||
      die "Falta el archivo obligatorio: $file"
  done
}

wait_for_container() {
  local container="$1"
  local attempts=90

  while [ "$attempts" -gt 0 ]; do
    local state

    state="$(
      if docker_accessible; then
        docker inspect \
          --format \
          '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' \
          "$container" \
          2>/dev/null || true
      else
        as_root docker inspect \
          --format \
          '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' \
          "$container" \
          2>/dev/null || true
      fi
    )"

    case "$state" in
      healthy|running)
        echo "✓ $container: $state"
        return
        ;;
      unhealthy|exited|dead)
        compose ps
        compose logs --tail=100
        die "$container terminó en estado $state."
        ;;
    esac

    sleep 2
    attempts=$((attempts - 1))
  done

  compose ps
  compose logs --tail=100
  die "$container no alcanzó un estado saludable."
}

validate_services() {
  compose config --quiet
  compose ps

  curl -fsS \
    http://127.0.0.1:3000/health |
    grep -q '"status":"ok"'

  curl -fsS \
    http://127.0.0.1:3000/health |
    grep -q '"database":"ok"'

  curl -fsS \
    http://127.0.0.1:5173 \
    >/dev/null

  curl -fsS \
    http://127.0.0.1:5173/api/health |
    grep -q '"database":"ok"'

  echo "✓ Backend accesible"
  echo "✓ PostgreSQL accesible"
  echo "✓ Frontend accesible"
  echo "✓ Proxy web → API operativo"
}

prepare_host() {
  require_supported_host
  ensure_git
  install_docker

  git --version
  docker --version
  docker compose version
}

check_host() {
  require_supported_host
  check_project_files

  command -v git >/dev/null 2>&1 ||
    die "Git no está instalado."

  docker_available ||
    die "Docker Engine o Docker Compose no están instalados."

  if ! docker_accessible; then
    echo "AVISO: el usuario actual requiere sudo o una nueva sesión para Docker."
  fi

  git --version
  docker --version
  docker compose version

  if [ -f "$ROOT/.env" ]; then
    echo ".env presente."
  else
    echo ".env se creará durante --deploy."
  fi

  echo "✓ Servidor compatible"
  echo "✓ Archivos del proyecto presentes"
}

deploy() {
  prepare_host
  check_project_files
  ensure_environment

  cd "$ROOT"

  if [ ! -d .git ]; then
    git init
  fi

  compose config --quiet
  compose build api web

  compose up -d postgres
  wait_for_container v5r-postgres

  compose run --rm -T api \
    npx prisma migrate deploy

  compose up -d api web
  wait_for_container v5r-api
  wait_for_container v5r-web

  validate_services

  echo
  echo "Despliegue completado."
  echo "Crea la primera cuenta con:"
  echo "  ./scripts/create-initial-admin.sh"
  echo
  echo "Consulta registros con:"
  echo "  ./scripts/logs.sh"
}

case "${1:-}" in
  "")
    MODE="deploy"
    ;;
  --deploy)
    MODE="deploy"
    ;;
  --prepare-host)
    MODE="prepare-host"
    ;;
  --check-host)
    MODE="check-host"
    ;;
  --help|-h)
    usage
    exit 0
    ;;
  *)
    usage
    die "Argumento no reconocido: ${1:-}"
    ;;
esac

case "$MODE" in
  deploy)
    deploy
    ;;
  prepare-host)
    prepare_host
    ;;
  check-host)
    check_host
    ;;
esac
