#!/usr/bin/env bash

ROOT="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/.."
  pwd
)"

MODE="check"
TARGET="HEAD"
OUTPUT_DIR="${BLOODKEEPER_UPDATE_BACKUP_DIR:-$HOME/bloodkeeper_backups/update-preparation}"
CONFIRMED="false"

CURRENT_HEAD=""
TARGET_HEAD=""
PLAN=""
BACKUP_ARCHIVE=""
VERSION_CHANGED="false"

usage(){
  cat <<'HELP'
Uso:
  ./scripts/apply-update.sh --check --target REFERENCIA_GIT_LOCAL
  ./scripts/apply-update.sh \
    --apply \
    --target REFERENCIA_GIT_LOCAL \
    --confirm
  ./scripts/apply-update.sh \
    --apply \
    --target REFERENCIA_GIT_LOCAL \
    --output-dir RUTA \
    --confirm

Modos:
  --check    Valida host, estado operativo y referencia local.
             No cambia versión, datos ni contenedores.
  --apply    Ejecuta la actualización preparada de extremo a extremo.

Reglas:
- la referencia objetivo debe existir localmente;
- no se ejecutan git fetch, git pull ni descargas de código;
- --apply exige working tree limpio y --confirm;
- se crea y verifica un backup completo antes de cambiar de versión;
- el objetivo se instala como HEAD detached reproducible;
- ante un fallo se detiene la actualización y conserva el plan/backup;
- la reversión automática pertenece al bloque SPEC-046-C.
HELP
}

die(){
  printf 'ERROR: %s\n' "$*" >&2
  return 1
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
      --target)
        [[ "$#" -ge 2 ]] || {
          die "Falta la referencia objetivo."
          return 1
        }
        TARGET="$2"
        shift 2
        ;;
      --output-dir)
        [[ "$#" -ge 2 ]] || {
          die "Falta la ruta de destino."
          return 1
        }
        OUTPUT_DIR="$2"
        shift 2
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

preflight(){
  docker compose config --quiet || {
    die "Docker Compose no valida."
    return 1
  }

  ./scripts/bootstrap-server.sh --check-host || {
    die "El host no supera la validación de despliegue."
    return 1
  }

  [[ -f .env ]] || {
    die "Falta .env."
    return 1
  }

  [[ "$(stat -c '%a' .env)" == "600" ]] || {
    die ".env debe tener permisos 600."
    return 1
  }

  git rev-parse \
    --verify \
    "${TARGET}^{commit}" \
    >/dev/null 2>&1 || {
      die "La referencia objetivo no existe localmente: $TARGET"
      return 1
    }

  CURRENT_HEAD="$(git rev-parse HEAD)"
  TARGET_HEAD="$(git rev-parse "${TARGET}^{commit}")"

  ./scripts/check.sh || {
    die "La instalación actual no supera la validación funcional."
    return 1
  }

  return 0
}

prepare_backup(){
  mkdir -p "$OUTPUT_DIR" || {
    die "No se pudo crear $OUTPUT_DIR"
    return 1
  }

  marker="$(mktemp /tmp/bloodkeeper-update-plan-marker.XXXXXX)" || {
    die "No se pudo crear marcador temporal."
    return 1
  }

  ./scripts/prepare-update.sh \
    --prepare \
    --target "$TARGET" \
    --output-dir "$OUTPUT_DIR" \
    --confirm

  prepare_rc="$?"
  if [[ "$prepare_rc" -ne 0 ]]; then
    rm -f "$marker"
    die "Falló la preparación segura de la actualización."
    return 1
  fi

  PLAN="$(
    find "$OUTPUT_DIR" \
      -maxdepth 1 \
      -type f \
      -name 'update_plan_*.txt' \
      -newer "$marker" \
      -printf '%T@ %p\n' \
      2>/dev/null |
      sort -nr |
      head -n 1 |
      cut -d' ' -f2-
  )"

  rm -f "$marker"

  [[ -n "$PLAN" && -s "$PLAN" ]] || {
    die "No se localizó el plan generado por prepare-update.sh."
    return 1
  }

  plan_current="$(grep -m1 '^current_head=' "$PLAN" | cut -d= -f2-)"
  plan_target="$(grep -m1 '^target_head=' "$PLAN" | cut -d= -f2-)"
  BACKUP_ARCHIVE="$(grep -m1 '^backup_archive=' "$PLAN" | cut -d= -f2-)"

  [[ "$plan_current" == "$CURRENT_HEAD" ]] || {
    die "El plan no corresponde al HEAD de origen."
    return 1
  }

  [[ "$plan_target" == "$TARGET_HEAD" ]] || {
    die "El plan no corresponde al objetivo solicitado."
    return 1
  }

  [[ -s "$BACKUP_ARCHIVE" ]] || {
    die "El backup completo del plan no está disponible."
    return 1
  }

  [[ -s "$BACKUP_ARCHIVE.sha256" ]] || {
    die "Falta checksum del backup completo."
    return 1
  }

  [[ -s "$BACKUP_ARCHIVE.meta" ]] || {
    die "Faltan metadatos del backup completo."
    return 1
  }

  printf '✓ Plan: %s\n' "$PLAN"
  printf '✓ Backup verificado: %s\n' "$BACKUP_ARCHIVE"
  return 0
}

