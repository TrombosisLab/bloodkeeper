#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$({ cd "$(dirname "${BASH_SOURCE[0]}")/.."; pwd; })"
HOST_BACKUP_DIR="${BLOODKEEPER_HOST_BACKUP_DIR:-$ROOT/backups/host}"

if [ "${EUID:-$(id -u)}" -ne 0 ]; then
  printf 'ERROR: ejecuta este panel con sudo:\n  sudo bash scripts/admin-menu.sh\n' >&2
  exit 2
fi

cd "$ROOT"

pause_menu() {
  printf '\nPulsa Intro o cualquier tecla para volver al menú... '
  read -r -n 1 _ || true
  printf '\n'
}

ask_path() {
  local prompt="$1"
  local default="$2"
  local value=""

  read -r -p "$prompt [$default]: " value
  printf '%s\n' "${value:-$default}"
}

backup_menu() {
  while true; do
    printf '\n============================================================\n'
    printf 'BLOODKEEPER — COPIAS DE SEGURIDAD\n'
    printf '============================================================\n'
    printf '[1] Crear copia PostgreSQL inmediata\n'
    printf '[2] Crear paquete completo inmediato\n'
    printf '[3] Programar copias completas\n'
    printf '[4] Consultar programación\n'
    printf '[5] Copiar archivos del volumen Docker al host\n'
    printf '[6] Consultar servicio de petición web\n'
    printf '[7] Restaurar un dump o paquete completo\n'
    printf '[q] Volver\n'
    read -r -p 'Elige una opción: ' option

    case "$option" in
      1)
        mkdir -p "$HOST_BACKUP_DIR/logical"
        "$ROOT/scripts/backup.sh" --output-dir "$HOST_BACKUP_DIR/logical"
        pause_menu
        ;;
      2)
        mirror=""
        read -r -p 'Ruta espejo externa (opcional, Intro para omitir): ' mirror
        mkdir -p "$HOST_BACKUP_DIR/full"
        if [ -n "$mirror" ]; then
          "$ROOT/scripts/backup-full.sh" --output-dir "$HOST_BACKUP_DIR/full" --mirror-dir "$mirror"
        else
          "$ROOT/scripts/backup-full.sh" --output-dir "$HOST_BACKUP_DIR/full"
        fi
        pause_menu
        ;;
      3)
        hour=""
        minute=""
        keep=""
        read -r -p 'Hora UTC [3]: ' hour
        read -r -p 'Minuto [0]: ' minute
        read -r -p 'Conjuntos a conservar [7]: ' keep
        "$ROOT/scripts/install-backup-schedule.sh" --install \
          --hour "${hour:-3}" \
          --minute "${minute:-0}" \
          --keep "${keep:-7}" \
          --output-dir "$HOST_BACKUP_DIR/full"
        pause_menu
        ;;
      4)
        "$ROOT/scripts/install-backup-schedule.sh" --status
        pause_menu
        ;;
      5)
        destination="$(ask_path 'Ruta de destino en la máquina anfitriona' "$HOST_BACKUP_DIR/from-docker")"
        mkdir -p "$destination"
        docker compose cp backup-worker:/backups/. "$destination/"
        chmod 700 "$destination" 2>/dev/null || true
        printf '✓ Archivos copiados a: %s\n' "$destination"
        pause_menu
        ;;
      6)
        "$ROOT/scripts/install-manual-backup-request-service.sh" --status
        pause_menu
        ;;
      7)
        restore_menu
        ;;
      q|Q) return ;;
      *) printf 'Opción no válida.\n' ;;
    esac
  done
}

