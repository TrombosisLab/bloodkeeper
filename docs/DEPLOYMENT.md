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
- Git para clonar el repositorio público;
- acceso a Internet para descargar imágenes base y dependencias públicas.

Docker construye las imágenes release para la arquitectura del host. El
host puede ser Linux, macOS o Windows siempre que permita construir y
ejecutar contenedores Linux mediante Docker.

## Instalación nueva

BloodKeeper puede descargarse y desplegarse en una sola línea:

```bash
git clone https://github.com/TrombosisLab/bloodkeeper.git && cd bloodkeeper && ./install.sh
```

`install.sh` crea una configuración local protegida, construye las
imágenes release desde el checkout, crea volúmenes vacíos, aplica las
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
./scripts/portable-compose.sh build --pull
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

Después de actualizar el checkout Git:

```bash
./install.sh
```

El instalador conserva `.env` y los volúmenes, reconstruye la aplicación,
aplica únicamente las migraciones pendientes y vuelve a validar los
servicios.

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
variables de puertos tienen valores seguros por defecto y
pueden personalizarse localmente.

## Contrato operativo SPEC-006

Antes de una actualización o de una recuperación se conserva una copia previa
del sistema mediante el flujo source-build:

```bash
./scripts/backup.sh
```

La copia se verifica antes de considerarla utilizable:

```bash
./scripts/restore.sh --verify
```

## Recuperación desde servidor limpio

La recuperación desde servidor limpio parte de un checkout Git nuevo, conserva
los paquetes fuera de la máquina Docker y vuelve a validar los health checks
después de levantar los servicios.
