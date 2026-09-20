#!/usr/bin/env bash
set -Eeuo pipefail

# Menú local de operaciones de BloodKeeper.
# Las operaciones destructivas conservan una copia previa y requieren
# confirmación interactiva.

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/.env"
COMPOSE_FILE=""
PROJECT_NAME=""
MODE="menu"
EXPORT_DESTINATION=""
CRON_BEGIN="# BEGIN BLOODKEEPER DOCKER BACKUP EXPORT"
CRON_END="# END BLOODKEEPER DOCKER BACKUP EXPORT"
DOCKER_USE_SUDO=0

if [ -n "$(printenv BLOODKEEPER_ENV_FILE 2>/dev/null || true)" ]; then
  ENV_FILE="$(printenv BLOODKEEPER_ENV_FILE)"
fi
if [ -n "$(printenv BLOODKEEPER_COMPOSE_FILE 2>/dev/null || true)" ]; then
  COMPOSE_FILE="$(printenv BLOODKEEPER_COMPOSE_FILE)"
fi
if [ -n "$(printenv BLOODKEEPER_PROJECT_NAME 2>/dev/null || true)" ]; then
  PROJECT_NAME="$(printenv BLOODKEEPER_PROJECT_NAME)"
fi

die() {
  printf 'ERROR: %s\n' "$*" >&2
  return 1
}

docker_exec() {
  if [ "$DOCKER_USE_SUDO" = "1" ]; then
    sudo docker "$@"
  else
    docker "$@"
  fi
}

compose() {
  docker_exec compose \
    --env-file "$ENV_FILE" \
    --project-name "$PROJECT_NAME" \
    --file "$COMPOSE_FILE" \
    "$@"
}

operator_home() {
  local user
  local home

  user="$(printenv SUDO_USER 2>/dev/null || true)"
  if [ -z "$user" ]; then
    user="$(id -un)"
  fi
  home="$(getent passwd "$user" 2>/dev/null | cut -d: -f6 || true)"
  if [ -z "$home" ]; then
    home="$HOME"
  fi
  printf '%s\n' "$home"
}

default_export_destination() {
  printf '%s/bloodkeeper_backups/exported\n' "$(operator_home)"
}

select_docker() {
  if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    DOCKER_USE_SUDO=0
  elif command -v sudo >/dev/null 2>&1 && sudo docker info >/dev/null 2>&1; then
    DOCKER_USE_SUDO=1
  else
    die 'Docker no está disponible para el usuario actual.'
  fi
}

container_for_service() {
  local service="$1"
  local container

  container="$(compose ps -aq "$service" 2>/dev/null | sed -n '1p' || true)"
  if [ -z "$container" ]; then
    container="$(docker_exec ps -aq \
      --filter "label=com.docker.compose.service=$service" |
      sed -n '1p')"
  fi
  printf '%s\n' "$container"
}

resolve_runtime() {
  local reference
  local project
  local config_files
  local first_file

  reference="$(docker_exec ps -aq \
    --filter 'label=com.docker.compose.service=postgres' |
    sed -n '1p')"

  if [ -z "$PROJECT_NAME" ] && [ -n "$reference" ]; then
    project="$(docker_exec inspect "$reference" \
      --format '{{index .Config.Labels "com.docker.compose.project"}}' \
      2>/dev/null || true)"
    PROJECT_NAME="$project"
  fi

  if [ -z "$COMPOSE_FILE" ] && [ -n "$reference" ]; then
    config_files="$(docker_exec inspect "$reference" \
      --format '{{index .Config.Labels "com.docker.compose.project.config_files"}}' \
      2>/dev/null || true)"
    first_file="$(printf '%s' "$config_files" | cut -d, -f1)"
    if [ -n "$first_file" ] && [ -f "$first_file" ]; then
      COMPOSE_FILE="$first_file"
    fi
  fi

  if [ -z "$PROJECT_NAME" ]; then
    PROJECT_NAME="bloodkeeper"
  fi
  if [ -z "$COMPOSE_FILE" ]; then
    if [ -f "$ROOT/compose.deploy.yaml" ]; then
      COMPOSE_FILE="$ROOT/compose.deploy.yaml"
    else
      COMPOSE_FILE="$ROOT/compose.yaml"
    fi
  fi

  [ -f "$ENV_FILE" ] || die "No existe la configuración local: $ENV_FILE"
  [ -f "$COMPOSE_FILE" ] || die "No existe el archivo Compose: $COMPOSE_FILE"
  compose config --quiet || die 'La configuración Docker Compose no es válida.'
}

