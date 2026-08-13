#!/usr/bin/env bash

ROOT="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/.."
  pwd
)"

MODE="check"
PLAN=""
CONFIRMED="false"
RESTORE_DATA="false"
CONFIRM_DATA_RESTORE="false"

ROLLBACK_HEAD=""
FAILED_HEAD=""
BACKUP_ARCHIVE=""
MIGRATION_CHANGES=""
RESTORE_TEMP=""

usage(){
  cat <<'HELP'
Uso:
  ./scripts/rollback-update.sh \
    --check \
    --plan RUTA/update_plan_*.txt

  ./scripts/rollback-update.sh \
    --apply \
    --plan RUTA/update_plan_*.txt \
    --confirm

  ./scripts/rollback-update.sh \
    --apply \
    --plan RUTA/update_plan_*.txt \
    --restore-data \
    --confirm-data-restore \
    --confirm

Modos:
  --check  Verifica el plan, la referencia previa y el backup sin cambiar
           código, datos ni contenedores.
  --apply  Vuelve a la referencia previa, reconstruye y valida servicios.

Datos:
  --restore-data
      Restaura el dump previo a la actualización. Sólo debe usarse cuando
      el esquema/datos lo requieran o exista corrupción.
  --confirm-data-restore
      Confirmación adicional obligatoria para --restore-data.

Reglas:
- no ejecuta git fetch ni git pull;
- no inventa migraciones SQL inversas;
- un plan con migraciones no puede volver sólo el código: exige restaurar
  explícitamente los datos previos;
- restaurar datos puede descartar cambios realizados después del backup;
- los snapshots de VirtualBox siguen siendo una medida manual del host.
HELP
}

die(){
  printf 'ERROR: %s\n' "$*" >&2
  return 1
}

cleanup(){
  if [[ -n "$RESTORE_TEMP" && -d "$RESTORE_TEMP" ]]; then
    rm -rf "$RESTORE_TEMP" 2>/dev/null || true
  fi
}

plan_value(){
  key="$1"

  grep -m1 "^${key}=" "$PLAN" |
    cut -d= -f2-
}

plan_section(){
  section="$1"

  awk \
    -v wanted="$section" '
      $0 == "[" wanted "]" {
        inside = 1
        next
      }

      /^\[/ {
        inside = 0
      }

      inside {
        print
      }
    ' \
    "$PLAN"
}

wait_service(){
  service="$1"
  attempts=90

  while [[ "$attempts" -gt 0 ]]; do
    container_id="$(docker compose ps -q "$service" 2>/dev/null)"

    if [[ -n "$container_id" ]]; then
      state="$(
        docker inspect \
          --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' \
          "$container_id" \
          2>/dev/null
      )"

      case "$state" in
        healthy|running)
          printf '✓ %s: %s\n' "$service" "$state"
          return 0
          ;;
        unhealthy|exited|dead)
          die "$service está en estado $state."
          return 1
          ;;
      esac
    fi

    sleep 2
    attempts=$((attempts - 1))
  done

  die "$service no alcanzó un estado saludable."
  return 1
}

parse_args(){
  while [[ "$#" -gt 0 ]]; do
    case "$1" in
      --check)
        MODE="check"
        shift
        ;;
      --apply)
        MODE="apply"
        shift
        ;;
      --plan)
        [[ "$#" -ge 2 ]] || {
          die "Falta la ruta del plan."
          return 1
        }
        PLAN="$2"
        shift 2
        ;;
      --restore-data)
        RESTORE_DATA="true"
        shift
        ;;
      --confirm-data-restore)
        CONFIRM_DATA_RESTORE="true"
        shift
        ;;
      --confirm)
        CONFIRMED="true"
        shift
        ;;
      --help|-h)
        usage
        return 2
        ;;
      *)
        usage
        die "Argumento no reconocido: $1"
        return 1
        ;;
    esac
  done

  return 0
}

