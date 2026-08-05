#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/.."
  pwd
)"

BACKUP_DIR="${BLOODKEEPER_FULL_BACKUP_DIR:-$HOME/bloodkeeper_backups/scheduled}"
ISSUES=0
WARNINGS=0

mark_issue() {
  ISSUES=$((ISSUES + 1))
  printf 'ERROR: %s\n' "$*"
}

mark_warning() {
  WARNINGS=$((WARNINGS + 1))
  printf 'AVISO: %s\n' "$*"
}

package_version() {
  local file="$1"
  local version=""

  version="$(
    grep -m1 -E '"version"[[:space:]]*:' "$file" |
      sed -E 's/.*"version"[[:space:]]*:[[:space:]]*"([^"]+)".*/\1/'
  )"

  printf '%s\n' "${version:-desconocida}"
}

container_state() {
  local service="$1"
  local container_id=""

  container_id="$(docker compose ps -q "$service" 2>/dev/null || true)"

  if [ -z "$container_id" ]; then
    printf 'detenido\n'
    return 0
  fi

  docker inspect \
    --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' \
    "$container_id" \
    2>/dev/null ||
    printf 'desconocido\n'
}

cd "$ROOT"

echo "============================================================"
echo "BLOODKEEPER — ESTADO DEL SISTEMA"
echo "============================================================"
date --iso-8601=seconds
echo

echo "== Estado general =="

if docker compose config --quiet; then
  echo "✓ Configuración Docker Compose válida"
else
  mark_issue "Docker Compose no es válido."
fi

for service in postgres api web; do
  state="$(container_state "$service")"

  case "$state" in
    healthy|running)
      echo "✓ $service: $state"
      ;;
    *)
      mark_issue "$service: $state"
      ;;
  esac
done

echo
echo "== Aplicación y base de datos =="

api_response="$(
  curl -fsS \
    --max-time 10 \
    http://127.0.0.1:3000/health \
    2>/dev/null || true
)"

if echo "$api_response" |
   grep -q '"status":"ok"' &&
   echo "$api_response" |
   grep -q '"database":"ok"'
then
  echo "✓ API y PostgreSQL: saludables"
else
  mark_issue "La API o PostgreSQL no responden correctamente."
fi

if curl -fsS \
  --max-time 10 \
  http://127.0.0.1:5173 \
  >/dev/null 2>&1
then
  echo "✓ Frontend: accesible"
else
  mark_issue "El frontend no está accesible."
fi

database_info="$(
  docker compose exec -T postgres \
    sh -lc '
      set -eu
      psql \
        -v ON_ERROR_STOP=1 \
        -U "$POSTGRES_USER" \
        -d "$POSTGRES_DB" \
        -Atqc \
        "SELECT current_database(), current_user, pg_size_pretty(pg_database_size(current_database()));"
    ' \
    2>/dev/null || true
)"

if [ -n "$database_info" ]; then
  IFS='|' read -r database_name database_user database_size \
    <<< "$database_info"

  echo "  Base: $database_name"
  echo "  Usuario: $database_user"
  echo "  Tamaño: $database_size"
else
  mark_issue "No se pudo consultar PostgreSQL."
fi

echo
echo "== Contenedores =="

docker compose ps || mark_issue "No se pudo consultar Docker Compose."

echo
echo "== CPU y memoria =="

printf 'CPU lógicas: '
getconf _NPROCESSORS_ONLN

printf 'Carga: '
cut -d' ' -f1-3 /proc/loadavg

free -h

echo
echo "Consumo por contenedor:"

running_names="$(
  docker compose ps \
    --format '{{.Name}}' \
    2>/dev/null || true
)"

if [ -n "$running_names" ]; then
  # shellcheck disable=SC2086
  docker stats \
    --no-stream \
    --format \
    'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.PIDs}}' \
    $running_names ||
    mark_warning "No se pudo obtener el consumo Docker."
else
  mark_issue "No existen contenedores activos."
fi

echo
echo "== Espacio en disco =="

df -hT "$ROOT"
echo
docker system df || mark_warning "No se pudo consultar el uso de Docker."

disk_use="$(
  df -P "$ROOT" |
    awk 'NR == 2 {gsub("%", "", $5); print $5}'
)"

