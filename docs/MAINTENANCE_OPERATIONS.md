# Operaciones de mantenimiento

## Alcance

Este documento materializa SPEC-009 y define las operaciones básicas de
mantenimiento de BloodKeeper mediante SSH y scripts ejecutables.

Las operaciones existentes de despliegue, supervisión, backup y
recuperación se reutilizan. No se crean sistemas paralelos.

## Iniciar la plataforma

```bash
./scripts/start.sh
```

Inicia los servicios definidos por Docker Compose y muestra su estado.

## Detener la plataforma

```bash
./scripts/stop.sh
```

Detiene y elimina los contenedores sin borrar el volumen PostgreSQL.

No usar `docker compose down --volumes` durante la operación habitual.

## Reiniciar la plataforma

```bash
./scripts/restart.sh
```

Reinicia primero PostgreSQL y después API y web, espera los health
checks y ejecuta la comprobación funcional mínima.

## Estado

```bash
./scripts/status.sh
```

Muestra servicios, PostgreSQL, CPU, memoria, disco, backups, versión y
diagnóstico básico.

## Logs

```bash
./scripts/logs.sh
./scripts/logs.sh api --lines 200
./scripts/logs.sh postgres --follow
```

## Health checks

```bash
./scripts/check.sh
```

Valida Docker Compose, contenedores, frontend, API, PostgreSQL y proxy
web → API.

## Backup

Copia lógica rápida:

```bash
./scripts/backup.sh
```

Copia completa:

```bash
./scripts/backup-full.sh
```

La política completa está definida en `docs/RECOVERY.md`.

## Restauración

Verificación no destructiva:

```bash
./scripts/restore.sh --verify backups/ARCHIVO.dump
```

Aplicación sobre la base activa:

```bash
./scripts/restore.sh \
  --apply backups/ARCHIVO.dump \
  --confirm
```

La restauración destructiva exige confirmación, crea una copia previa y
revierte a la base anterior cuando los health checks fallan.

## Preparar una actualización

Comprobación sin cambios:

```bash
./scripts/prepare-update.sh \
  --check \
  --target REFERENCIA_GIT_LOCAL
```

Preparación con protección completa:

```bash
./scripts/prepare-update.sh \
  --prepare \
  --target REFERENCIA_GIT_LOCAL \
  --confirm
```

La preparación:

1. exige un working tree limpio;
2. valida la referencia objetivo;
3. identifica migraciones y cambios de infraestructura;
4. comprueba el estado actual;
5. crea y verifica una copia completa;
6. registra versión actual, objetivo, imágenes y estrategia de reversión;
7. no cambia de versión, no construye imágenes, no aplica migraciones y
   no despliega.

La aplicación efectiva de una actualización queda fuera de SPEC-009 y
deberá seguir el procedimiento aprobado por la SPEC transversal
correspondiente.

## Cambios de alto riesgo

Antes de un cambio importante se debe valorar:

- copia completa verificada;
- rama Git específica;
- Snapshot de VirtualBox desde el equipo anfitrión;
- versión anterior identificada;
- procedimiento de Reversión;
- restauración de datos únicamente cuando sea necesaria.

Un cambio de infraestructura o una migración requiere atención explícita
antes de aplicar la actualización.

## Validación

```bash
./scripts/check-maintenance-operations.sh
```

Validación con reinicio real y backup temporal:

```bash
./scripts/check-maintenance-operations.sh \
  --with-restart \
  --with-backup
```

Resultado esperado:

```text
MANTENIMIENTO SPEC-009 CORRECTO
```