apply_target(){
  git checkout --detach "$TARGET_HEAD" || {
    die "No se pudo instalar la referencia objetivo."
    return 1
  }

  VERSION_CHANGED="true"

  [[ "$(git rev-parse HEAD)" == "$TARGET_HEAD" ]] || {
    die "HEAD no coincide con el objetivo."
    return 1
  }

  [[ -z "$(git status --porcelain=v1 --untracked-files=all)" ]] || {
    die "El target no quedó con working tree limpio."
    return 1
  }

  docker compose config --quiet || {
    die "El Compose del objetivo no valida."
    return 1
  }

  docker compose build api web || {
    die "Falló la construcción de imágenes."
    return 1
  }

  docker compose up -d postgres || {
    die "No se pudo arrancar PostgreSQL."
    return 1
  }

  wait_service postgres || return 1

  docker compose run --rm -T api \
    npx prisma migrate deploy || {
      die "Falló prisma migrate deploy."
      return 1
    }

  docker compose up -d api web || {
    die "No se pudieron arrancar API y Web."
    return 1
  }

  wait_service api || return 1
  wait_service web || return 1

  ./scripts/check.sh || {
    die "La validación funcional posterior falló."
    return 1
  }

  return 0
}

failure_guidance(){
  [[ "$VERSION_CHANGED" == "true" ]] || return 0

  printf '\n'
  printf '============================================================\n'
  printf 'ACTUALIZACIÓN DETENIDA — REQUIERE REVERSIÓN\n'
  printf '============================================================\n'
  printf 'Origen: %s\n' "$CURRENT_HEAD"
  printf 'Objetivo: %s\n' "$TARGET_HEAD"
  printf 'Plan: %s\n' "${PLAN:-no-disponible}"
  printf 'Backup: %s\n' "${BACKUP_ARCHIVE:-no-disponible}"
  printf '%s\n' \
    'No se restaura la base automáticamente: una restauración innecesaria' \
    'podría destruir datos válidos.'
  printf 'Precheck de rollback: ./scripts/rollback-update.sh --check --plan %q\n' "$PLAN"
  printf 'Rollback de código: ./scripts/rollback-update.sh --apply --plan %q --confirm\n' "$PLAN"
  printf '%s\n' \
    'Si el plan contiene migraciones, usar además --restore-data' \
    '--confirm-data-restore tras valorar la pérdida de datos posteriores.'
}

main(){
  cd "$ROOT" || {
    die "No se puede acceder al repositorio."
    return 1
  }

  parse_args "$@"
  parse_rc="$?"

  if [[ "$parse_rc" -eq 2 ]]; then
    return 0
  fi

  [[ "$parse_rc" -eq 0 ]] || return 1

  printf '============================================================\n'
  printf 'BLOODKEEPER — ACTUALIZACIÓN CONTROLADA\n'
  printf '============================================================\n'
  printf 'Modo: %s\n' "$MODE"
  printf 'Objetivo local: %s\n' "$TARGET"

  preflight || return 1

  printf 'HEAD actual: %s\n' "$CURRENT_HEAD"
  printf 'HEAD objetivo: %s\n' "$TARGET_HEAD"

  if [[ "$MODE" == "check" ]]; then
    ./scripts/prepare-update.sh --check --target "$TARGET" || {
      die "La precomprobación del objetivo falló."
      return 1
    }

    printf 'ACTUALIZACIÓN — PRECHECK CORRECTO\n'
    return 0
  fi

  [[ "$CONFIRMED" == "true" ]] || {
    die "--apply requiere --confirm."
    return 1
  }

  [[ -z "$(git status --porcelain=v1 --untracked-files=all)" ]] || {
    die "El working tree debe estar limpio antes de aplicar una actualización."
    return 1
  }

  [[ "$TARGET_HEAD" != "$CURRENT_HEAD" ]] || {
    die "La referencia objetivo ya está instalada."
    return 1
  }

  prepare_backup || return 1

  apply_target
  apply_rc="$?"

  if [[ "$apply_rc" -ne 0 ]]; then
    failure_guidance
    return "$apply_rc"
  fi

  printf '\n'
  printf '============================================================\n'
  printf 'ACTUALIZACIÓN COMPLETADA\n'
  printf '============================================================\n'
  printf 'Origen: %s\n' "$CURRENT_HEAD"
  printf 'Objetivo instalado: %s\n' "$(git rev-parse HEAD)"
  printf 'Plan: %s\n' "$PLAN"
  printf 'Backup previo: %s\n' "$BACKUP_ARCHIVE"
  printf 'Build: OK\n'
  printf 'Migraciones: OK\n'
  printf 'Health checks: OK\n'
  printf 'Validación funcional: OK\n'
  printf 'Repositorio remoto: NO consultado.\n'

  return 0
}

main "$@"
