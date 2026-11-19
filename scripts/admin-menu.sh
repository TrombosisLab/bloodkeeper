#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$({ cd "$(dirname "${BASH_SOURCE[0]}")/.."; pwd; })"

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

run_menu_action() {
  local result=0
  "$@" || result=$?
  if ((result != 0)); then
    printf '\nLa operación terminó con código %s. El panel sigue abierto.\n' "$result" >&2
  fi
}

portable_backup_menu() {
  while true; do
    printf '\n============================================================\n'
    printf 'BLOODKEEPER — COPIAS PORTABLES\n'
    printf '============================================================\n'
    printf '[1] Exportar copias ahora (elegir carpeta)\n'
    printf '[2] Consultar exportación automática\n'
    printf '[3] Activar exportación diaria (elegir carpeta)\n'
    printf '[4] Desactivar exportación diaria\n'
    printf '[5] Importar y restaurar una copia portable en este servidor\n'
    printf '[q] Volver\n'
    read -r -p 'Elige una opción: ' option

    case "$option" in
      1)
        keep=""
        read -r -p 'Conjuntos a conservar [30; 0 no elimina ninguno]: ' keep
        run_menu_action "$ROOT/scripts/export-portable-backups.sh" --keep "${keep:-30}"
        pause_menu
        ;;
      2)
        run_menu_action "$ROOT/scripts/install-host-backup-export.sh" --status
        pause_menu
        ;;
      3)
        hour=""
        minute=""
        keep=""
        read -r -p 'Hora UTC posterior a la copia interna [4]: ' hour
        read -r -p 'Minuto [0]: ' minute
        read -r -p 'Conjuntos a conservar [30; 0 no elimina ninguno]: ' keep
        run_menu_action "$ROOT/scripts/install-host-backup-export.sh" --enable \
          --hour "${hour:-4}" \
          --minute "${minute:-0}" \
          --keep "${keep:-30}"
        pause_menu
        ;;
      4)
        run_menu_action "$ROOT/scripts/install-host-backup-export.sh" --disable
        pause_menu
        ;;
      5)
        archive=""
        read -r -p 'Ruta completa del archivo portable .tar.gz: ' archive
        if [[ -z "$archive" ]]; then
          printf 'Operación cancelada.\n'
        elif [[ ! -f "$archive" || -L "$archive" ]]; then
          printf 'ERROR: la ruta no apunta a un archivo normal.\n' >&2
        elif "$ROOT/scripts/restore-portable-backup.sh" --verify "$archive"; then
          answer=""
          read -r -p 'Verificación correcta. ¿Aplicar esta copia a este servidor? [s/N]: ' answer
          case "$answer" in
            s|S|si|SI|sí|Sí)
              run_menu_action "$ROOT/scripts/restore-portable-backup.sh" --apply "$archive" --confirm
              ;;
            *) printf 'Restauración no aplicada; los datos actuales no se cambiaron.\n' ;;
          esac
        else
          result=$?
          printf 'La verificación falló (código %s); no se ofrecerá aplicar esta copia.\n' "$result" >&2
        fi
        pause_menu
        ;;
      q|Q) return ;;
      *) printf 'Opción no válida.\n' ;;
    esac
  done
}

backup_menu() {
  while true; do
    printf '\n============================================================\n'
    printf 'BLOODKEEPER — COPIAS Y RECUPERACIÓN\n'
    printf '============================================================\n'
    printf '[1] Gestionar copias portables (exportar, programar e importar)\n'
    printf '[2] Consultar servicio de petición manual desde la Web\n'
    printf '[q] Volver\n'
    read -r -p 'Elige una opción: ' option

    case "$option" in
      1) portable_backup_menu ;;
      2)
        "$ROOT/scripts/install-manual-backup-request-service.sh" --status
        pause_menu
        ;;
      q|Q) return ;;
      *) printf 'Opción no válida.\n' ;;
    esac
  done
}

database_password_menu_action() {
  local result=0
  printf '\nBLOODKEEPER — CAMBIAR CONTRASEÑA DE POSTGRESQL\n'
  printf 'Esta opción cambia la contraseña de la base de datos, no la de los usuarios de la aplicación.\n'
  printf 'La herramienta comprueba la configuración, crea una copia y pide la contraseña dos veces de forma visible.\n'
  printf 'No continúes durante otra actualización, restauración o copia de seguridad.\n'
  if [[ ! -f "$ROOT/scripts/change-database-password.sh" || ! -f "$ROOT/scripts/change-database-password.py" ]]; then
    printf 'ERROR: falta la herramienta de cambio de contraseña; no se modificó nada.\n' >&2
    pause_menu
    return
  fi
  if bash "$ROOT/scripts/change-database-password.sh" --repo "$ROOT"; then
    printf '\nLa herramienta ha finalizado correctamente.\n'
  else
    result=$?
    printf '\nLa herramienta terminó con código %s. Lee su resultado y conserva cualquier copia indicada.\n' "$result" >&2
    printf 'No se presupone que el cambio o la recuperación hayan terminado correctamente.\n' >&2
  fi
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
  printf '[4] Copias y recuperación portable\n'
  printf '[5] Cloudflare Tunnel\n'
  printf '[6] Operación, actualización y rollback\n'
  printf '[7] Limpiar completamente la base de datos\n'
  printf '[8] Cambiar contraseña de PostgreSQL\n'
  printf '[q] Salir\n'
  read -r -p 'Elige una opción: ' option

  case "$option" in
    1) "$ROOT/scripts/status.sh"; pause_menu ;;
    2) "$ROOT/scripts/check.sh"; pause_menu ;;
    3) "$ROOT/scripts/logs.sh"; pause_menu ;;
    4) backup_menu ;;
    5) "$ROOT/scripts/configure-cloudflare.sh"; pause_menu ;;
    6) operations_menu ;;
    7)
      printf '\nATENCIÓN: se creará una copia y después se borrará la base actual.\n'
      read -r -p 'Escribe LIMPIAR para continuar: ' confirmation
      if [ "$confirmation" = 'LIMPIAR' ]; then
        bash "$ROOT/scripts/reset-database.sh" --confirm
      else
        printf 'Operación cancelada.\n'
      fi
      pause_menu
      ;;
    8) database_password_menu_action ;;
    q|Q) printf 'Panel cerrado.\n'; exit 0 ;;
    *) printf 'Opción no válida.\n' ;;
  esac
done
