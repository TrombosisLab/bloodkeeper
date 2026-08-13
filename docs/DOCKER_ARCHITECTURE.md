# Arquitectura Docker

## Alcance

Este documento materializa la arquitectura oficial definida por
SPEC-003 para el entorno local de BloodKeeper.

Docker es la plataforma de ejecución y Docker Compose es el orquestador
principal. `compose.yaml` es el único archivo Compose necesario en el
estado actual.

## Topología

```text
Equipo de la LAN
       |
       | :5173
       v
web / Vite
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

Los tres servicios comparten exclusivamente la red Docker
`application`.

## Servicios

### Web

- Imagen oficial `node:22-alpine`.
- Ejecuta Vite como usuario `node`.
- Publica el puerto `5173`.
- Actúa como punto de entrada web y proxy de `/api`.
- Aplica `no-new-privileges`.
- Usa `npm ci` con el `package-lock.json` versionado.

El proxy de Vite cumple actualmente la función de reverse proxy. No se
añade Nginx mientras no exista una necesidad formal de empaquetado de
producción.

### API

- Imagen oficial `node:22-alpine`.
- Ejecuta NestJS como usuario `node`.
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

Las copias no requieren un contenedor residente adicional.
`scripts/backup.sh` y `scripts/restore.sh` operan contra PostgreSQL,
generan checksums y permiten validar una restauración temporal.

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
  `application`.

La instalación base está orientada a red local. Cualquier exposición a
Internet requiere una revisión específica de seguridad antes de abrir
puertos, publicar servicios o incorporar infraestructura perimetral.

## Persistencia

Los datos PostgreSQL residen exclusivamente en `postgres_data`. Detener,
eliminar o recrear los contenedores no elimina el volumen.

No debe usarse `docker compose down --volumes` durante la operación
habitual.

## Disponibilidad

Todos los servicios declaran health check y reinicio
`unless-stopped`. Las dependencias esperan a que el servicio requerido
esté saludable.

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

Un reverse proxy dedicado, una caché o un contenedor programado de
backups solo se incorporarán mediante una SPEC aprobada. No deben
añadirse preventivamente.
