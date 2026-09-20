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

La distribución portable programa las copias dentro de Docker mediante el
servicio backup-scheduler. El scheduler escribe una solicitud en el volumen
Docker compartido y backup-worker ejecuta el dump, los checksums y la
retención.

La configuración predeterminada es una copia completa diaria a las 03:00 UTC
con conservación de los siete conjuntos completos más recientes. Puede
personalizarse con BLOODKEEPER_BACKUP_SCHEDULE_HOUR y
BLOODKEEPER_BACKUP_SCHEDULE_MINUTE en .env. No se requiere crontab, systemd
ni ningún programador del sistema operativo anfitrión.

El adaptador source-build conserva install-backup-schedule.sh para
instalaciones históricas, pero no forma parte del flujo portable.

Comprobación contractual:

./scripts/check-backup-recovery.sh

Prueba completa real:

./scripts/check-backup-recovery.sh --with-full-backup

La prueba completa crea un paquete, restaura el dump en una base temporal
y no sustituye la base activa.

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
el volumen y restaura la base en un destino temporal. Si PostgreSQL todavía
no está iniciado, el script levanta únicamente `v5r-postgres` y espera a que
esté saludable. No necesita que Web ni API estén arrancados y no debe
sustituirse por un `docker compose up -d` manual durante esta fase.

## Restauración completa automatizada

En una máquina limpia, una vez copiado el paquete completo al servidor, el
panel de administración puede ejecutar el flujo completo mediante:

```bash
./scripts/restore-full-guided.sh \
  --archive /ruta/bloodkeeper_full_FECHA.tar.gz \
  --target-dir /ruta/bloodkeeper-restored
```

El flujo verifica primero el paquete, lo extrae en una ruta nueva, detiene la
instalación actual sin borrar sus volúmenes, ejecuta el bootstrap, verifica el
dump y solicita una confirmación explícita antes de aplicarlo. Si falla después
de detener la instalación anterior, intenta volver a levantarla. La ruta
anterior no se elimina automáticamente.

La copia del paquete a la máquina destino sigue siendo responsabilidad del
operador y debe hacerse antes de iniciar el flujo.

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
2. Clonar el repositorio autorizado y ejecutar `./install.sh` sólo si se
   necesita preparar el host; durante el alta inicial, omitir la creación
   de administrador si se va a restaurar una base que ya contiene usuarios.
3. Copiar el paquete completo y su checksum desde almacenamiento externo.
4. Verificarlo sin depender de Web ni API:

   ```bash
   ./scripts/restore-full.sh --verify /ruta/bloodkeeper_full_FECHA.tar.gz
   ```

5. Para reconstruir una instalación desde el paquete, extraerlo a una ruta
   nueva:

   ```bash
   ./scripts/restore-full.sh \
     --extract /ruta/bloodkeeper_full_FECHA.tar.gz \
     --target-dir /ruta/bloodkeeper \
     --confirm
   cd /ruta/bloodkeeper
   ```

6. Reconstruir las imágenes y arrancar los servicios con el bootstrap del
   proyecto. Este paso evita reutilizar una imagen Web antigua:

   ```bash
   ./scripts/bootstrap-server.sh --deploy
   ```

7. Verificar y aplicar el dump incluido, sólo después de que el bootstrap
   haya dejado saludable PostgreSQL, API y Web:

   ```bash
   ./scripts/restore.sh --verify backups/full-recovery/bloodkeeper_vampiro_v5_FECHA.dump
   ./scripts/restore.sh --apply backups/full-recovery/bloodkeeper_vampiro_v5_FECHA.dump --confirm
   ./scripts/check.sh
   ```

No se recomienda iniciar la aplicación con `docker compose up -d` antes de
reconstruir API y Web: una imagen anterior puede no contener el usuario
interno `node` o no coincidir con los archivos recuperados.

El checkout Git se recupera desde GitHub y las imágenes de BloodKeeper se
reconstruyen localmente; ninguno debe transportar datos de aplicación.
Los paquetes y sus checksums se guardan
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

## Recuperación desde servidor limpio

La recuperación desde servidor limpio requiere un checkout Git nuevo, Docker
operativo, el paquete completo y su checksum fuera de la máquina Docker. Tras
restaurar PostgreSQL se vuelven a comprobar los servicios y `/api/health`.

## Adaptador source-build histórico

Las instalaciones históricas que necesiten preparar el entorno mediante el
flujo source-build pueden usar el adaptador:

./scripts/bootstrap-server.sh --deploy

Este adaptador no es un requisito de la distribución portable, que utiliza
Docker Compose y los servicios contenidos en el proyecto.

## Aplicación de una restauración validada

Cuando la recuperación deba aplicar el dump lógico sobre la base de datos
de destino, el procedimiento operativo utiliza:

./scripts/restore.sh --apply

La operación se realiza únicamente después de verificar la copia y confirmar
el destino de restauración.

La validación final de los servicios restaurados se ejecuta con:

./scripts/check.sh