container_environment_value() {
  local container="$1"
  local key="$2"

  docker_exec inspect \
    --format '{{range .Config.Env}}{{println .}}{{end}}' \
    "$container" |
    sed -n "s/^$key=//p" |
    sed -n '1p'
}

wait_for_service() {
  local service="$1"
  local attempts=60
  local container
  local state

  while [ "$attempts" -gt 0 ]; do
    container="$(container_for_service "$service")"
    if [ -n "$container" ]; then
      state="$(docker_exec inspect \
        --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' \
        "$container" 2>/dev/null || true)"
      case "$state" in
        healthy|running) return 0 ;;
        unhealthy|exited|dead) return 1 ;;
      esac
    fi
    sleep 2
    attempts=$((attempts - 1))
  done
  return 1
}

validate_destination() {
  local destination="$1"

  case "$destination" in
    /*) ;;
    *) die 'La ruta de destino debe ser absoluta.' ;;
  esac
  [ "$destination" != "/" ] || die 'No se permite usar la raíz como destino.'
  case "$destination" in
    /var/lib/docker|/var/lib/docker/*)
      die 'No se permite usar una ruta interna de Docker como destino.'
      ;;
  esac
}

latest_worker_archive() {
  local worker="$1"
  local archive

  archive="$(docker_exec exec "$worker" sh -lc \
    'ls -1t /backups/bloodkeeper_full_*.tar.gz 2>/dev/null | head -n 1' ||
    true)"
  archive="$(basename "$archive")"
  case "$archive" in
    bloodkeeper_full_*.tar.gz) printf '%s\n' "$archive" ;;
    *) die 'No se encontró ninguna copia portable en backup_archives.' ;;
  esac
}

export_latest_backup() {
  local destination="$1"
  local worker
  local archive
  local stage

  validate_destination "$destination"
  mkdir -p "$destination"
  chmod 700 "$destination" 2>/dev/null || true
  worker="$(container_for_service backup-worker)"
  [ -n "$worker" ] || die 'No se encontró el servicio backup-worker.'
  archive="$(latest_worker_archive "$worker")"
  stage="$(mktemp -d "$destination/.bloodkeeper-export.XXXXXX")"

  cleanup_export() {
    rm -rf "$stage"
  }
  trap cleanup_export RETURN

  docker_exec cp "$worker:/backups/$archive" "$stage/"
  [ -s "$stage/$archive" ] || die 'La copia exportada está vacía.'
  if docker_exec exec "$worker" test -f "/backups/$archive.sha256"; then
    docker_exec cp "$worker:/backups/$archive.sha256" "$stage/"
  fi
  if docker_exec exec "$worker" test -f "/backups/$archive.meta"; then
    docker_exec cp "$worker:/backups/$archive.meta" "$stage/"
  fi
  tar -tzf "$stage/$archive" >/dev/null ||
    die 'El paquete exportado no es un tar.gz válido.'
  if [ -f "$stage/$archive.sha256" ]; then
    (cd "$stage" && sha256sum -c "$archive.sha256") ||
      die 'El checksum de la copia exportada no coincide.'
  fi

  chmod 600 "$stage"/*
  if [ -f "$stage/$archive.sha256" ]; then
    mv -f "$stage/$archive.sha256" "$destination/"
  fi
  if [ -f "$stage/$archive.meta" ]; then
    mv -f "$stage/$archive.meta" "$destination/"
  fi
  mv -f "$stage/$archive" "$destination/"
  trap - RETURN
  cleanup_export
  printf '✓ Copia exportada: %s/%s\n' "$destination" "$archive"
}

cron_current() {
  crontab -l 2>/dev/null || true
}

cron_without_export_block() {
  awk -v begin="$CRON_BEGIN" -v end="$CRON_END" '
    $0 == begin { skipping = 1; next }
    $0 == end { skipping = 0; next }
    !skipping { print }
  '
}

install_export_schedule() {
  local destination="$1"
  local hour="$2"
  local minute="$3"
  local filtered
  local root_q
  local env_q
  local compose_q
  local project_q
  local destination_q
  local command_line

  validate_destination "$destination"
  case "$hour" in ''|*[!0-9]*) die 'La hora debe ser numérica.' ;; esac
  case "$minute" in ''|*[!0-9]*) die 'El minuto debe ser numérico.' ;; esac
  [ "$hour" -le 23 ] || die 'La hora debe estar entre 0 y 23.'
  [ "$minute" -le 59 ] || die 'El minuto debe estar entre 0 y 59.'
  command -v crontab >/dev/null 2>&1 ||
    die 'No está instalado crontab en esta máquina.'
  mkdir -p "$destination"
  chmod 700 "$destination" 2>/dev/null || true

  filtered="$(cron_current | cron_without_export_block)"
  root_q="$(printf '%q' "$ROOT")"
  env_q="$(printf '%q' "$ENV_FILE")"
  compose_q="$(printf '%q' "$COMPOSE_FILE")"
  project_q="$(printf '%q' "$PROJECT_NAME")"
  destination_q="$(printf '%q' "$destination")"
  command_line="BLOODKEEPER_ENV_FILE=$env_q BLOODKEEPER_COMPOSE_FILE=$compose_q BLOODKEEPER_PROJECT_NAME=$project_q $root_q/scripts/admin-menu.sh --export-latest --destination $destination_q"

  {
    if [ -n "$filtered" ]; then
      printf '%s\n' "$filtered"
    fi
    printf '%s\n' "$CRON_BEGIN"
    printf '%s %s * * * %s >> %s/export.log 2>&1\n' \
      "$minute" "$hour" "$command_line" "$destination_q"
    printf '%s\n' "$CRON_END"
  } | crontab -
  printf '✓ Exportación automática programada a las %02d:%02d\n' "$hour" "$minute"
  printf '✓ Destino: %s\n' "$destination"
}

remove_export_schedule() {
  local filtered
  command -v crontab >/dev/null 2>&1 ||
    die 'No está instalado crontab en esta máquina.'
  filtered="$(cron_current | cron_without_export_block)"
  if [ -n "$filtered" ]; then
    printf '%s\n' "$filtered" | crontab -
  else
    crontab -r 2>/dev/null || true
  fi
  echo '✓ Exportación automática eliminada.'
}

show_export_schedule() {
  cron_current | sed -n "/^$CRON_BEGIN$/,/^$CRON_END$/p"
}

database_context() {
  POSTGRES_CONTAINER="$(container_for_service postgres)"
  [ -n "$POSTGRES_CONTAINER" ] || die 'No se encontró PostgreSQL.'
  POSTGRES_DB="$(container_environment_value "$POSTGRES_CONTAINER" POSTGRES_DB)"
  POSTGRES_USER="$(container_environment_value "$POSTGRES_CONTAINER" POSTGRES_USER)"
  case "$POSTGRES_DB:$POSTGRES_USER" in
    *[!A-Za-z0-9_:]*|:*) die 'La configuración de PostgreSQL no es segura.' ;;
  esac
}

dump_database() {
  local output="$1"
  local partial="$output.partial.$$"

  docker_exec exec "$POSTGRES_CONTAINER" pg_dump \
    --username="$POSTGRES_USER" \
    --dbname="$POSTGRES_DB" \
    --format=custom \
    --compress=6 \
    --no-owner \
    --no-privileges \
    > "$partial"
  [ -s "$partial" ] || {
    rm -f "$partial"
    die 'No se pudo crear la copia previa de la base de datos.'
  }
  docker_exec exec -i "$POSTGRES_CONTAINER" pg_restore --list < "$partial" >/dev/null
  mv -f "$partial" "$output"
  sha256sum "$output" > "$output.sha256"
  chmod 600 "$output" "$output.sha256"
}

reset_schema() {
  docker_exec exec "$POSTGRES_CONTAINER" psql \
    --username="$POSTGRES_USER" \
    --dbname="$POSTGRES_DB" \
    --command="DROP SCHEMA public CASCADE; CREATE SCHEMA public; ALTER SCHEMA public OWNER TO \"$POSTGRES_USER\";"
}

restore_dump() {
  local dump="$1"
  reset_schema
  docker_exec exec -i "$POSTGRES_CONTAINER" pg_restore \
    --username="$POSTGRES_USER" \
    --dbname="$POSTGRES_DB" \
    --no-owner \
    --no-privileges \
    --exit-on-error \
    < "$dump"
}

stop_application() {
  compose stop web api backup-worker backup-scheduler >/dev/null 2>&1 || true
}

start_application() {
  compose up -d >/dev/null
  wait_for_service postgres
  wait_for_service api
  wait_for_service web
}

operations_dir() {
  local directory
  directory="$(printenv BLOODKEEPER_OPERATIONS_DIR 2>/dev/null || true)"
  if [ -z "$directory" ]; then
    directory="$(operator_home)/bloodkeeper_backups/operations"
  fi
  mkdir -p "$directory"
  chmod 700 "$directory" 2>/dev/null || true
  printf '%s\n' "$directory"
}

apply_database_operation() {
  local operation="$1"
  local source_dump="$2"
  local directory
  local timestamp
  local previous_dump
  local operation_ok=0

  directory="$(operations_dir)"
  timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
  previous_dump="$directory/pre-$operation"_"$timestamp.dump"
  dump_database "$previous_dump"
  echo "✓ Copia previa: $previous_dump"
  stop_application

  if [ "$operation" = "restore" ]; then
    if restore_dump "$source_dump"; then operation_ok=1; fi
  else
    reset_schema
    if compose run --rm -T api npx prisma migrate deploy; then
      operation_ok=1
    fi
  fi

  if [ "$operation_ok" -ne 1 ]; then
    echo 'ERROR: falló la operación; restaurando la copia previa…' >&2
    restore_dump "$previous_dump" || true
    start_application || true
    die 'Se restauró la copia previa.'
  fi
  if ! start_application; then
    echo 'ERROR: los servicios no están saludables; restaurando…' >&2
    stop_application
    restore_dump "$previous_dump" || true
    start_application || true
    die 'Se restauró la copia previa.'
  fi
  echo "✓ Operación completada: $operation"
  echo "✓ Copia previa conservada: $previous_dump"
}

portable_dump_from_archive() {
  local archive="$1"
  local stage
  local manifest
  local dump

  [ -f "$archive" ] || die "No existe el archivo: $archive"
  tar -tzf "$archive" >/dev/null || die 'El paquete no es tar.gz válido.'
  stage="$(mktemp -d /tmp/bloodkeeper-restore.XXXXXX)"
  tar -xzf "$archive" -C "$stage"
  manifest="$(find "$stage" -type f -name MANIFEST.env -print -quit)"
  dump="$(find "$stage" -type f -name database.dump -print -quit)"
  [ -n "$manifest" ] && [ -n "$dump" ] ||
    die 'El paquete no contiene el dump portable esperado.'
  grep -Fq 'format=bloodkeeper_portable_database_v1' "$manifest" ||
    die 'El paquete no fue generado por backup-worker.'
  if [ -f "$stage/SHA256SUMS" ]; then
    (cd "$stage" && sha256sum -c SHA256SUMS) ||
      die 'Los checksums del paquete no son válidos.'
  fi
  printf '%s|%s\n' "$stage" "$dump"
}

restore_portable_archive() {
  local archive="$1"
  local context
  local stage
  local dump

  context="$(portable_dump_from_archive "$archive")"
  stage="$(printf '%s' "$context" | cut -d'|' -f1)"
  dump="$(printf '%s' "$context" | cut -d'|' -f2-)"
  database_context
  docker_exec exec -i "$POSTGRES_CONTAINER" pg_restore --list < "$dump" >/dev/null
  echo '✓ Paquete verificado y dump legible.'
  apply_database_operation restore "$dump"
  rm -rf "$stage"
}

restore_menu() {
  local archive
  local answer

  read -r -p 'Ruta del paquete .tar.gz: ' archive
  [ -n "$archive" ] || return 0
  case "$archive" in
    "~"/*) archive="$(operator_home)/$(printf '%s' "$archive" | cut -c3-)" ;;
    /*) ;;
    *) archive="$ROOT/$archive" ;;
  esac
  read -r -p '¿Reemplazar los datos actuales? [s/N] ' answer
  case "$answer" in
    s|S|si|sí|SI|Sí) restore_portable_archive "$archive" ;;
    *) echo 'Restauración cancelada.' ;;
  esac
}

reset_database() {
  local confirmation
  local answer
  printf 'Esta operación borrará todos los datos de BloodKeeper.\n'
  printf 'Se conservará una copia previa fuera de Docker.\n'
  read -r -p 'Escribe BORRAR TODO para continuar: ' confirmation
  [ "$confirmation" = 'BORRAR TODO' ] || die 'Operación cancelada.'
  database_context
  apply_database_operation reset ""
  if [ -x "$ROOT/scripts/create-initial-admin.sh" ]; then
    read -r -p '¿Crear una cuenta administradora nueva? [S/n] ' answer
    case "$answer" in
      n|N|no|NO) ;;
      *) BLOODKEEPER_ENV_FILE="$ENV_FILE" BLOODKEEPER_COMPOSE_FILE="$COMPOSE_FILE" BLOODKEEPER_PROJECT_NAME="$PROJECT_NAME" "$ROOT/scripts/create-initial-admin.sh" ;;
    esac
  fi
}

cloudflare_menu() {
  [ -x "$ROOT/scripts/configure-cloudflare.sh" ] ||
    die 'No existe scripts/configure-cloudflare.sh.'
  "$ROOT/scripts/configure-cloudflare.sh"
}

show_status() {
  echo
  echo '== Servicios =='
  compose ps
  echo
  echo '== Exportación de copias =='
  show_export_schedule || true
}

interactive_menu() {
  while true; do
    printf '\n============================================================\n'
    printf 'BLOODKEEPER — MENÚ DE ADMINISTRACIÓN\n'
    printf '============================================================\n'
    printf '1. Ver estado de los servicios\n'
    printf '2. Restaurar una copia portable\n'
    printf '3. Configurar Cloudflare Tunnel\n'
    printf '4. Exportar la última copia fuera de Docker ahora\n'
    printf '5. Configurar exportación automática de copias\n'
    printf '6. Quitar exportación automática\n'
    printf '7. Reinicializar completamente la base de datos\n'
    printf '8. Reiniciar servicios\n'
    printf 'q. Salir\n'
    printf '============================================================\n'
    read -r -p 'Elige una opción: ' choice
    case "$choice" in
      1) show_status ;;
      2) restore_menu ;;
      3) cloudflare_menu ;;
      4)
        destination="$(printenv BLOODKEEPER_BACKUP_EXPORT_DIR 2>/dev/null || true)"
        if [ -z "$destination" ]; then destination="$(default_export_destination)"; fi
        read -r -p "Destino [$destination]: " entered
        if [ -n "$entered" ]; then destination="$entered"; fi
        export_latest_backup "$destination"
        ;;
      5)
        destination="$(printenv BLOODKEEPER_BACKUP_EXPORT_DIR 2>/dev/null || true)"
        if [ -z "$destination" ]; then destination="$(default_export_destination)"; fi
        read -r -p "Destino [$destination]: " entered
        read -r -p 'Hora [3]: ' hour
        read -r -p 'Minuto [20]: ' minute
        if [ -n "$entered" ]; then destination="$entered"; fi
        if [ -z "$hour" ]; then hour=3; fi
        if [ -z "$minute" ]; then minute=20; fi
        install_export_schedule "$destination" "$hour" "$minute"
        ;;
      6) remove_export_schedule ;;
      7) reset_database ;;
      8)
        compose up -d
        wait_for_service postgres && wait_for_service api && wait_for_service web
        echo '✓ Servicios reiniciados.'
        ;;
      q|Q|salir|SALIR) return 0 ;;
      *) echo 'Opción no válida.' ;;
    esac
  done
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --export-latest)
      MODE="export"
      shift
      ;;
    --destination)
      [ "$#" -ge 2 ] || die 'Falta la ruta de destino.'
      EXPORT_DESTINATION="$2"
      shift 2
      ;;
    --status)
      MODE="status"
      shift
      ;;
    --help|-h)
      printf 'Uso: %s [--export-latest --destination RUTA] [--status]\n' "$0"
      exit 0
      ;;
    *)
      die "Argumento no reconocido: $1"
      ;;
  esac
done

select_docker
resolve_runtime

case "$MODE" in
  export)
    if [ -z "$EXPORT_DESTINATION" ]; then
      EXPORT_DESTINATION="$(default_export_destination)"
    fi
    export_latest_backup "$EXPORT_DESTINATION"
    ;;
  status) show_status ;;
  menu) interactive_menu ;;
esac
