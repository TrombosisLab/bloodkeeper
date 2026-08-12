# Copias de seguridad y recuperación

## Alcance

Este documento materializa SPEC-007 y define la estrategia oficial de
copias y recuperación de BloodKeeper.

Una copia completa protege:

- Base de datos PostgreSQL mediante dump lógico;
- Volumen Docker de PostgreSQL mediante snapshot con el servicio parado;
- configuración local y plantillas;
- historial Git y ramas;
- árbol de trabajo, documentación, scripts y recursos no ignorados;
- checksums y metadatos de trazabilidad.

Los paquetes no deben conservarse únicamente dentro de la misma VM.
`scripts/backup-full.sh` admite un directorio espejo cuando exista un
disco, carpeta compartida o almacenamiento externo disponible.

## Copia lógica de PostgreSQL

Para una copia rápida y sin parada:

```bash
./scripts/backup.sh
```

Destino alternativo:

```bash
./scripts/backup.sh --output-dir /ruta/externa
```

Se generan un dump custom, su SHA-256 y metadatos no sensibles.

## Copia completa

```bash
./scripts/backup-full.sh
```

La captura:

1. crea y valida el dump PostgreSQL;
2. conserva el repositorio mediante `git bundle`;
3. empaqueta el árbol de trabajo y los recursos no ignorados;
4. copia `.env`, Compose y Dockerfiles;
5. detiene brevemente web, API y PostgreSQL;
6. captura el volumen Docker de forma consistente;
7. reinicia y valida los servicios;
8. genera el paquete, checksum y metadatos;
9. aplica la política de conservación.

Destino y espejo explícitos:

```bash
./scripts/backup-full.sh \
  --output-dir "$HOME/bloodkeeper_backups/scheduled" \
  --mirror-dir /ruta/fuera/de/la/VM \
  --keep 7
```

## Programación

La política inicial es:

- una copia completa diaria a las 03:00, hora local;
- conservación de los siete conjuntos completos más recientes;
- registro en `backup.log` dentro del destino;
- una sola ejecución simultánea mediante bloqueo;
- espejo externo cuando exista una ruta disponible.

Instalar o revisar la tarea:

```bash
./scripts/install-backup-schedule.sh --install
./scripts/install-backup-schedule.sh --status
```

Eliminarla:

```bash
./scripts/install-backup-schedule.sh --remove
```

No se aplican copias incrementales en esta fase: el volumen actual es
pequeño y una estrategia incremental añadiría complejidad y riesgo sin
beneficio operativo demostrado. Esta decisión deberá revisarse si el
tamaño o la ventana de copia cambian sustancialmente.

## Verificación periódica

Cada copia valida automáticamente:

- legibilidad del dump con `pg_restore`;
- legibilidad del snapshot del volumen;
- integridad interna mediante SHA-256;
- integridad del paquete exterior;
- recuperación de los servicios tras la captura.

Comprobación contractual:

```bash
./scripts/check-backup-recovery.sh
```

Prueba completa real:

```bash
./scripts/check-backup-recovery.sh --with-full-backup
```

La prueba completa crea un paquete, restaura el dump en una base temporal
y no sustituye la base activa.

## Estado administrativo de las copias

SPEC-042 añade una proyección de sólo lectura para Administración.

`scripts/backup-full.sh` publica al terminar un manifiesto sanitizado en:

```text
$HOME/bloodkeeper_backups/status/backup-status.json
```

El manifiesto contiene únicamente estado de ejecución, fechas, nombre
base de la última copia válida, tamaño, integridad y un error sanitizado.
No contiene rutas absolutas, credenciales ni variables de entorno.

La API recibe exclusivamente ese directorio mediante un bind mount de
sólo lectura en `/run/bloodkeeper-backup`. Los paquetes reales de
`scheduled/`, los dumps y Docker continúan fuera del alcance de la API.

La interfaz administrativa consulta:

```text
GET /administration/backups/status
```

SPEC-042-B permite además solicitar una copia manual mediante:

```text
POST /administration/backups/requests
```

La petición exige sesión administrativa y confirmación explícita. La API
no ejecuta Docker ni scripts del host: escribe únicamente el marcador fijo
`manual-backup.request` en un spool dedicado. `systemd.path` detecta ese
marcador y un servicio del host ejecuta exclusivamente
`scripts/run-manual-backup-request.sh`, que llama a `backup-full.sh` con
ruta y retención fijas.

Instalación del watcher:

```bash
./scripts/install-manual-backup-request-service.sh --install
./scripts/install-manual-backup-request-service.sh --status
```

La restauración continúa siendo exclusivamente por SSH. La Web no puede
elegir comandos, rutas ni parámetros de backup y nunca recibe acceso a
Docker, `scheduled/` o los paquetes reales.

Validación reutilizable:

```bash
./scripts/check-admin-backup-status.sh
./scripts/check-manual-backup-request.sh
```

## Verificar un paquete completo

```bash
./scripts/restore-full.sh \
  --verify /ruta/bloodkeeper_full_FECHA.tar.gz
```

La verificación comprueba el paquete, el repositorio, el árbol de trabajo,
el volumen y restaura la base en un destino temporal.

## Aplicar una restauración de base

Después de verificar el dump incluido:

```bash
./scripts/restore.sh \
  --apply backups/ARCHIVO.dump \
  --confirm
```

La operación crea una copia previa, restaura en una base de preparación,
intercambia las bases y revierte automáticamente si los health checks
fallan.

## Recuperación desde servidor limpio

1. Instalar Ubuntu Server 24.04 LTS.
2. Copiar el paquete completo y verificar su SHA-256.
3. Extraer o reconstruir el proyecto:

```bash
./scripts/restore-full.sh \
  --extract /ruta/bloodkeeper_full_FECHA.tar.gz \
  --target-dir "$HOME/vampiro-v5-revolution-recuperado" \
  --confirm
```

4. Entrar en el directorio recuperado.
5. Ejecutar `./scripts/bootstrap-server.sh`.
6. Verificar el dump de `backups/full-recovery/`.
7. Aplicarlo con `restore.sh --apply ... --confirm`.
8. Ejecutar `./scripts/check.sh`.
9. Confirmar el acceso desde otro equipo de la red.

El snapshot del volumen se conserva como segunda vía de recuperación y
evidencia del estado persistente. La restauración ordinaria usa el dump
lógico validado porque es portable entre instalaciones PostgreSQL
compatibles.

## Evidencia

Conservar junto a cada paquete:

- archivo `.tar.gz`;
- checksum `.tar.gz.sha256`;
- metadatos `.tar.gz.meta`;
- registro de la tarea programada;
- resultado periódico de `check-backup-recovery.sh`;
- al menos una copia reciente fuera de la VM.
