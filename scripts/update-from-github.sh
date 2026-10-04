#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

repo=''
repo_user=''
compose_file=''
env_file=''
project_name=''
remote_url='https://github.com/TrombosisLab/bloodkeeper.git'
phase='precomprobación'
log_file=''
backup=''

fail() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
usage() {
  printf '%s\n' 'Uso: bloodkeeper-update [--help]' \
    'Descarga main por HTTPS, conserva main, crea una copia y despliega.' \
    'Si una actualización falla, repite el mismo comando para reintentar.'
}
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
    --help|-h) usage; exit 0 ;;
    *) fail "opción no reconocida: $1" ;;
  esac
done
[[ -n "$repo" && -n "$repo_user" && -n "$compose_file" && -n "$env_file" ]] || fail 'falta la configuración; ejecuta scripts/install-update-command.sh con sudo'
[[ $(id -un) == "$repo_user" ]] || fail "ejecuta bloodkeeper-update como $repo_user, sin sudo delante"
for tool in git docker flock mktemp tee; do
  command -v "$tool" >/dev/null || fail "falta el comando $tool"
done
cd "$repo" || fail "no se pudo entrar en $repo"
git rev-parse --is-inside-work-tree >/dev/null || fail 'la carpeta no es un repositorio Git'
[[ -f "$compose_file" && -f "$env_file" ]] || fail 'falta el archivo Compose o .env configurado'
[[ $(git branch --show-current) == main ]] || fail 'la rama activa debe ser main'

lock_file=$(git rev-parse --git-path bloodkeeper-update.lock)
exec 9>"$lock_file"
flock --nonblock 9 || fail 'ya hay una actualización en curso en este repositorio'

# These files are local deployment state, deliberately outside the worktree.
deployed_file=$(git rev-parse --git-path bloodkeeper-deployed-version)
pending_file=$(git rev-parse --git-path bloodkeeper-update-pending)
dirty=$(git status --porcelain=v1 --untracked-files=all)
[[ -z "$dirty" ]] || { printf '%s\n' "$dirty"; fail 'hay cambios locales; revísalos antes de actualizar'; }

DOCKER=(docker)
if [[ $(id -u) != 0 ]]; then
  command -v sudo >/dev/null || fail 'se necesita sudo para gestionar Docker'
  sudo -v
  DOCKER=(sudo docker)
fi
COMPOSE=("${DOCKER[@]}" compose --project-directory "$repo" --env-file "$env_file" --file "$compose_file")
[[ -z "$project_name" ]] || COMPOSE+=(--project-name "$project_name")
"${COMPOSE[@]}" config --quiet

output_dir=${BLOODKEEPER_UPDATE_BACKUP_DIR:-$HOME/bloodkeeper_backups/updates}
mkdir -p "$output_dir"
backup=$(mktemp -d "$output_dir/update-XXXXXXXX")
log_file="$backup/result.txt"
printf 'Repositorio: %s\nInforme y copia: %s\n' "$repo" "$backup"
exec > >(tee -a "$log_file") 2>&1
on_error() {
  local result=$?
  trap - ERR
  printf '\nERROR: actualización detenida en %s (código %s).\n' "$phase" "$result"
  printf 'Informe y copia: %s\n' "$backup"
  printf '%s\n' 'No se ha marcado esta versión como desplegada.' \
    'Corrige el problema y repite bloodkeeper-update. No se restaura la base automáticamente.'
  exit "$result"
}
trap on_error ERR

phase='descarga de GitHub'
printf '\n[1/6] Descargando main del repositorio público…\n'
# Fetch by URL keeps an existing SSH origin available for users who also push.
git fetch "$remote_url" main
target=$(git rev-parse FETCH_HEAD)
before=$(git rev-parse HEAD)
git merge-base --is-ancestor "$before" "$target" || fail 'main contiene commits que no están en GitHub; no se sobrescribe'

