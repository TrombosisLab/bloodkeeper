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
./scripts/stop.sh --confirm
```

Detiene y elimina los contenedores sin borrar el volumen PostgreSQL.

La parada es una acción de impacto y requiere `--confirm`.

No usar `docker compose down --volumes` durante la operación habitual.

## Reiniciar la plataforma

```bash
./scripts/restart.sh --confirm
```

Reinicia primero PostgreSQL y después API y web, espera los health
checks y ejecuta la comprobación funcional mínima.

El reinicio es una acción de impacto y requiere `--confirm`.

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

## Aplicación de actualizaciones — SPEC-046

SPEC-046 materializa la aplicación efectiva que SPEC-009 dejó
deliberadamente fuera de alcance.

Precomprobación no destructiva:

```bash
./scripts/apply-update.sh \
  --check \
  --target REFERENCIA_GIT_LOCAL
```

Aplicación confirmada:

```bash
./scripts/apply-update.sh \
  --apply \
  --target REFERENCIA_GIT_LOCAL \
  --confirm
```

El flujo ejecuta, en este orden:

1. validación previa del host, Compose y servicios actuales;
2. preparación y verificación de un backup completo;
3. instalación de la referencia Git local como `HEAD` detached;
4. build reproducible de API y Web;
5. arranque de PostgreSQL y espera de health;
6. `prisma migrate deploy`;
7. arranque de API y Web;
8. health checks y `./scripts/check.sh`.

El comando no ejecuta `git fetch`, `git pull` ni obtiene código desde un
remoto. La referencia debe existir ya en el repositorio local.

Ante un fallo el update se detiene y conserva el plan y el backup. La base
de datos no se restaura automáticamente porque hacerlo sin comprobar la
compatibilidad del esquema puede destruir datos válidos. La orquestación
segura de rollback se completa en SPEC-046-C.

## Rollback de una actualización — SPEC-046-C

Cada `update_plan_*.txt` generado antes de una actualización conserva el
commit previo y el backup completo verificado.

Precheck no destructivo:

```bash
./scripts/rollback-update.sh \
  --check \
  --plan RUTA/update_plan_*.txt
```

Rollback de código cuando no hubo migraciones:

```bash
./scripts/rollback-update.sh \
  --apply \
  --plan RUTA/update_plan_*.txt \
  --confirm
```

Si el plan contiene migraciones, el script no intenta SQL inverso ni permite
volver sólo el código. La restauración del estado previo exige una decisión
explícita:

```bash
./scripts/rollback-update.sh \
  --apply \
  --plan RUTA/update_plan_*.txt \
  --restore-data \
  --confirm-data-restore \
  --confirm
```

La restauración de datos puede descartar cambios posteriores al backup. Antes
de ejecutarla debe evaluarse ese impacto. El script verifica el paquete,
vuelve al commit previo, reconstruye las imágenes y valida health y smoke.

Para cambios de infraestructura de alto riesgo, el snapshot de VirtualBox
sigue siendo una medida manual desde el host y no se automatiza desde la VM.
