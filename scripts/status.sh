#!/usr/bin/env sh
set -eu

ROOT="$(
  cd "$(dirname "$0")/.."
  pwd
)"

cd "$ROOT"

echo "== Sistema =="

printf 'Host: '
hostname

printf 'Kernel: '
uname -sr

printf 'CPU lógicas: '
getconf _NPROCESSORS_ONLN

printf 'Carga: '
cut -d' ' -f1-3 /proc/loadavg

echo
echo "== Memoria =="

free -h

echo
echo "== Disco =="

df -hT /
echo
docker system df

echo
echo "== Contenedores =="

docker compose ps

echo
echo "== Consumo Docker =="

docker stats \
  --no-stream \
  --format \
  'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}'

echo
echo "== API =="

if curl -fsS \
  http://127.0.0.1:3000/health
then
  echo
else
  echo "API no disponible"
fi
