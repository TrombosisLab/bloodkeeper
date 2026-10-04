#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

repo=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
repo_user=''
compose_file=''
env_file=''
project_name=''
fail() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo|--user|--compose-file|--env-file|--project-name)
      [[ $# -ge 2 ]] || fail "falta el valor de $1"
      case "$1" in
        --repo) repo=$2 ;;
        --user) repo_user=$2 ;;
        --compose-file) compose_file=$2 ;;
        --env-file) env_file=$2 ;;
        --project-name) project_name=$2 ;;
      esac
      shift 2 ;;
    --help|-h)
      printf '%s\n' 'Uso: sudo bash scripts/install-update-command.sh [--user USUARIO]' \
        '  [--repo RUTA] [--compose-file RUTA] [--env-file RUTA] [--project-name NOMBRE]' \
        'Por defecto registra compose.yaml y .env. No descarga ni despliega cambios.'
      exit 0 ;;
    *) fail "opción no reconocida: $1" ;;
  esac
done
[[ $(id -u) == 0 ]] || fail 'ejecuta este instalador con sudo bash'
repo=$(realpath "$repo")
[[ -e "$repo/.git" ]] || fail "no existe un checkout Git en $repo"
[[ -f "$repo/scripts/update-from-github.sh" ]] || fail 'falta scripts/update-from-github.sh'
[[ -n "$repo_user" ]] || repo_user=$(stat -c '%U' "$repo/.git")
id "$repo_user" >/dev/null || fail "no existe el usuario $repo_user"
[[ -n "$compose_file" ]] || compose_file="$repo/compose.yaml"
[[ -n "$env_file" ]] || env_file="$repo/.env"
compose_file=$(realpath "$compose_file")
env_file=$(realpath "$env_file")
[[ -f "$compose_file" && -f "$env_file" ]] || fail 'falta Compose o .env'
[[ -z "$project_name" || "$project_name" =~ ^[a-z0-9][a-z0-9_-]*$ ]] || fail 'nombre de proyecto Compose no válido'

config=/etc/bloodkeeper-update.conf
launcher=/usr/local/bin/bloodkeeper-update
for file in "$config" "$launcher"; do
  if [[ -e "$file" ]]; then
    backup=$(mktemp "${file}.before-XXXXXXXX")
    cp -a -- "$file" "$backup"
    printf 'Configuración anterior conservada: %s\n' "$backup"
  fi
done
temporary_config=$(mktemp /etc/bloodkeeper-update.conf.XXXXXXXX)
temporary_launcher=$(mktemp /usr/local/bin/bloodkeeper-update.XXXXXXXX)
trap 'rm -f -- "$temporary_config" "$temporary_launcher"' EXIT
{
  printf 'repo=%q\n' "$repo"
  printf 'repo_user=%q\n' "$repo_user"
  printf 'compose_file=%q\n' "$compose_file"
  printf 'env_file=%q\n' "$env_file"
  printf 'project_name=%q\n' "$project_name"
} > "$temporary_config"
cat > "$temporary_launcher" <<'LAUNCHER'
#!/usr/bin/env bash
set -Eeuo pipefail
source /etc/bloodkeeper-update.conf
exec bash "$repo/scripts/update-from-github.sh" \
  --repo "$repo" --user "$repo_user" --compose-file "$compose_file" \
  --env-file "$env_file" --project-name "$project_name" "$@"
LAUNCHER
for file in "$temporary_launcher" "$temporary_config" "$repo/scripts/update-from-github.sh"; do
  bash -n "$file"
done
chmod 0644 "$temporary_config"
chmod 0755 "$temporary_launcher"
chown root:root "$temporary_config" "$temporary_launcher"
mv -f -- "$temporary_config" "$config"
mv -f -- "$temporary_launcher" "$launcher"
printf '\nComando instalado para %s.\nRepositorio: %s\nCompose: %s\n' "$repo_user" "$repo" "$compose_file"
printf 'Como %s, ejecuta sin sudo: bloodkeeper-update\n' "$repo_user"
