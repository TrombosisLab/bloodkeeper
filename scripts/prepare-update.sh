#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/.."
  pwd
)"

MODE="check"
TARGET="HEAD"
OUTPUT_DIR="${BLOODKEEPER_UPDATE_BACKUP_DIR:-$HOME/bloodkeeper_backups/update-preparation}"
CONFIRMED="false"

usage() {
  cat <<'EOF'
Uso:
  ./scripts/prepare-update.sh --check [--target REFERENCIA]
  ./scripts/prepare-update.sh \
    --prepare \
    --target REFERENCIA \
    --confirm
  ./scripts/prepare-update.sh --help

Modos:
  --check    Verifica el estado actual y analiza una referencia Git local.
             No modifica el proyecto.
  --prepare  Crea y verifica una copia completa y genera un plan de
             actualización. No cambia de versión, no construye imágenes,
             no aplica migraciones y no despliega.

Opciones:
  --target REFERENCIA   Commit, tag o rama local que se pretende instalar.
                        Valor predeterminado: HEAD.
  --output-dir RUTA     Destino de la copia y del plan.
  --confirm             Confirmación obligatoria para --prepare.
EOF
}

die() {
  echo "ERROR: $*" >&2
  return 1
}

container_image() {
  local service="$1"
  local container_id=""

  container_id="$(docker compose ps -q "$service")"

  if [ -z "$container_id" ]; then
    printf 'sin-contenedor\n'
    return 0
  fi

  docker inspect \
    --format='{{.Config.Image}}|{{.Image}}' \
    "$container_id"
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --check)
      MODE="check"
      shift
      ;;
    --prepare)
      MODE="prepare"
      shift
      ;;
    --target)
      test "$#" -ge 2 ||
        die "Falta la referencia objetivo."

      TARGET="$2"
      shift 2
      ;;
    --output-dir)
      test "$#" -ge 2 ||
        die "Falta la ruta de destino."

      OUTPUT_DIR="$2"
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

cd "$ROOT"

docker compose config --quiet

if [ "$MODE" = "prepare" ]; then
  test -z "$(git status --porcelain)" ||
    die "El working tree debe estar limpio antes de preparar una actualización."
fi

git rev-parse \
  --verify \
  "${TARGET}^{commit}" \
  >/dev/null 2>&1 ||
  die "La referencia objetivo no existe localmente: $TARGET"

current_branch="$(git branch --show-current)"
current_head="$(git rev-parse HEAD)"
target_head="$(git rev-parse "${TARGET}^{commit}")"

current_ref="${current_branch:-DETACHED:$current_head}"

./scripts/check.sh >/dev/null

echo "============================================================"
echo "BLOODKEEPER — PREPARACIÓN DE ACTUALIZACIÓN"
echo "============================================================"
echo "Referencia actual: $current_ref"
echo "Versión actual: $current_head"
echo "Objetivo: $TARGET"
echo "Commit objetivo: $target_head"
echo

echo "== Cambios previstos =="

changed_files="$(
  git diff \
    --name-only \
    "$current_head..$target_head"
)"

if [ -n "$changed_files" ]; then
  printf '%s\n' "$changed_files"
else
  echo "Sin diferencias respecto a la versión actual."
fi

migration_changes="$(
  printf '%s\n' "$changed_files" |
    grep -E '^apps/api/prisma/migrations/' || true
)"

infrastructure_changes="$(
  printf '%s\n' "$changed_files" |
    grep -E \
      '(^compose\.yaml$|Dockerfile$|\.dockerignore$|^scripts/bootstrap-server\.sh$)' ||
    true
)"

echo
echo "== Evaluación de riesgo =="

if [ -n "$migration_changes" ]; then
  echo "AVISO: la actualización contiene migraciones Prisma."
  printf '%s\n' "$migration_changes"
else
  echo "✓ No se detectan migraciones entre ambas referencias."
fi

if [ -n "$infrastructure_changes" ]; then
  echo "AVISO: la actualización contiene cambios de infraestructura."
  printf '%s\n' "$infrastructure_changes"
  echo "Debe valorarse un snapshot de VirtualBox desde el equipo anfitrión."
else
  echo "✓ No se detectan cambios de infraestructura de alto riesgo."
fi

echo
echo "== Recursos actuales =="
df -hT "$ROOT"
docker system df

echo
echo "== Reversión prevista =="
echo "1. Conservar esta rama y el commit actual: $current_head"
echo "2. Conservar la copia completa verificada."
echo "3. Ante fallo, volver al commit anterior y reconstruir las imágenes."
echo "4. Restaurar el dump con restore.sh únicamente cuando sea necesario."
echo "5. Para cambios de infraestructura, usar también el snapshot de VirtualBox."
echo

if [ "$MODE" = "check" ]; then
  echo "PRECOMPROBACIÓN DE ACTUALIZACIÓN CORRECTA"
  exit 0
fi

test "$CONFIRMED" = "true" ||
  die "--prepare requiere --confirm."

mkdir -p "$OUTPUT_DIR"
chmod 700 "$OUTPUT_DIR" 2>/dev/null || true
umask 077

echo "Creando copia completa previa..."

archive="$(
  ./scripts/backup-full.sh \
    --output-dir "$OUTPUT_DIR" \
    --keep 7 \
    --quiet |
  tail -n 1
)"

test -s "$archive" ||
  die "No se creó la copia completa."

test -s "$archive.sha256" ||
  die "Falta el checksum de la copia completa."

test -s "$archive.meta" ||
  die "Faltan los metadatos de la copia completa."

./scripts/restore-full.sh \
  --verify "$archive"

stamp="$(date -u +%Y%m%dT%H%M%SZ)"
plan="$OUTPUT_DIR/update_plan_${stamp}.txt"

{
  echo "format=bloodkeeper_update_preparation_v1"
  echo "created_utc=$stamp"
  echo "branch=${current_branch:-DETACHED}"
  echo "current_ref=$current_ref"
  echo "current_head=$current_head"
  echo "target_ref=$TARGET"
  echo "target_head=$target_head"
  echo "backup_archive=$archive"
  echo "postgres_image=$(container_image postgres)"
  echo "api_image=$(container_image api)"
  echo "web_image=$(container_image web)"
  echo
  echo "[changed_files]"
  printf '%s\n' "$changed_files"
  echo
  echo "[migration_changes]"
  printf '%s\n' "$migration_changes"
  echo
  echo "[infrastructure_changes]"
  printf '%s\n' "$infrastructure_changes"
  echo
  echo "[rollback]"
  echo "Return to commit $current_head."
  echo "Rebuild and start the previous Docker version."
  echo "Verify services with ./scripts/check.sh."
  echo "Restore $archive only if data recovery is required."
} > "$plan"

chmod 600 "$plan"

echo
echo "✓ Copia completa creada y verificada"
echo "✓ Plan de actualización generado: $plan"
echo "✓ La versión instalada no se ha modificado"
echo "ACTUALIZACIÓN PREPARADA CORRECTAMENTE"
