# Despliegue portátil de BloodKeeper

## Alcance

El procedimiento oficial de distribución utiliza Docker y Docker
Compose. No depende de Ubuntu, de una máquina virtual, de una ruta
personal ni de una dirección IP fija.

La arquitectura se detalla en `docs/DOCKER_ARCHITECTURE.md` y el contrato
de instalación en `docs/PORTABLE_INSTALLATION.md`.

## Requisitos

- Docker Engine o Docker Desktop;
- Docker Compose integrado (`docker compose`);
- Git con acceso al repositorio privado;
- permiso para descargar los paquetes privados de GHCR.

Docker resuelve la arquitectura compatible de las imágenes publicadas.
El host puede ser Linux, macOS o Windows siempre que permita ejecutar
contenedores Linux mediante Docker.

## Instalación nueva

Una cuenta autorizada puede descargar y desplegar en una sola línea:

```bash
git clone https://github.com/TrombosisLab/bloodkeeper.git && cd bloodkeeper && ./install.sh
```

La autenticación de Git y GHCR pertenece a cada persona y no se almacena
en el repositorio. Si GHCR necesita autenticación, el instalador ofrece
`docker login ghcr.io` y reintenta la descarga.

`install.sh` crea una configuración local protegida, descarga las
imágenes correspondientes al commit, crea volúmenes vacíos, aplica las
migraciones, inicia los servicios, valida los health checks y permite
crear el primer administrador.

Una instalación nueva no contiene previamente usuarios, personajes,
crónicas, copias ni datos de otra máquina.

## Acceso

Acceso desde el propio host:

```text
http://localhost:5173
```

Desde otro equipo se usa el nombre o la dirección actual de la máquina
Docker. Esa dirección no forma parte de la configuración de BloodKeeper.
El puerto web puede elegirse con `BLOODKEEPER_WEB_PORT`.

La API se publica solamente en la interfaz local del host y la web se
comunica con ella mediante `/api`.

## Operación portable

Todas las órdenes de distribución usan el mismo Compose y nombre de
proyecto mediante el wrapper:

```bash
./scripts/portable-compose.sh ps
./scripts/portable-compose.sh logs --tail=100
./scripts/portable-compose.sh pull
./scripts/portable-compose.sh up -d
./scripts/portable-compose.sh down
```

`down` conserva los volúmenes. No se debe ejecutar `down --volumes` salvo
que se pretenda borrar de forma irreversible la base y las copias locales.

## Administración local

El instalador ofrece crear la primera cuenta. También puede ejecutarse:

```bash
./scripts/create-initial-admin.sh
./scripts/reset-user-password.sh
```

Las contraseñas se solicitan sin mostrarlas y sólo se entregan al
contenedor administrativo durante esa ejecución.

## Actualización

Después de actualizar el checkout Git y una vez publicadas las imágenes
del nuevo commit:

```bash
./install.sh
```

El instalador conserva `.env` y los volúmenes, descarga la versión
correspondiente, aplica únicamente las migraciones pendientes y vuelve a
validar los servicios.

## Copias

El servicio `backup-worker` consume las solicitudes administrativas y
guarda los paquetes en volúmenes Docker. No usa el socket Docker ni rutas
personales del host. La extracción a almacenamiento externo y la
recuperación se describen en `docs/RECOVERY.md`.

## Adaptador Ubuntu heredado

`scripts/bootstrap-server.sh` se conserva para preparar Ubuntu Server
24.04 y para las comprobaciones históricas de SPEC-006. Construye desde
fuentes con `compose.yaml`; no es el punto de entrada de distribución.

Los scripts clásicos de start, stop, update y backup completo pertenecen
también a ese entorno source-build mientras se completa su migración. En
una instalación release se usa `install.sh` y `portable-compose.sh`.

## Configuración obligatoria

Los secretos permanecen en `.env`, ignorado por Git. Docker Compose exige
`DATABASE_URL`, `POSTGRES_DB`, `POSTGRES_USER` y `POSTGRES_PASSWORD`. Las
variables de versión y puertos tienen valores seguros por defecto y
pueden personalizarse localmente.