if [ "$disk_use" -ge 95 ]; then
  mark_issue "El disco está al ${disk_use}%."
elif [ "$disk_use" -ge 90 ]; then
  mark_warning "El disco está al ${disk_use}%."
else
  echo "✓ Uso de disco dentro del margen operativo: ${disk_use}%"
fi

echo
echo "== Estado de las copias de seguridad =="

schedule="$(
  crontab -l 2>/dev/null || true
)"

if echo "$schedule" |
   grep -Fq '# BEGIN BLOODKEEPER SPEC-007 FULL BACKUP' &&
   echo "$schedule" |
   grep -Fq 'scripts/backup-full.sh'
then
  echo "✓ Copia completa programada"

  echo "$schedule" |
    sed -n \
      '/^# BEGIN BLOODKEEPER SPEC-007 FULL BACKUP$/,/^# END BLOODKEEPER SPEC-007 FULL BACKUP$/p'
else
  mark_warning "No se localizó la tarea programada de backup."
fi

latest_backup=""

if [ -d "$BACKUP_DIR" ]; then
  latest_backup="$(
    find "$BACKUP_DIR" \
      -maxdepth 1 \
      -type f \
      -name 'bloodkeeper_full_*.tar.gz' \
      -printf '%T@ %p\n' |
      sort -nr |
      head -n 1 |
      cut -d' ' -f2-
  )"
fi

if [ -n "$latest_backup" ]; then
  echo "Última copia: $latest_backup"

  stat \
    --printf='  Tamaño: %s bytes\n  Fecha: %y\n  Permisos: %a\n' \
    "$latest_backup"

  if [ -s "$latest_backup.sha256" ] &&
     (
       cd "$(dirname "$latest_backup")"
       sha256sum -c "$(basename "$latest_backup.sha256")" \
         >/dev/null
     )
  then
    echo "✓ Integridad de la última copia: correcta"
  else
    mark_issue "La última copia no supera la verificación SHA-256."
  fi

  age_seconds="$(
    echo "$(( $(date +%s) - $(stat -c '%Y' "$latest_backup") ))"
  )"

  if [ "$age_seconds" -gt 172800 ]; then
    mark_warning "La última copia tiene más de 48 horas."
  fi
else
  mark_warning "Todavía no existe una copia completa en $BACKUP_DIR."
fi

echo
echo "== Versión instalada =="

echo "Rama: $(git branch --show-current)"
echo "Commit: $(git rev-parse --short HEAD)"
echo "Fecha del commit: $(git log -1 --format='%cI')"
echo "Descripción: $(git log -1 --format='%s')"
echo "API: $(package_version apps/api/package.json)"
echo "Web: $(package_version apps/web/package.json)"

echo
echo "== Logs y diagnóstico =="

echo "Últimas líneas:"
echo "  ./scripts/logs.sh"
echo "Solo errores potenciales:"
echo "  ./scripts/logs.sh all --lines 250 | grep -Ei 'error|fatal|panic|unhealthy|exception|failed|warning|warn'"

recent_relevant="$(
  docker compose logs \
    --no-color \
    --since=24h \
    --tail=500 \
    postgres api web \
    2>/dev/null |
    grep -Ei \
      'error|fatal|panic|unhealthy|exception|failed|warning|warn' |
    tail -n 12 || true
)"

if [ -n "$recent_relevant" ]; then
  mark_warning "Hay mensajes recientes que deben interpretarse junto con tests y health checks:"
  printf '%s\n' "$recent_relevant"
else
  echo "✓ No se localizaron errores recientes con el filtro básico"
fi

echo
echo "============================================================"

if [ "$ISSUES" -gt 0 ]; then
  echo "ESTADO GENERAL: ERROR"
  echo "Errores: $ISSUES | Avisos: $WARNINGS"
  exit 1
fi

if [ "$WARNINGS" -gt 0 ]; then
  echo "ESTADO GENERAL: CORRECTO CON AVISOS"
  echo "Errores: 0 | Avisos: $WARNINGS"
else
  echo "ESTADO GENERAL: CORRECTO"
  echo "Errores: 0 | Avisos: 0"
fi
