# Despliegue en Ubuntu Server

## Alcance

Este documento materializa SPEC-006 y define el procedimiento oficial
para instalar y desplegar BloodKeeper en Ubuntu Server 24.04 LTS
mediante Docker Engine y Docker Compose.

La topología, el aislamiento y la persistencia se describen en
`docs/DOCKER_ARCHITECTURE.md`.

El servidor puede permanecer sin acceso a Internet después de construir
las imágenes. La preparación inicial necesita acceso a los repositorios
de Ubuntu, Docker y npm, o un espejo local equivalente.

## Requisitos

- Ubuntu Server 24.04 LTS de 64 bits.
- Usuario con acceso SSH y permiso `sudo`.
- Copia del repositorio en el servidor.
- Puertos LAN 5173 y 3000 disponibles.

El repositorio puede copiarse desde otra máquina o recuperarse desde un
origen Git cuando exista. El proyecto no depende de una ruta absoluta.

## Despliegue completo

Desde la raíz del repositorio:

```bash
chmod +x scripts/*.sh scripts/dev/*.sh
./scripts/bootstrap-server.sh
```

El script:

1. valida Ubuntu Server 24.04;
2. instala Git si falta;
3. instala Docker Engine y el plugin Docker Compose si faltan;
4. crea `.env` con permisos `600` y contraseña aleatoria si no existe;
5. construye las imágenes;
6. inicia PostgreSQL;
7. aplica las migraciones Prisma;
8. inicia API y web;
9. espera los health checks;
10. valida frontend, API, base de datos y proxy.

No sobrescribe un `.env` existente.

## Preparación separada

Solo preparar herramientas del servidor:

```bash
./scripts/bootstrap-server.sh --prepare-host
```

Comprobar requisitos sin modificar el sistema:

```bash
./scripts/bootstrap-server.sh --check-host
```

Tras añadir el usuario al grupo `docker`, una nueva sesión SSH aplica
completamente la pertenencia. El primer despliegue usa `sudo` cuando sea
necesario.

## Primera cuenta

La aplicación actual exige autenticación. Después del despliegue:

```bash
./scripts/create-initial-admin.sh
```

La contraseña se solicita sin mostrarla y se almacena hasheada.

## Acceso

Consultar la dirección LAN:

```bash
hostname -I
```

Abrir desde otro equipo de la red:

```text
http://DIRECCION_LAN:5173
```

La API queda disponible en el puerto `3000`. La web se comunica con ella
mediante `/api`.

## Operación habitual

```bash
./scripts/start.sh
./scripts/restart.sh
./scripts/status.sh
./scripts/check.sh
./scripts/logs.sh
./scripts/prepare-update.sh --check --target HEAD
./scripts/stop.sh
```

El catálogo completo de mantenimiento está en
`docs/MAINTENANCE_OPERATIONS.md`.

## Validación del despliegue

Comprobación operativa y contractual:

```bash
./scripts/check-deployment.sh
```

Validación adicional de backup y restauración temporal:

```bash
./scripts/check-deployment.sh --with-backup
```

La segunda opción no sustituye la base activa. Ambas terminan con:

```text
DESPLIEGUE SPEC-006 CORRECTO
```

## Copia previa a actualizaciones

Antes de una actualización relevante:

```bash
./scripts/backup.sh
./scripts/restore.sh --verify backups/ARCHIVO.dump
```

El procedimiento completo está en `docs/RECOVERY.md`.

## Datos

PostgreSQL usa el volumen Docker `postgres_data`. `docker compose down`
detiene los servicios sin borrar el volumen.

No ejecutar `docker compose down --volumes` salvo que se pretenda
eliminar los datos.

## Resultado esperado

- `v5r-postgres`: healthy.
- `v5r-api`: healthy.
- `v5r-web`: healthy.
- Frontend accesible por LAN.
- `/health` responde con API y base de datos en estado `ok`.
