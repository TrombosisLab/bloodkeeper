#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/.."
  pwd
)"

printf '%s\n' \
  'ERROR: el consumidor systemd del host está retirado.' \
  'Las solicitudes manuales son procesadas por el servicio Docker backup-worker.' \
  'Comprueba su estado con:' \
  "  $ROOT/scripts/portable-compose.sh ps backup-worker" >&2
exit 2
