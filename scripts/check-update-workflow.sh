#!/usr/bin/env bash

ROOT="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/.."
  pwd
)"

ERRORS=0

say(){ printf '%s\n' "$*"; }
err(){ ERRORS=$((ERRORS+1)); printf 'ERROR: %s\n' "$*" >&2; }

require_file(){
  [[ -f "$1" ]] || err "Falta $1"
}

require_exec(){
  [[ -x "$1" ]] || err "No es ejecutable: $1"
}

require_text(){
  grep -Fq "$2" "$1" || err "$1 no contiene: $2"
}

main(){
  cd "$ROOT" || {
    err "No se puede acceder al repositorio"
    return 1
  }

  say "============================================================"
  say "SPEC-046-B — VALIDACIÓN DEL FLUJO DE UPDATE"
  say "============================================================"

  require_file scripts/apply-update.sh
  require_file scripts/prepare-update.sh
  require_file scripts/backup-full.sh
  require_file scripts/restore-full.sh
  require_file scripts/check.sh
  require_file docs/MAINTENANCE_OPERATIONS.md
  require_file docs/DEPLOYMENT.md

  require_exec scripts/apply-update.sh
  require_exec scripts/prepare-update.sh
  require_exec scripts/backup-full.sh
  require_exec scripts/restore-full.sh
  require_exec scripts/check.sh

  bash -n \
    scripts/apply-update.sh \
    scripts/prepare-update.sh || err "Sintaxis shell incorrecta"

  require_text scripts/apply-update.sh './scripts/check.sh'
  require_text scripts/apply-update.sh './scripts/prepare-update.sh'
  require_text scripts/apply-update.sh 'git checkout --detach'
  require_text scripts/apply-update.sh 'docker compose build api web'
  require_text scripts/apply-update.sh 'docker compose up -d postgres'
  require_text scripts/apply-update.sh 'npx prisma migrate deploy'
  require_text scripts/apply-update.sh 'docker compose up -d api web'
  require_text scripts/apply-update.sh 'wait_service api'
  require_text scripts/apply-update.sh 'wait_service web'
  require_text scripts/apply-update.sh 'working tree debe estar limpio'
  require_text scripts/apply-update.sh 'No se restaura la base automáticamente'
  require_text scripts/apply-update.sh './scripts/rollback-update.sh --check --plan'
  require_text scripts/apply-update.sh './scripts/rollback-update.sh --apply --plan'

  require_text scripts/prepare-update.sh 'current_ref='
  require_text scripts/prepare-update.sh 'backup_archive='
  require_text scripts/prepare-update.sh 'target_head='
  require_text scripts/prepare-update.sh './scripts/restore-full.sh'

  if grep -Eq \
      '^[[:space:]]*git[[:space:]]+(fetch|pull)([[:space:]]|$)|^[[:space:]]*docker[[:space:]]+pull([[:space:]]|$)' \
      scripts/apply-update.sh
  then
    err "apply-update.sh contiene un comando ejecutable de consulta remota"
  else
    say "✓ Sin comandos ejecutables fetch/pull remoto."
  fi

  if grep -Eq \
      'restore\.sh[[:space:]].*--apply|restore-full\.sh[[:space:]].*--apply' \
      scripts/apply-update.sh
  then
    err "046-B no debe restaurar datos automáticamente"
  else
    say "✓ Sin restore automático."
  fi

  [[ "$ERRORS" -eq 0 ]] || return 1

  say
  say "== Precheck real no destructivo =="

  ./scripts/apply-update.sh \
    --check \
    --target HEAD || {
      err "apply-update.sh --check falla"
      return 1
    }

  say
  say "== Compose y estado operativo =="

  docker compose config --quiet || {
    err "Docker Compose no valida"
    return 1
  }

  ./scripts/check.sh || {
    err "Smoke actual falla"
    return 1
  }

  say
  say "Errores: $ERRORS"

  if [[ "$ERRORS" -eq 0 ]]; then
    say "SPEC-046-B UPDATE WORKFLOW: CORRECTO"
    say "El modo --apply existe y es operativo, pero no se ejecuta sobre"
    say "el árbol dirty de implementación."
    return 0
  fi

  say "SPEC-046-B UPDATE WORKFLOW: REVISAR"
  return 1
}

main "$@"
