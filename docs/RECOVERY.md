# Copias de seguridad y recuperación

## Alcance

Este documento materializa SPEC-007 y define la estrategia oficial de
copias y recuperación de BloodKeeper.


Existen dos formatos diferenciados. La distribución portable crea dumps
y paquetes de base de datos mediante `backup-worker` dentro de volúmenes
Docker. El paquete completo de repositorio, configuración y snapshot que
se describe a continuación pertenece al adaptador source-build heredado
y sirve para recuperar instalaciones históricas.

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


La programación con `crontab` de esta sección pertenece al adaptador
source-build y no es instalada por `install.sh`. En la distribución
portable, las solicitudes manuales se procesan dentro de Docker; no se
crea ninguna tarea dependiente del sistema operativo anfitrión.

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

## Estado administrativo y copias manuales

SPEC-042 expone a Administración un estado sanitizado y una solicitud
manual confirmada. La API sólo puede leer el volumen de estado y escribir
el marcador fijo `manual-backup.request` en el volumen de solicitudes.

El servicio Docker `backup-worker` es el único consumidor. Genera el dump
PostgreSQL, su checksum y el paquete `bloodkeeper_full_FECHA.tar.gz` en el
volumen `backup_archives`; publica después el manifiesto sanitizado en
`backup_status`. No monta el socket Docker ni una carpeta personal del
host.

Los endpoints siguen siendo:

```text
GET  /administration/backups/status
POST /administration/backups/requests
```

El watcher `systemd.path` anterior está retirado para evitar dos
consumidores. En una máquina que lo hubiese instalado puede comprobarse y
retirarse con:

```bash
./scripts/install-manual-backup-request-service.sh --status
./scripts/install-manual-backup-request-service.sh --remove
```

La restauración sigue siendo una operación local deliberada. La web no
elige comandos, rutas ni parámetros y nunca recibe acceso a Docker o a
los paquetes reales.

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

## Recuperación desde una máquina limpia

1. Instalar Docker y Git en cualquier sistema compatible.
2. Clonar el repositorio autorizado y ejecutar `./install.sh`.
3. Durante el alta inicial, omitir la creación de administrador si se va
   a restaurar una base que ya contiene usuarios.
4. Copiar y verificar el paquete de recuperación desde almacenamiento
   externo.
5. Detener temporalmente web, API y worker mediante
   `scripts/portable-compose.sh` antes de sustituir datos.
6. Restaurar el dump lógico validado en PostgreSQL.
7. Volver a iniciar los servicios y comprobar `/api/health` desde la web.

El checkout Git y las imágenes se recuperan desde GitHub/GHCR; no deben
transportar datos de aplicación. Los paquetes y sus checksums se guardan
fuera del repositorio y, al menos, una copia reciente debe permanecer
fuera de la máquina Docker.

El snapshot histórico del volumen continúa siendo una segunda vía para
paquetes antiguos. La restauración ordinaria usa el dump lógico porque es
portable entre instalaciones PostgreSQL compatibles.

## Evidencia

Conservar junto a cada paquete:

- archivo `.tar.gz`;
- checksum `.tar.gz.sha256`;
- metadatos `.tar.gz.meta`;
- registro de la tarea programada;
- resultado periódico de `check-backup-recovery.sh`;
- al menos una copia reciente fuera de la VM.
