#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DESTINATION="${BLOODKEEPER_HOST_BACKUP_DIR:-}"
KEEP="${BLOODKEEPER_HOST_BACKUP_KEEP:-30}"
OWNER="${BLOODKEEPER_HOST_BACKUP_OWNER:-}"
if [[ -z "$OWNER" && -n "${SUDO_UID:-}" && -n "${SUDO_GID:-}" ]]; then OWNER="$SUDO_UID:$SUDO_GID"; fi
REQUIRE_MOUNT=false

usage() {
  cat <<'EOF'
Uso:
  ./scripts/export-portable-backups.sh [--destination RUTA] [--keep NUMERO] [--owner UID:GID] [--require-mounted]

Exporta al anfitrión las copias portables ya terminadas en Docker, valida
checksum y contenido y conserva los NUMERO conjuntos más recientes.
Use --keep 0 para no eliminar copias antiguas.
Si no indicas destino en una terminal, el script te preguntará la carpeta.
Al ejecutarlo con sudo, la copia quedará accesible para el usuario que llamó a sudo.
EOF
}

die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

while (($#)); do
  case "$1" in
    --destination)
      (($# >= 2)) || die 'falta la ruta de destino.'
      DESTINATION=$2; shift 2 ;;
    --keep)
      (($# >= 2)) || die 'falta el número de copias a conservar.'
      KEEP=$2; shift 2 ;;
    --owner)
      (($# >= 2)) || die 'falta UID:GID para el propietario de los archivos.'
      OWNER=$2; shift 2 ;;
    --require-mounted) REQUIRE_MOUNT=true; shift ;;
    --help|-h) usage; exit 0 ;;
    *) usage; die "opción no reconocida: $1" ;;
  esac
done

[[ "$KEEP" =~ ^[0-9]+$ ]] || die '--keep debe ser un entero no negativo.'
KEEP=$((10#$KEEP))
if [[ -z "$DESTINATION" ]]; then
  default_destination="$ROOT/backups/host/portable"
  if [[ -n "${SUDO_UID:-}" ]]; then
    caller_home="$(getent passwd "$SUDO_UID" | cut -d: -f6)"
    [[ -n "$caller_home" ]] && default_destination="$caller_home/bloodkeeper-backups"
  fi
  if [[ -t 0 ]]; then
    read -r -p "Carpeta anfitriona para las copias [$default_destination]: " selected_destination
    DESTINATION="${selected_destination:-$default_destination}"
  else
    die 'indica --destination o BLOODKEEPER_HOST_BACKUP_DIR cuando no haya una terminal interactiva.'
  fi
fi
[[ -z "$OWNER" || "$OWNER" =~ ^[0-9]+:[0-9]+$ ]] || die '--owner debe tener el formato UID:GID numérico.'
if [[ "$DESTINATION" != /* ]]; then DESTINATION="$ROOT/$DESTINATION"; fi
[[ "$DESTINATION" != / ]] || die 'no se permite usar / como destino.'
command -v docker >/dev/null || die 'Docker no está instalado o no está disponible.'
command -v python3 >/dev/null || die 'se necesita Python 3 para leer el estado de la copia.'

if [[ "$REQUIRE_MOUNT" == true ]]; then
  command -v findmnt >/dev/null || die 'se necesita findmnt para comprobar el disco externo.'
  probe="$DESTINATION"
  while [[ ! -e "$probe" ]]; do
    parent="$(dirname "$probe")"
    [[ "$parent" != "$probe" ]] || die 'no se pudo resolver el punto de montaje.'
    probe="$parent"
  done
  mount_root="$(findmnt --noheadings --output TARGET --target "$probe" | head -n 1 | xargs)"
  [[ -n "$mount_root" && "$mount_root" != / ]] || die 'el destino no está en un disco montado distinto del sistema; no se exportó nada.'
fi

mkdir -p -- "$DESTINATION"
[[ -d "$DESTINATION" && ! -L "$DESTINATION" ]] || die 'el destino debe ser una carpeta real, no un enlace simbólico.'
chmod 700 -- "$DESTINATION" 2>/dev/null || true
if [[ -n "$OWNER" ]]; then chown -- "$OWNER" "$DESTINATION" || die "no se pudo asignar el destino a $OWNER."; fi
stage="$(mktemp -d "$DESTINATION/.bloodkeeper-export.XXXXXX")"
cleanup() { rm -rf -- "$stage"; }
trap cleanup EXIT

"$ROOT/scripts/portable-compose.sh" cp backup-worker:/backups/. "$stage/"

backup_status="$("$ROOT/scripts/portable-compose.sh" exec -T backup-worker cat /status/backup-status.json)" || die 'no se pudo leer el estado del trabajador de copias.'
latest_archive="$(printf '%s' "$backup_status" | python3 -c 'import datetime,json,re,sys; s=json.load(sys.stdin); n=s.get("archiveName"); ok=s.get("status")=="ok" and s.get("integrity")=="ok" and s.get("lastSuccessfulBackupAt","").startswith(datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d")) and isinstance(n,str) and re.fullmatch(r"bloodkeeper_full_\d{8}T\d{6}Z\.tar\.gz",n); print(n if ok else "")')"
[[ -n "$latest_archive" ]] || die 'no hay una copia correcta de hoy; no se exportaron ni rotaron archivos.'

shopt -s nullglob
archives=("$stage"/bloodkeeper_full_*.tar.gz)
((${#archives[@]} > 0)) || die 'Docker no contiene copias portables para exportar.'
[[ -f "$stage/$latest_archive" ]] || die 'el estado anuncia una copia que no aparece en el volumen; no se exportó nada.'

for archive in "${archives[@]}"; do
  name="$(basename "$archive")"
  [[ "$name" =~ ^bloodkeeper_full_[0-9]{8}T[0-9]{6}Z\.tar\.gz$ ]] || die "nombre de copia no reconocido: $name."
  [[ -s "$archive.sha256" && -s "$archive.meta" ]] || die "faltan metadatos de $name."
  checksum_line="$(cat "$archive.sha256")"
  [[ "$(wc -l < "$archive.sha256")" -eq 1 && "$checksum_line" =~ ^[0-9a-f]{64}[[:space:]][[:space:]]${name}$ ]] || die "formato de checksum no válido: $name."
  (cd "$stage" && sha256sum -c "$name.sha256") || die "checksum incorrecto: $name."
  manifest="$(tar -xOzf "$archive" ./MANIFEST.env 2>/dev/null)" || die "paquete ilegible: $name."
  grep -qx 'format=bloodkeeper_portable_database_v1' <<<"$manifest" || die "formato no reconocido: $name."
  dump_sha="$(tar -xOzf "$archive" ./SHA256SUMS 2>/dev/null)" || die "falta el checksum interno: $name."
  [[ "$dump_sha" =~ ^[0-9a-f]{64}[[:space:]][[:space:]]database\.dump$ ]] || die "formato de checksum interno no válido: $name."
  dump="${stage}/database.dump"
  tar -xOzf "$archive" ./database.dump > "$dump" || die "falta database.dump: $name."
  (cd "$stage" && printf '%s\n' "$dump_sha" | sha256sum -c -) || die "checksum interno incorrecto: $name."
  rm -f -- "$dump"
done

for archive in "${archives[@]}"; do
  name="$(basename "$archive")"
  existing="$DESTINATION/$name"
  if [[ -e "$existing" ]]; then
    [[ -f "$existing" ]] || die "el destino ya existe y no es un archivo: $existing"
    staged_hash="$(sha256sum "$archive" | cut -d ' ' -f 1)"
    existing_hash="$(sha256sum "$existing" | cut -d ' ' -f 1)"
    [[ "$staged_hash" == "$existing_hash" ]] || die "la copia existente difiere; no se sobrescribió: $existing"
    rm -f -- "$archive"
  else
    mv -- "$archive" "$existing"
    chmod 600 -- "$existing"
  fi
  for suffix in .sha256 .meta; do
    source="$stage/$name$suffix"
    target="$DESTINATION/$name$suffix"
    if [[ -f "$source" ]]; then
      mv -f -- "$source" "$target"
      chmod 600 -- "$target"
    fi
  done
  printf '✓ Copia exportada y verificada: %s\n' "$existing"
done

if ((KEEP > 0)); then
  mapfile -t ordered < <(printf '%s\n' "$DESTINATION"/bloodkeeper_full_*.tar.gz | sort -r)
  for ((i=KEEP; i<${#ordered[@]}; i++)); do
    old="${ordered[$i]}"
    [[ -f "$old" && ! -L "$old" ]] || continue
    printf 'Retirando copia antigua por retención (%s): %s\n' "$KEEP" "$(basename "$old")"
    rm -f -- "$old" "$old.sha256" "$old.meta"
  done
fi

if [[ -n "$OWNER" ]]; then
  for item in "$DESTINATION"/bloodkeeper_full_*; do
    [[ -e "$item" ]] || continue
    [[ -f "$item" && ! -L "$item" ]] || die "elemento de exportación inesperado: $item"
    chmod 600 -- "$item"
    chown -- "$OWNER" "$item" || die "no se pudo asignar el archivo a $OWNER: $item"
  done
fi

printf 'Exportación terminada. Destino en el anfitrión: %s\n' "$DESTINATION"
