#!/usr/bin/env bash

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

fail() {
  echo "ERROR: $*" >&2
  return 1
}

require_text() {
  local text="$1"
  local file="$2"
  local label="$3"

  grep -Fq -- "$text" "$file" || fail "Falta el contrato: $label"
}

main() {
  local file token

  cd "$ROOT" || return 1

  echo "== Archivos oficiales SPEC-010.A =="
  for file in \
    docs/UI_DESIGN_SYSTEM.md \
    apps/web/src/styles.css \
    apps/web/src/styles/design-system.css \
    apps/web/tests/ui-design-system-foundations-contract.test.mjs
  do
    [ -f "$file" ] || return 1
    echo "✓ $file"
  done

  require_text "SPEC-010.A" docs/UI_DESIGN_SYSTEM.md "identificación" || return 1
  require_text "SPEC-014" docs/UI_DESIGN_SYSTEM.md "límite de componentes" || return 1
  require_text "revisión visual manual" docs/UI_DESIGN_SYSTEM.md "validación visual" || return 1

  [ "$(sed -n '1p' apps/web/src/styles.css)" = \
    "@import './styles/design-system.css';" ] || \
    return 1

  for token in \
    --color-canvas \
    --color-surface \
    --color-text-primary \
    --color-border-default \
    --color-accent \
    --color-focus \
    --color-success \
    --color-warning \
    --color-danger \
    --font-family-body \
    --space-1 \
    --radius-md
  do
    require_text "$token:" apps/web/src/styles/design-system.css "$token" || return 1
  done

  require_text "var(--color-canvas)" apps/web/src/styles/base-and-sheet-header.css "adopción canvas" || return 1
  require_text "var(--color-focus)" apps/web/src/styles/base-and-sheet-header.css "adopción foco" || return 1
  require_text ":focus-visible" apps/web/src/styles/design-system.css "foco visible" || return 1
  require_text "prefers-reduced-motion" apps/web/src/styles/design-system.css "movimiento reducido" || return 1

  if grep -Eq '\.ui-(button|field|card|table|dialog|navigation|alert|badge)' \
    apps/web/src/styles/design-system.css
  then
    fail "SPEC-010.A contiene primitivas reservadas para SPEC-014" || return 1
  fi

  echo "✓ Tokens y adopción inicial"
  echo "✓ Accesibilidad base"
  echo "✓ Sin adelantar SPEC-014"

  echo
  echo "== Validación técnica dentro de web =="
  docker compose exec -T web \
    node --experimental-strip-types --test \
    tests/ui-design-system-foundations-contract.test.mjs \
    </dev/null || return 1

  docker compose exec -T web npm run typecheck </dev/null || return 1
  docker compose exec -T web npm test </dev/null || return 1
  docker compose exec -T web npm run build </dev/null || return 1

  echo
  echo "VALIDACIÓN TÉCNICA SPEC-010.A CORRECTA"
  echo "PENDIENTE: revisión visual manual antes del cierre"
  return 0
}

main
