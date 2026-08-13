#!/usr/bin/env bash

ROOT="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/../.."
  pwd
)"

MODE="version"
TAG_VALUE=""
ERRORS=0

say(){ printf '%s\n' "$*"; }
err(){ ERRORS=$((ERRORS+1)); printf 'ERROR: %s\n' "$*" >&2; }

usage(){
  cat <<'HELP'
Uso:
  ./scripts/dev/release-check.sh
  ./scripts/dev/release-check.sh --version-only
  ./scripts/dev/release-check.sh --candidate vMAJOR.MINOR.PATCH
  ./scripts/dev/release-check.sh --tag vMAJOR.MINOR.PATCH

--version-only valida las versiones sincronizadas.
--candidate valida una etiqueta propuesta sin crearla.
--tag valida además que la etiqueta exista y apunte a HEAD.
HELP
}

read_version(){
  python3 - "$1" <<'PY'
import json
import sys
from pathlib import Path

data = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
value = data.get("version")
if not isinstance(value, str) or not value:
    raise SystemExit(1)
print(value)
PY
}

parse_args(){
  while [[ "$#" -gt 0 ]]; do
    case "$1" in
      --version-only)
        MODE="version"
        shift
        ;;
      --candidate)
        [[ "$#" -ge 2 ]] || {
          err "Falta etiqueta candidata."
          return 1
        }
        MODE="candidate"
        TAG_VALUE="$2"
        shift 2
        ;;
      --tag)
        [[ "$#" -ge 2 ]] || {
          err "Falta etiqueta Git."
          return 1
        }
        MODE="tag"
        TAG_VALUE="$2"
        shift 2
        ;;
      --help|-h)
        usage
        return 2
        ;;
      *)
        err "Argumento no reconocido: $1"
        return 1
        ;;
    esac
  done
  return 0
}

main(){
  cd "$ROOT" || {
    err "No se puede acceder al repositorio."
    return 1
  }

  parse_args "$@"
  parse_rc="$?"

  [[ "$parse_rc" -eq 2 ]] && return 0
  [[ "$parse_rc" -eq 0 ]] || return 1

  say "==============================================="
  say "RELEASE VERSION CHECK"
  say "==============================================="

  api_version="$(read_version apps/api/package.json)" ||
    err "No se pudo leer versión API."

  web_version="$(read_version apps/web/package.json)" ||
    err "No se pudo leer versión Web."

  rules_version="$(read_version packages/character-rules/package.json)" ||
    err "No se pudo leer versión de reglas."

  say "API:   $api_version"
  say "Web:   $web_version"
  say "Rules: $rules_version"

  [[ "$api_version" == "$web_version" ]] ||
    err "API y Web tienen versiones distintas."

  [[ "$api_version" == "$rules_version" ]] ||
    err "API y reglas tienen versiones distintas."

  [[ "$api_version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] ||
    err "La versión estable debe usar MAJOR.MINOR.PATCH."

  if [[ "$MODE" == "candidate" || "$MODE" == "tag" ]]; then
    expected_tag="v${api_version}"

    [[ "$TAG_VALUE" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]] ||
      err "La etiqueta debe usar vMAJOR.MINOR.PATCH."

    [[ "$TAG_VALUE" == "$expected_tag" ]] ||
      err "La etiqueta $TAG_VALUE no coincide con $expected_tag."

    if [[ "$MODE" == "tag" ]]; then
      git rev-parse --verify "refs/tags/$TAG_VALUE" >/dev/null 2>&1 ||
        err "La etiqueta Git $TAG_VALUE no existe."

      if git rev-parse --verify "refs/tags/$TAG_VALUE" >/dev/null 2>&1; then
        tag_head="$(git rev-list -n 1 "$TAG_VALUE")"
        current_head="$(git rev-parse HEAD)"
        [[ "$tag_head" == "$current_head" ]] ||
          err "La etiqueta $TAG_VALUE no apunta a HEAD."
      fi
    fi
  fi

  if [[ "$ERRORS" -eq 0 ]]; then
    say "RELEASE VERSION CHECK: CORRECTO"
    return 0
  fi

  say "RELEASE VERSION CHECK: REVISAR"
  return 1
}

main "$@"
