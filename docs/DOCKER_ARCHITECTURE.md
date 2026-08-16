# Arquitectura Docker

## Alcance

Este documento materializa la arquitectura oficial definida por
SPEC-003 para el entorno local de BloodKeeper.

Docker es la plataforma de ejecución y Docker Compose es el orquestador
principal. `compose.yaml` define el flujo source-build y
`compose.deploy.yaml` construye localmente imágenes release desde el
checkout. Ambos conservan servicios, redes y volúmenes equivalentes
dentro de sus respectivos modos de ejecución; la instalación no depende
de un registro privado de imágenes.

## Topología

```text
Equipo de la LAN
       |
       | :5173
       v
web / Vite (desarrollo) o Nginx (release)
       |
       | /api → api:3000
       v
api / NestJS
       |
       | DATABASE_URL → postgres:5432
       v
PostgreSQL
       |
       v
postgres_data
```

Web, API, PostgreSQL y el worker de copias comparten exclusivamente la
red Docker `application`. `backup-init` es una tarea puntual aislada de
la red que prepara permisos en los volúmenes de copias antes de arrancar
API y worker.

## Servicios

### Web

- Desarrollo usa `node:22-alpine` y Vite como usuario `node`.
- La instalación construye el frontend en una etapa Node y sirve sólo el
  resultado estático desde `nginx:1.28-alpine` como usuario no root.
- Publica el puerto `5173`.
- Actúa como punto de entrada web y proxy de `/api`.
- Aplica `no-new-privileges`.
- Usa `npm ci` con el `package-lock.json` versionado.

Vite actúa como proxy en desarrollo y Nginx implementa el mismo contrato
`/api` en la imagen release.

### API

- Se construye en una etapa `node:22-alpine` y se ejecuta en una etapa
  runtime separada como usuario `node`.
- Usa `npm ci` con su lockfile existente.
- Publica el puerto `3000` sólo en `127.0.0.1` del host para diagnóstico y operación local; la LAN accede a la API mediante el proxy `/api` de la Web.
- Accede a PostgreSQL únicamente mediante la red Docker.
- Aplica `no-new-privileges`.

### PostgreSQL

- Imagen oficial `postgres:17-alpine`.
- No publica el puerto `5432` en el host.
- Conserva sus datos en el volumen `postgres_data`.
- La imagen oficial entrega el proceso PostgreSQL a su usuario interno
  no privilegiado.

### Copias de seguridad

`backup-init` prepara con privilegios mínimos los volúmenes
`backup_status`, `backup_requests` y `backup_archives`, termina y no se
reinicia. No participa en la red de aplicación.

`backup-worker` se ejecuta como usuario no root, con sistema de archivos
de sólo lectura, capacidades eliminadas y `no-new-privileges`. Atiende
peticiones mediante volúmenes, accede a PostgreSQL sólo por la red
`application` y conserva los archivos en `backup_archives`.

Los scripts de backup y restauración siguen proporcionando operación,
checksums y validación temporal sin sustituir la base activa.

No existe caché porque todavía no ha sido incorporada formalmente.

## Configuración y secretos

- `.env` permanece fuera de las imágenes mediante `.dockerignore`.
- `.env` usa permisos `600`.
- Las credenciales se inyectan durante la creación de los contenedores.
- `.env.example` documenta únicamente nombres y valores de desarrollo.

## Superficie de red y exposición

La superficie publicada del despliegue local se limita a lo necesario:

- la Web publica `5173` en la LAN y actúa como punto de entrada;
- la API publica `3000` únicamente en `127.0.0.1` del host para
  diagnóstico y scripts operativos locales;
- PostgreSQL no publica `5432` en el host;
- Web, API y PostgreSQL se comunican internamente por la red Docker
  `application`;
- el worker de copias usa esa red únicamente para PostgreSQL y no
  publica puertos en el host.

La instalación base está orientada a red local. Cualquier exposición a
Internet requiere una revisión específica de seguridad antes de abrir
puertos, publicar servicios o incorporar infraestructura perimetral.

## Persistencia

Los datos PostgreSQL residen en `postgres_data`. El estado, las
peticiones y los archivos de backup residen respectivamente en
`backup_status`, `backup_requests` y `backup_archives`. Detener, eliminar
o recrear contenedores no elimina estos volúmenes.

No debe usarse `docker compose down --volumes` durante la operación
habitual.

## Disponibilidad

Los servicios persistentes declaran health check y reinicio
`unless-stopped`. Las dependencias esperan a PostgreSQL y a la
preparación satisfactoria de volúmenes. `backup-init` es deliberadamente
una tarea de ejecución única con reinicio desactivado.

## Registros

Los servicios escriben en la salida estándar y de error de Docker.

```bash
./scripts/logs.sh
./scripts/logs.sh api --lines 200
```

## Despliegue y validación

```bash
./scripts/bootstrap-server.sh
./scripts/check-docker-architecture.sh
./scripts/check.sh
```

## Cambios futuros

Un reverse proxy dedicado, una caché u otra infraestructura adicional
solo se incorporarán mediante una SPEC aprobada. No deben añadirse
preventivamente.
