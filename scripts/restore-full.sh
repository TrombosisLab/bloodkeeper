#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/.."
  pwd
)"

MODE=""
ARCHIVE=""
TARGET_DIR=""
CONFIRMED="false"
TEMP_DIR=""
AUDIT_ACTION=""
AUDIT_STARTED="false"
AUDIT_SUCCESS="false"

usage() {
  cat <<'EOF'
Uso:
  ./scripts/restore-full.sh --verify ARCHIVO.tar.gz
  ./scripts/restore-full.sh \
    --extract ARCHIVO.tar.gz \
    --target-dir RUTA \
    --confirm

Modos:
  --verify   Verifica el paquete completo y restaura el dump en una
             base temporal. No modifica la base activa.
  --extract  Reconstruye repositorio, configuración y artefactos de
             recuperación en una ruta nueva. No despliega ni sustituye
             automáticamente la base activa.
EOF
}

die() {
  echo "ERROR: $*" >&2
  return 1
}

audit() {
  local line
  line="AUDIT action=$1 outcome=$2 channel=$3"
  printf '%s\n' "$line"
  if command -v logger >/dev/null 2>&1; then
    logger -t bloodkeeper-audit -- "$line" 2>/dev/null || true
  fi
}

cleanup() {
  local code="$?"

  if [ -n "$TEMP_DIR" ] && [ -d "$TEMP_DIR" ]; then
    rm -rf "$TEMP_DIR"
  fi

  if [ "$AUDIT_STARTED" = "true" ] &&
     [ "$AUDIT_SUCCESS" != "true" ] &&
     [ "$code" -ne 0 ]; then
    audit "$AUDIT_ACTION" "failure" "ssh"
  fi

  return "$code"
}

trap cleanup EXIT

while [ "$#" -gt 0 ]; do
  case "$1" in
    --verify)
      MODE="verify"
      test "$#" -ge 2 ||
        die "Falta el paquete completo."

      ARCHIVE="$2"
      shift 2
      ;;
    --extract)
      MODE="extract"
      test "$#" -ge 2 ||
        die "Falta el paquete completo."

      ARCHIVE="$2"
      shift 2
      ;;
    --target-dir)
      test "$#" -ge 2 ||
        die "Falta la ruta de recuperación."

      TARGET_DIR="$2"
      shift 2
      ;;
    --confirm)
      CONFIRMED="true"
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      usage
      die "Argumento no reconocido: $1"
      ;;
  esac
done

test -n "$MODE" ||
  die "Selecciona --verify o --extract."

test -f "$ARCHIVE" ||
  die "No existe el paquete: $ARCHIVE"

ARCHIVE="$(
  cd "$(dirname "$ARCHIVE")"
  printf '%s/%s\n' "$PWD" "$(basename "$ARCHIVE")"
)"

checksum="$ARCHIVE.sha256"

if [ -f "$checksum" ]; then
  (
    cd "$(dirname "$ARCHIVE")"
    sha256sum -c "$(basename "$checksum")"
  )
else
  echo "AVISO: no existe checksum externo."
fi

tar -tzf "$ARCHIVE" \
  >/dev/null

TEMP_DIR="$(
  mktemp -d /tmp/bloodkeeper-full-restore.XXXXXX
)"

tar \
  --extract \
  --gzip \
  --file "$ARCHIVE" \
  --directory "$TEMP_DIR"

for file in \
  MANIFEST.env \
  SHA256SUMS \
  configuration/.env \
  configuration/apps/api/Dockerfile \
  configuration/apps/api/.dockerignore \
  configuration/apps/web/Dockerfile \
  configuration/apps/web/.dockerignore \
  repository/repository.bundle \
  repository/working-tree.tar.gz \
  volume/postgres-data.tar.gz
do
  test -s "$TEMP_DIR/$file" ||
    die "Falta $file dentro del paquete."
done

(
  cd "$TEMP_DIR"
  sha256sum -c SHA256SUMS
)

git bundle verify \
  "$TEMP_DIR/repository/repository.bundle" \
  >/dev/null

tar -tzf \
  "$TEMP_DIR/repository/working-tree.tar.gz" \
  >/dev/null

tar -tzf \
  "$TEMP_DIR/volume/postgres-data.tar.gz" \
  >/dev/null

database_archive="$(
  find "$TEMP_DIR/database" \
    -maxdepth 1 \
    -type f \
    -name '*.dump' \
    -print \
    -quit
)"

test -n "$database_archive"
test -s "$database_archive"
test -s "$database_archive.sha256"
test -s "$database_archive.meta"

case "$MODE" in
  verify)
    cd "$ROOT"
    "$ROOT/scripts/restore.sh" \
      --verify "$database_archive"

    echo "✓ Paquete completo íntegro"
    echo "✓ Repositorio Git verificable"
    echo "✓ Árbol de trabajo y volumen legibles"
    echo "✓ Dump restaurado en base temporal"
    echo "BACKUP COMPLETO SPEC-007 VERIFICADO"
    ;;

  extract)
    test "$CONFIRMED" = "true" ||
      die "--extract requiere --confirm."

    test -n "$TARGET_DIR" ||
      die "--extract requiere --target-dir."

    test ! -e "$TARGET_DIR" ||
      die "La ruta ya existe: $TARGET_DIR"

    AUDIT_ACTION="restore-full.extract"
    AUDIT_STARTED="true"
    audit "$AUDIT_ACTION" "start" "ssh"

    git clone \
      "$TEMP_DIR/repository/repository.bundle" \
      "$TARGET_DIR"

    tar \
      --extract \
      --gzip \
      --file "$TEMP_DIR/repository/working-tree.tar.gz" \
      --directory "$TARGET_DIR"

    cp -a \
      "$TEMP_DIR/configuration/.env" \
      "$TARGET_DIR/.env"

    chmod 600 "$TARGET_DIR/.env"

    recovery_dir="$TARGET_DIR/backups/full-recovery"
    mkdir -p "$recovery_dir"

    cp -a \
      "$database_archive" \
      "$database_archive.sha256" \
      "$database_archive.meta" \
      "$TEMP_DIR/volume/postgres-data.tar.gz" \
      "$TEMP_DIR/repository/repository.bundle" \
      "$TEMP_DIR/MANIFEST.env" \
      "$TEMP_DIR/SHA256SUMS" \
      "$recovery_dir/"

    chmod 600 "$recovery_dir"/*

    echo "✓ Repositorio y árbol de trabajo reconstruidos"
    echo "✓ .env recuperado con permisos 600"
    echo "✓ Dump, volumen y manifiestos conservados"
    echo "Ruta: $TARGET_DIR"
    echo
    echo "Siguiente procedimiento documentado:"
    echo "  cd $TARGET_DIR"
    echo "  ./scripts/bootstrap-server.sh"
    echo "  ./scripts/restore.sh --verify backups/full-recovery/$(basename "$database_archive")"
    echo "  ./scripts/restore.sh --apply backups/full-recovery/$(basename "$database_archive") --confirm"

    audit "$AUDIT_ACTION" "success" "ssh"
    AUDIT_SUCCESS="true"
    ;;
esac