validate_plan(){
  [[ -n "$PLAN" ]] || {
    die "Debes indicar --plan."
    return 1
  }

  [[ -f "$PLAN" ]] || {
    die "No existe el plan: $PLAN"
    return 1
  }

  [[ -r "$PLAN" ]] || {
    die "El plan no es legible."
    return 1
  }

  format="$(plan_value format)"

  [[ "$format" == "bloodkeeper_update_preparation_v1" ]] || {
    die "Formato de plan no reconocido."
    return 1
  }

  ROLLBACK_HEAD="$(plan_value current_head)"
  FAILED_HEAD="$(plan_value target_head)"
  BACKUP_ARCHIVE="$(plan_value backup_archive)"
  MIGRATION_CHANGES="$(
    plan_section migration_changes |
      sed '/^[[:space:]]*$/d'
  )"

  [[ -n "$ROLLBACK_HEAD" ]] || {
    die "El plan no contiene current_head."
    return 1
  }

  [[ -n "$FAILED_HEAD" ]] || {
    die "El plan no contiene target_head."
    return 1
  }

  [[ -n "$BACKUP_ARCHIVE" ]] || {
    die "El plan no contiene backup_archive."
    return 1
  }

  git rev-parse \
    --verify \
    "${ROLLBACK_HEAD}^{commit}" \
    >/dev/null 2>&1 || {
      die "La referencia previa no existe localmente: $ROLLBACK_HEAD"
      return 1
    }

  git rev-parse \
    --verify \
    "${FAILED_HEAD}^{commit}" \
    >/dev/null 2>&1 || {
      die "La referencia objetivo del plan no existe localmente: $FAILED_HEAD"
      return 1
    }

  ROLLBACK_HEAD="$(git rev-parse "${ROLLBACK_HEAD}^{commit}")"
  FAILED_HEAD="$(git rev-parse "${FAILED_HEAD}^{commit}")"

  [[ -s "$BACKUP_ARCHIVE" ]] || {
    die "No existe el backup completo del plan."
    return 1
  }

  [[ -s "$BACKUP_ARCHIVE.sha256" ]] || {
    die "Falta checksum del backup del plan."
    return 1
  }

  [[ -s "$BACKUP_ARCHIVE.meta" ]] || {
    die "Faltan metadatos del backup del plan."
    return 1
  }

  return 0
}

verify_backup(){
  ./scripts/restore-full.sh \
    --verify \
    "$BACKUP_ARCHIVE" || {
      die "El backup previo no supera la verificación."
      return 1
    }

  return 0
}

preflight(){
  ./scripts/bootstrap-server.sh --check-host || {
    die "El host no supera la validación."
    return 1
  }

  docker compose config --quiet || {
    die "Docker Compose no valida."
    return 1
  }

  validate_plan || return 1
  verify_backup || return 1

  printf 'HEAD previo: %s\n' "$ROLLBACK_HEAD"
  printf 'HEAD de actualización: %s\n' "$FAILED_HEAD"
  printf 'Backup: %s\n' "$BACKUP_ARCHIVE"

  if [[ -n "$MIGRATION_CHANGES" ]]; then
    printf 'Migraciones detectadas en el plan:\n%s\n' "$MIGRATION_CHANGES"
    printf '%s\n' \
      'La reversión operativa exigirá --restore-data y' \
      '--confirm-data-restore; no se ejecutará SQL inverso.'
  else
    printf '✓ El plan no contiene migraciones Prisma.\n'
  fi

  return 0
}

restore_preupdate_data(){
  RESTORE_TEMP="$(
    mktemp -d /tmp/bloodkeeper-update-rollback.XXXXXX
  )" || {
    die "No se pudo crear directorio temporal."
    return 1
  }

  tar \
    --extract \
    --gzip \
    --file "$BACKUP_ARCHIVE" \
    --directory "$RESTORE_TEMP" || {
      die "No se pudo extraer temporalmente el backup."
      return 1
    }

  dump="$(
    find "$RESTORE_TEMP/database" \
      -maxdepth 1 \
      -type f \
      -name '*.dump' \
      -print \
      -quit
  )"

  [[ -n "$dump" && -s "$dump" ]] || {
    die "No se localizó el dump PostgreSQL del backup."
    return 1
  }

  [[ -s "$dump.sha256" ]] || {
    die "Falta checksum del dump PostgreSQL."
    return 1
  }

  [[ -s "$dump.meta" ]] || {
    die "Faltan metadatos del dump PostgreSQL."
    return 1
  }

  ./scripts/restore.sh --verify "$dump" || {
    die "El dump previo no supera la verificación."
    return 1
  }

  ./scripts/restore.sh \
    --apply \
    "$dump" \
    --confirm || {
      die "Falló la restauración explícita de los datos previos."
      return 1
    }

  printf '✓ Datos previos restaurados mediante restore.sh.\n'
  return 0
}

