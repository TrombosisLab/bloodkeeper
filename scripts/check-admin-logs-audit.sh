#!/usr/bin/env bash

ROOT="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/.."
  pwd
)"

ERRORS=0

fail() {
  printf 'ERROR: %s\n' "$*" >&2
  ERRORS=$((ERRORS + 1))
}

service_block() {
  local service="$1"

  docker compose config 2>/dev/null |
    awk -v svc="$service" '
      $0 == "  " svc ":" {inside=1; print; next}
      inside && /^  [A-Za-z0-9_.-]+:$/ {exit}
      inside && /^[^ ]/ {exit}
      inside {print}
    '
}

require_text() {
  local text="$1"
  local file="$2"
  local label="$3"

  grep -F "$text" "$file" >/dev/null 2>&1 ||
    fail "Falta contrato: $label"
}

main() {
  cd "$ROOT" || {
    fail "No se puede acceder al repositorio."
    return 1
  }

  printf '%s\n' "== SPEC-043 — logs y auditoría =="

  for file in \
    compose.yaml \
    docs/SYSTEM_MONITORING.md \
    scripts/logs.sh \
    apps/api/src/administration/audit-log.ts \
    apps/api/src/administration/backup-request.controller.ts \
    apps/api/src/users/presentation/user-administration.controller.ts \
    scripts/run-manual-backup-request.sh \
    scripts/restore.sh \
    scripts/restore-full.sh \
    scripts/stop.sh \
    scripts/restart.sh
  do
    test -f "$file" ||
      fail "Falta $file."
  done

  docker compose config --quiet ||
    fail "Docker Compose no valida."

  for service in api web postgres; do
    block="$(service_block "$service")"

    printf '%s\n' "$block" |
      grep -F 'driver: json-file' >/dev/null 2>&1 ||
      fail "$service: driver json-file ausente."

    printf '%s\n' "$block" |
      grep -F 'max-size: 10m' >/dev/null 2>&1 ||
      fail "$service: max-size 10m ausente."

    printf '%s\n' "$block" |
      grep -E 'max-file:[[:space:]]+("?5"?)$' >/dev/null 2>&1 ||
      fail "$service: max-file 5 ausente."
  done

  require_text \
    '## Rotación y retención de logs' \
    docs/SYSTEM_MONITORING.md \
    'rotación técnica'

  require_text \
    '## Auditoría funcional mínima' \
    docs/SYSTEM_MONITORING.md \
    'auditoría funcional'

  require_text \
    'journalctl' \
    docs/SYSTEM_MONITORING.md \
    'consulta journald'

  ./scripts/logs.sh all --lines 2 >/dev/null 2>&1 ||
    fail "scripts/logs.sh no puede consultar logs."

  command -v logger >/dev/null 2>&1 ||
    fail "No existe logger en el host."

  for action in \
    user.admin.create \
    user.admin.update \
    user.admin.roles.update \
    user.admin.credentials.reset
  do
    require_text \
      "$action" \
      apps/api/src/users/presentation/user-administration.controller.ts \
      "$action"
  done

  require_text \
    'backup.manual.request' \
    apps/api/src/administration/backup-request.controller.ts \
    'backup.manual.request'

  for action_file in \
    'backup.manual.execute:scripts/run-manual-backup-request.sh' \
    'restore.apply:scripts/restore.sh' \
    'restore-full.extract:scripts/restore-full.sh' \
    'maintenance.stop:scripts/stop.sh' \
    'maintenance.restart:scripts/restart.sh'
  do
    action="${action_file%%:*}"
    file="${action_file#*:}"

    require_text \
      "$action" \
      "$file" \
      "$action"

    require_text \
      'bloodkeeper-audit' \
      "$file" \
      "$file usa journald"
  done

  for file in \
    scripts/run-manual-backup-request.sh \
    scripts/restore.sh \
    scripts/restore-full.sh \
    scripts/restart.sh
  do
    bash -n "$file" ||
      fail "Sintaxis Bash inválida: $file"
  done

  sh -n scripts/stop.sh ||
    fail "Sintaxis sh inválida: scripts/stop.sh"

  if grep -Ei \
    'password(Hash)?|token|cookie|secret|username|displayName' \
    apps/api/src/administration/audit-log.ts >/dev/null 2>&1
  then
    fail "audit-log.ts contiene campos funcionales o secretos no permitidos."
  fi

  if grep -Ei \
    '(event\.|readonly[[:space:]]+)(roles|role)([^A-Za-z0-9_.]|$)' \
    apps/api/src/administration/audit-log.ts >/dev/null 2>&1
  then
    fail "audit-log.ts registra roles como dato y no sólo como nombre de acción."
  fi

  if grep -E \
    'AUDIT.*(\$ARCHIVE|\$TARGET_DIR|\$OUTPUT|\$REQUEST|password|token|cookie|secret)' \
    scripts/run-manual-backup-request.sh \
    scripts/restore.sh \
    scripts/restore-full.sh \
    scripts/stop.sh \
    scripts/restart.sh >/dev/null 2>&1
  then
    fail "Una línea AUDIT del host contiene datos no permitidos."
  fi

  if grep -F '/var/run/docker.sock' compose.yaml >/dev/null 2>&1; then
    fail "Compose expone Docker socket."
  fi

  if grep -Ei \
    '^model[[:space:]]+.*(Audit|TechnicalLog|AuditLog)' \
    apps/api/prisma/schema.prisma >/dev/null 2>&1
  then
    fail "SPEC-043 añadió persistencia Prisma de auditoría."
  fi

  for service in api web postgres; do
    cid="$(docker compose ps -q "$service" 2>/dev/null)"

    if [[ -z "$cid" ]]; then
      fail "$service no tiene contenedor."
      continue
    fi

    runtime="$(
      docker inspect \
        --format '{{json .HostConfig.LogConfig}}' \
        "$cid" 2>/dev/null
    )"

    printf '%s\n' "$runtime" |
      grep -F '"Type":"json-file"' >/dev/null 2>&1 ||
      fail "$service no usa json-file en runtime."

    printf '%s\n' "$runtime" |
      grep -F '"max-size":"10m"' >/dev/null 2>&1 ||
      fail "$service no aplica max-size=10m."

    printf '%s\n' "$runtime" |
      grep -F '"max-file":"5"' >/dev/null 2>&1 ||
      fail "$service no aplica max-file=5."
  done

  printf '%s\n' "Errores: $ERRORS"

  if [[ "$ERRORS" -eq 0 ]]; then
    printf '%s\n' "SPEC-043 LOGS Y AUDITORÍA: CORRECTO"
    return 0
  fi

  return 1
}

main