restore_menu() {
  local archive=""
  local mode=""

  printf '\n============================================================\n'
  printf 'BLOODKEEPER — RESTAURACIÓN\n'
  printf '============================================================\n'
  read -r -p 'Ruta del archivo .dump o .tar.gz: ' archive
  [ -n "$archive" ] || return
  [ -f "$archive" ] || { printf 'ERROR: no existe el archivo.\n'; pause_menu; return; }

  case "$archive" in
    *.dump)
      printf '[1] Verificar sin modificar la base\n'
      printf '[2] Aplicar restauración (crea copia previa y exige confirmación)\n'
      read -r -p 'Elige una opción: ' mode
      case "$mode" in
        1) "$ROOT/scripts/restore.sh" --verify "$archive" ;;
        2) "$ROOT/scripts/restore.sh" --apply "$archive" --confirm ;;
        *) printf 'Opción no válida.\n' ;;
      esac
      ;;
    *.tar.gz)
      printf '[1] Verificar el paquete completo sin desplegarlo\n'
      printf '[2] Preparar restauración completa guiada\n'
      read -r -p 'Elige una opción: ' mode
      case "$mode" in
        1) "$ROOT/scripts/restore-full.sh" --verify "$archive" ;;
        2)
          target=""
          read -r -p "Ruta nueva de recuperación [$ROOT-restored]: " target
          target="${target:-$ROOT-restored}"
          "$ROOT/scripts/restore-full.sh" --verify "$archive"
          "$ROOT/scripts/restore-full.sh" --extract "$archive" --target-dir "$target" --confirm
          printf '\nSiguiente paso: entra en la ruta recuperada y ejecuta el bootstrap indicado.\n'
          ;;
        *) printf 'Opción no válida.\n' ;;
      esac
      ;;
    *) printf 'ERROR: el archivo debe terminar en .dump o .tar.gz.\n' ;;
  esac
  pause_menu
}

operations_menu() {
  while true; do
    printf '\n============================================================\n'
    printf 'BLOODKEEPER — OPERACIÓN Y ACTUALIZACIONES\n'
    printf '============================================================\n'
    printf '[1] Iniciar servicios\n'
    printf '[2] Detener servicios\n'
    printf '[3] Reiniciar y validar servicios\n'
    printf '[4] Comprobar una referencia de actualización\n'
    printf '[5] Aplicar una actualización\n'
    printf '[6] Comprobar rollback\n'
    printf '[7] Aplicar rollback usando un plan\n'
    printf '[q] Volver\n'
    read -r -p 'Elige una opción: ' option

    case "$option" in
      1) "$ROOT/scripts/start.sh"; pause_menu ;;
      2) "$ROOT/scripts/stop.sh" --confirm; pause_menu ;;
      3) "$ROOT/scripts/restart.sh" --confirm; pause_menu ;;
      4)
        read -r -p 'Referencia Git local: ' target
        [ -n "$target" ] && "$ROOT/scripts/apply-update.sh" --check --target "$target"
        pause_menu
        ;;
      5)
        read -r -p 'Referencia Git local: ' target
        [ -n "$target" ] && "$ROOT/scripts/apply-update.sh" --apply --target "$target" --confirm
        pause_menu
        ;;
      6)
        read -r -p 'Ruta del plan de actualización: ' plan
        [ -n "$plan" ] && "$ROOT/scripts/rollback-update.sh" --check --plan "$plan"
        pause_menu
        ;;
      7)
        read -r -p 'Ruta del plan de actualización: ' plan
        [ -n "$plan" ] && "$ROOT/scripts/rollback-update.sh" --apply --plan "$plan" --confirm
        pause_menu
        ;;
      q|Q) return ;;
      *) printf 'Opción no válida.\n' ;;
    esac
  done
}

while true; do
  printf '\n============================================================\n'
  printf 'BLOODKEEPER — PANEL GENERAL DE ADMINISTRACIÓN\n'
  printf 'Repositorio: %s\n' "$ROOT"
  printf '============================================================\n'
  printf '[1] Estado del sistema\n'
  printf '[2] Comprobación operativa\n'
  printf '[3] Logs\n'
  printf '[4] Copias de seguridad\n'
  printf '[5] Restaurar un dump o paquete completo\n'
  printf '[6] Cloudflare Tunnel\n'
  printf '[7] Operación, actualización y rollback\n'
  printf '[8] Limpiar completamente la base de datos\n'
  printf '[q] Salir\n'
  read -r -p 'Elige una opción: ' option

  case "$option" in
    1) "$ROOT/scripts/status.sh"; pause_menu ;;
    2) "$ROOT/scripts/check.sh"; pause_menu ;;
    3) "$ROOT/scripts/logs.sh"; pause_menu ;;
    4) backup_menu ;;
    5) restore_menu ;;
    6) "$ROOT/scripts/configure-cloudflare.sh"; pause_menu ;;
    7) operations_menu ;;
    8)
      printf '\nATENCIÓN: se creará una copia y después se borrará la base actual.\n'
      read -r -p 'Escribe LIMPIAR para continuar: ' confirmation
      if [ "$confirmation" = 'LIMPIAR' ]; then
        bash "$ROOT/scripts/reset-database.sh" --confirm
      else
        printf 'Operación cancelada.\n'
      fi
      pause_menu
      ;;
    q|Q) printf 'Panel cerrado.\n'; exit 0 ;;
    *) printf 'Opción no válida.\n' ;;
  esac
done