verify_health() {
  local health
  local status_regex='"status"[[:space:]]*:[[:space:]]*"ok"'
  local database_regex='"database"[[:space:]]*:[[:space:]]*"ok"'
  "${COMPOSE[@]}" exec -T web wget -q -O /dev/null http://127.0.0.1:5173 || return 1
  health=$("${COMPOSE[@]}" exec -T api wget -qO- http://127.0.0.1:3000/health) || return 1
  [[ "$health" =~ $status_regex && "$health" =~ $database_regex ]]
}

deployed=''
[[ ! -f "$deployed_file" ]] || deployed=$(cat "$deployed_file")
if [[ "$deployed" == "$target" && "$before" == "$target" && ! -f "$pending_file" ]] && verify_health; then
  printf '\nBloodKeeper ya está actualizado y responde correctamente: %s\n' "$target"
  exit 0
fi

phase='copia de seguridad previa'
printf '\n[2/6] Guardando código, configuración y copia lógica de PostgreSQL…\n'
git archive --format=tar.gz "$before" > "$backup/source-before.tar.gz"
"${COMPOSE[@]}" exec -T postgres sh -c 'exec pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$backup/database.dump.partial"
[[ -s "$backup/database.dump.partial" ]]
"${COMPOSE[@]}" exec -T postgres pg_restore --list < "$backup/database.dump.partial" > /dev/null
mv "$backup/database.dump.partial" "$backup/database.dump"
if [[ $(id -u) == 0 ]]; then
  cp -- "$env_file" "$backup/environment.env"
else
  sudo cp -- "$env_file" "$backup/environment.env"
fi
cp -- "$compose_file" "$backup/compose-before.yaml"
printf 'before=%s\ntarget=%s\n' "$before" "$target" > "$backup/versions.txt"
printf '%s\n' "$target" > "$pending_file"

phase='integración del código'
git merge --ff-only "$target"
# Refresh tracking only when origin really is this project's public repository.
origin_url=$(git config --get remote.origin.url || true)
case "$origin_url" in
  https://github.com/TrombosisLab/bloodkeeper.git|https://github.com/TrombosisLab/bloodkeeper|git@github.com:TrombosisLab/bloodkeeper.git)
    git update-ref refs/remotes/origin/main "$target" ;;
esac
"${COMPOSE[@]}" config --quiet

phase='construcción y compilación'
printf '\n[3/6] Construyendo y comprobando las imágenes…\n'
"${COMPOSE[@]}" build
# Release Dockerfiles compile in their build stages; development images need an explicit check.
"${COMPOSE[@]}" run --rm --no-deps -T api sh -c 'if [ -x node_modules/.bin/tsc ]; then npm run build; else test -s dist/main.js; fi'
"${COMPOSE[@]}" run --rm --no-deps -T web sh -c 'if command -v npm >/dev/null && test -f package.json; then npm run build; else test -s /usr/share/nginx/html/index.html; fi'

phase='preparación de PostgreSQL'
printf '\n[4/6] Preparando PostgreSQL y volúmenes…\n'
"${COMPOSE[@]}" up -d --wait --wait-timeout 120 postgres
"${COMPOSE[@]}" up -d backup-init

phase='migraciones'
printf '\n[5/6] Aplicando migraciones…\n'
"${COMPOSE[@]}" run --rm --no-deps -T api npx prisma migrate deploy

phase='despliegue y comprobación de salud'
printf '\n[6/6] Desplegando y esperando los servicios…\n'
"${COMPOSE[@]}" up -d --wait --wait-timeout 180 api web backup-worker backup-scheduler
verify_health
"${COMPOSE[@]}" ps

printf '%s\n' "$target" > "$deployed_file.tmp"
mv "$deployed_file.tmp" "$deployed_file"
rm -f -- "$pending_file"
printf '\nActualización completada correctamente.\nVersión desplegada: %s\nCopia e informe: %s\n' "$target" "$backup"