apply_rollback(){
  installed_head="$(git rev-parse HEAD)"

  [[ "$installed_head" == "$FAILED_HEAD" ]] || {
    die "HEAD no coincide con el objetivo fallido del plan."
    return 1
  }

  [[ "$ROLLBACK_HEAD" != "$FAILED_HEAD" ]] || {
    die "El plan no representa un cambio de versión real."
    return 1
  }

  [[ -z "$(git status --porcelain=v1 --untracked-files=all)" ]] || {
    die "El working tree debe estar limpio para aplicar rollback."
    return 1
  }

  if [[ -n "$MIGRATION_CHANGES" &&
        "$RESTORE_DATA" != "true" ]]; then
    die "El plan contiene migraciones: el rollback exige --restore-data."
    return 1
  fi

  docker compose stop web api || {
    die "No se pudieron detener Web/API antes del rollback."
    return 1
  }

  git checkout --detach "$ROLLBACK_HEAD" || {
    die "No se pudo volver al commit previo."
    return 1
  }

  [[ "$(git rev-parse HEAD)" == "$ROLLBACK_HEAD" ]] || {
    die "HEAD no coincide con la versión previa."
    return 1
  }

  [[ -z "$(git status --porcelain=v1 --untracked-files=all)" ]] || {
    die "La versión previa no quedó con working tree limpio."
    return 1
  }

  docker compose config --quiet || {
    die "El Compose de la versión previa no valida."
    return 1
  }

  docker compose build api web || {
    die "Falló el build de la versión previa."
    return 1
  }

  docker compose up -d postgres || {
    die "No se pudo arrancar PostgreSQL."
    return 1
  }

  wait_service postgres || return 1

  if [[ "$RESTORE_DATA" == "true" ]]; then
    restore_preupdate_data || return 1
  fi

  docker compose up -d api web || {
    die "No se pudieron arrancar API/Web previos."
    return 1
  }

  wait_service api || return 1
  wait_service web || return 1

  ./scripts/check.sh || {
    die "La validación funcional posterior al rollback falló."
    return 1
  }

  return 0
}

main(){
  cd "$ROOT" || {
    die "No se puede acceder al repositorio."
    return 1
  }

  trap cleanup EXIT

  parse_args "$@"
  parse_rc="$?"

  if [[ "$parse_rc" -eq 2 ]]; then
    return 0
  fi

  [[ "$parse_rc" -eq 0 ]] || return 1

  printf '============================================================\n'
  printf 'BLOODKEEPER — ROLLBACK DE ACTUALIZACIÓN\n'
  printf '============================================================\n'
  printf 'Modo: %s\n' "$MODE"
  printf 'Plan: %s\n' "${PLAN:-no-indicado}"

  preflight || return 1

  if [[ "$MODE" == "check" ]]; then
    printf 'ROLLBACK — PRECHECK CORRECTO\n'
    return 0
  fi

  [[ "$CONFIRMED" == "true" ]] || {
    die "--apply requiere --confirm."
    return 1
  }

  if [[ "$RESTORE_DATA" == "true" &&
        "$CONFIRM_DATA_RESTORE" != "true" ]]; then
    die "--restore-data requiere --confirm-data-restore."
    return 1
  fi

  if [[ "$CONFIRM_DATA_RESTORE" == "true" &&
        "$RESTORE_DATA" != "true" ]]; then
    die "--confirm-data-restore sólo es válido con --restore-data."
    return 1
  fi

  apply_rollback || return 1

  printf '\n'
  printf '============================================================\n'
  printf 'ROLLBACK COMPLETADO\n'
  printf '============================================================\n'
  printf 'Versión restaurada: %s\n' "$(git rev-parse HEAD)"
  printf 'Datos restaurados: %s\n' "$RESTORE_DATA"
  printf 'Health checks: OK\n'
  printf 'Validación funcional: OK\n'
  printf 'SQL inverso automático: NO.\n'
  printf 'Fetch/pull remoto: NO.\n'

  return 0
}

main "$@"
