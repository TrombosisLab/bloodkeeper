#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/../.."
  pwd
)"

check_lint() {
  cd "$ROOT"

  echo "==============================================="
  echo "LINT CHECK"
  echo "==============================================="

  bash -n scripts/*.sh
  bash -n scripts/dev/*.sh
  echo "✓ Sintaxis shell"

  conflicts="$(
    git grep -nI -E \
      '^(<<<<<<< .+|=======$|>>>>>>> .+)$' \
      -- \
      'apps/*/src/**' \
      'packages/**' \
      'scripts/**' \
      2>/dev/null ||
    true
  )"

  if test -n "$conflicts"; then
    printf '%s\n' "$conflicts"
    echo "ERROR: marcadores Git de conflicto detectados." >&2
    return 1
  fi

  echo "✓ Sin marcadores Git de conflicto"

  debugger="$(
    git grep -nI -E \
      '(^|[^[:alnum:]_])debugger[[:space:]]*;' \
      -- \
      'apps/*/src/**' \
      'packages/**' \
      2>/dev/null ||
    true
  )"

  if test -n "$debugger"; then
    printf '%s\n' "$debugger"
    echo "ERROR: debugger detectado en producción." >&2
    return 1
  fi

  echo "✓ Sin debugger"

  suppressions="$(
    git grep -nI -E \
      '@ts-(ignore|nocheck)' \
      -- \
      'apps/*/src/**' \
      'packages/**' \
      2>/dev/null ||
    true
  )"

  if test -n "$suppressions"; then
    printf '%s\n' "$suppressions"
    echo "ERROR: supresión TypeScript no controlada." >&2
    return 1
  fi

  echo "✓ Sin @ts-ignore/@ts-nocheck"
  echo "LINT CHECK: CORRECTO"
}

check_lint
