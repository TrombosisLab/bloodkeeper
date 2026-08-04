#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/.."
  pwd
)"

die() {
  echo "ERROR: $*" >&2
  return 1
}

cd "$ROOT"

echo "== Configuración Compose =="

docker compose config --quiet

services="$(
  docker compose config --services |
    sort
)"

expected_services="$(
  printf '%s\n' api postgres web |
    sort
)"

test "$services" = "$expected_services" ||
  die "El conjunto de servicios no coincide."

docker compose config |
  grep -q '^  application:$' ||
  die "No está declarada la red application."

echo "✓ Servicios y red dedicados"

echo
echo "== Salud =="

for container in \
  v5r-postgres \
  v5r-api \
  v5r-web
do
  health="$(
    docker inspect \
      --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' \
      "$container"
  )"

  echo "$container: $health"

  test "$health" = "healthy" ||
    die "$container no está saludable."
done

echo
echo "== Mínimo privilegio =="

for container in \
  v5r-api \
  v5r-web
do
  uid="$(
    docker exec "$container" id -u
  )"

  security="$(
    docker inspect \
      --format='{{json .HostConfig.SecurityOpt}}' \
      "$container"
  )"

  test "$uid" != "0" ||
    die "$container se ejecuta como root."

  echo "$security" |
    grep -q 'no-new-privileges' ||
    die "$container no aplica no-new-privileges."

  echo "✓ $container: uid=$uid, no-new-privileges"
done

postgres_pid="$(
  docker inspect \
    --format='{{.State.Pid}}' \
    v5r-postgres
)"

postgres_user="$(
  ps -o user= -p "$postgres_pid" |
    xargs
)"

test -n "$postgres_user" ||
  die "No se pudo resolver el usuario de PostgreSQL."

test "$postgres_user" != "root" ||
  die "PostgreSQL permanece como root."

echo "✓ v5r-postgres: proceso principal=$postgres_user"

echo
echo "== Red y persistencia =="

for container in \
  v5r-postgres \
  v5r-api \
  v5r-web
do
  networks="$(
    docker inspect \
      --format='{{range $name, $_ := .NetworkSettings.Networks}}{{$name}}{{println}}{{end}}' \
      "$container"
  )"

  echo "$networks" |
    grep -q '_application$' ||
    die "$container no está conectado a application."

  echo "✓ $container conectado a application"
done

volume="$(
  docker inspect \
    --format='{{range .Mounts}}{{if eq .Destination "/var/lib/postgresql/data"}}{{.Name}}{{end}}{{end}}' \
    v5r-postgres
)"

test -n "$volume" ||
  die "PostgreSQL no usa un volumen dedicado."

echo "✓ Volumen PostgreSQL: $volume"

published_postgres="$(
  docker inspect \
    --format='{{json .NetworkSettings.Ports}}' \
    v5r-postgres
)"

echo "$published_postgres" |
  grep -q '"5432/tcp":null' ||
  die "PostgreSQL publica el puerto 5432 en el host."

echo "✓ PostgreSQL aislado del host"

if [ -f .env ]; then
  permissions="$(
    stat -c '%a' .env
  )"

  test "$permissions" = "600" ||
    die ".env debe tener permisos 600."

  echo "✓ .env con permisos 600"
fi

echo
./scripts/check.sh

echo
echo "ARQUITECTURA DOCKER CORRECTA"
