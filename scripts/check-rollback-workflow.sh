#!/usr/bin/env bash

ROOT="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/.."
  pwd
)"

ERRORS=0
TEMP_DIR=""

say(){ printf '%s\n' "$*"; }
err(){ ERRORS=$((ERRORS+1)); printf 'ERROR: %s\n' "$*" >&2; }

cleanup(){
  if [[ -n "$TEMP_DIR" && -d "$TEMP_DIR" ]]; then
    rm -rf "$TEMP_DIR" 2>/dev/null || true
  fi
}

require_file(){
  [[ -f "$1" ]] || err "Falta $1"
}

require_exec(){
  [[ -x "$1" ]] || err "No es ejecutable: $1"
}

require_text(){
  grep -Fq -- "$2" "$1" || err "$1 no contiene: $2"
}

latest_backup(){
  find "$HOME/bloodkeeper_backups" \
    -type f \
    -name 'bloodkeeper_full_*.tar.gz' \
    -printf '%T@ %p\n' \
    2>/dev/null |
    sort -nr |
    head -n 1 |
    cut -d' ' -f2-
}

main(){
  cd "$ROOT" || {
    err "No se puede acceder al repositorio"
    return 1
  }

  trap cleanup EXIT

  say "============================================================"
  say "SPEC-046-C — VALIDACIÓN DEL ROLLBACK"
  say "============================================================"

  require_file scripts/rollback-update.sh
  require_file scripts/apply-update.sh
  require_file scripts/prepare-update.sh
  require_file scripts/restore.sh
  require_file scripts/restore-full.sh

  require_exec scripts/rollback-update.sh
  require_exec scripts/apply-update.sh
  require_exec scripts/restore.sh
  require_exec scripts/restore-full.sh

  bash -n \
    scripts/rollback-update.sh \
    scripts/apply-update.sh ||
    err "Sintaxis shell incorrecta"

  require_text scripts/rollback-update.sh 'bloodkeeper_update_preparation_v1'
  require_text scripts/rollback-update.sh 'git checkout --detach "$ROLLBACK_HEAD"'
  require_text scripts/rollback-update.sh 'docker compose build api web'
  require_text scripts/rollback-update.sh 'docker compose stop web api'
  require_text scripts/rollback-update.sh './scripts/restore-full.sh'
  require_text scripts/rollback-update.sh './scripts/restore.sh --verify'
  require_text scripts/rollback-update.sh '--restore-data requiere --confirm-data-restore.'
  require_text scripts/rollback-update.sh 'El plan contiene migraciones: el rollback exige --restore-data.'
  require_text scripts/rollback-update.sh 'SQL inverso automático: NO.'
  require_text scripts/apply-update.sh './scripts/rollback-update.sh --check --plan'

  if grep -Eq \
      '^[[:space:]]*git[[:space:]]+(fetch|pull)([[:space:]]|$)|^[[:space:]]*docker[[:space:]]+pull([[:space:]]|$)' \
      scripts/rollback-update.sh
  then
    err "rollback-update.sh contiene consulta remota ejecutable"
  else
    say "✓ Sin fetch/pull remoto."
  fi

  if grep -Eq \
      'prisma[[:space:]]+migrate[[:space:]]+(reset|resolve)|DROP[[:space:]]+TABLE|ALTER[[:space:]]+TABLE.*DROP' \
      scripts/rollback-update.sh
  then
    err "rollback-update.sh intenta una reversión SQL genérica"
  else
    say "✓ Sin migración SQL inversa automática."
  fi

  [[ "$ERRORS" -eq 0 ]] || return 1

  backup="$(latest_backup)"

  [[ -n "$backup" && -s "$backup" ]] || {
    err "No existe un backup completo para validar el precheck"
    return 1
  }

  [[ -s "$backup.sha256" ]] || {
    err "El backup seleccionado no tiene checksum"
    return 1
  }

  [[ -s "$backup.meta" ]] || {
    err "El backup seleccionado no tiene metadatos"
    return 1
  }

  TEMP_DIR="$(
    mktemp -d /tmp/bloodkeeper-spec046-rollback-check.XXXXXX
  )" || {
    err "No se pudo crear temporal"
    return 1
  }

  plan="$TEMP_DIR/update_plan_synthetic.txt"
  head="$(git rev-parse HEAD)"
  parent="$(git rev-parse HEAD^)"

  {
    echo "format=bloodkeeper_update_preparation_v1"
    echo "created_utc=synthetic"
    echo "branch=validation"
    echo "current_head=$parent"
    echo "target_ref=HEAD"
    echo "target_head=$head"
    echo "backup_archive=$backup"
    echo "postgres_image=validation"
    echo "api_image=validation"
    echo "web_image=validation"
    echo
    echo "[changed_files]"
    echo
    echo "[migration_changes]"
    echo
    echo "[infrastructure_changes]"
    echo
    echo "[rollback]"
    echo "Synthetic validation plan."
  } > "$plan"

  chmod 600 "$plan"

  say
  say "== Precheck real no destructivo =="

  ./scripts/rollback-update.sh \
    --check \
    --plan "$plan" || {
      err "rollback-update.sh --check falla"
      return 1
    }

  say
  say "== Errores esperados =="

  if ./scripts/rollback-update.sh \
      --apply \
      --plan "$plan" \
      >/tmp/spec046_c_apply_without_confirm.txt 2>&1
  then
    err "--apply sin --confirm fue aceptado"
    return 1
  else
    say "✓ --apply sin --confirm rechazado."
  fi

  if ./scripts/rollback-update.sh \
      --apply \
      --plan "$plan" \
      --restore-data \
      --confirm \
      >/tmp/spec046_c_restore_without_data_confirm.txt 2>&1
  then
    err "--restore-data sin confirmación adicional fue aceptado"
    return 1
  else
    say "✓ --restore-data sin --confirm-data-restore rechazado."
  fi

  invalid_plan="$TEMP_DIR/invalid_plan.txt"
  printf '%s\n' 'format=invalid' > "$invalid_plan"
  chmod 600 "$invalid_plan"

  if ./scripts/rollback-update.sh \
      --check \
      --plan "$invalid_plan" \
      >/tmp/spec046_c_invalid_plan.txt 2>&1
  then
    err "Un plan inválido fue aceptado"
    return 1
  else
    say "✓ Plan inválido rechazado."
  fi

  say
  say "Errores: $ERRORS"

  if [[ "$ERRORS" -eq 0 ]]; then
    say "SPEC-046-C ROLLBACK WORKFLOW: CORRECTO"
    say "Precheck con backup real: OK."
    say "Apply destructivo: NO ejecutado."
    return 0
  fi

  say "SPEC-046-C ROLLBACK WORKFLOW: REVISAR"
  return 1
}

main "$@"
