# Copias de seguridad y recuperación

## Alcance

Las copias oficiales protegen la base PostgreSQL. El código y los
scripts se recuperan desde Git o desde una copia íntegra del repositorio.

Los archivos de backup no deben conservarse únicamente dentro de la
misma VM.

## Crear una copia

```bash
./scripts/backup.sh
```

Destino alternativo:

```bash
./scripts/backup.sh --output-dir /ruta/externa
```

Se generan:

- `*.dump`: archivo PostgreSQL en formato custom;
- `*.dump.sha256`: integridad SHA-256;
- `*.dump.meta`: fecha, base, formato y commit de referencia.

El script no detiene la aplicación y valida que el archivo pueda ser
leído por `pg_restore`.

## Verificar una copia

```bash
./scripts/restore.sh --verify backups/ARCHIVO.dump
```

La verificación:

1. comprueba el checksum cuando está disponible;
2. crea una base temporal;
3. restaura el archivo;
4. valida tablas y migraciones Prisma;
5. elimina la base temporal.

No modifica la base activa.

## Aplicar una restauración

```bash
./scripts/restore.sh \
  --apply backups/ARCHIVO.dump \
  --confirm
```

La operación:

1. crea una copia previa de la base actual;
2. restaura y valida en una base de preparación;
3. detiene API y web;
4. intercambia las bases;
5. reinicia y ejecuta los health checks;
6. conserva automáticamente la base anterior si la validación falla.

La restauración debe ejecutarse desde SSH y durante una ventana sin
usuarios activos.

## Recuperación completa del servidor

1. Instalar Ubuntu Server 24.04 LTS.
2. Copiar o clonar el repositorio.
3. Ejecutar `./scripts/bootstrap-server.sh`.
4. Copiar el backup elegido al servidor.
5. Verificarlo con `restore.sh --verify`.
6. Aplicarlo con `restore.sh --apply ... --confirm`.
7. Ejecutar `./scripts/check.sh`.
8. Confirmar el acceso desde otro equipo de la red.

## Conservación

Mantener al menos una copia reciente fuera de la VM. La política de
retención concreta se definirá cuando exista una frecuencia operativa
real y no debe automatizarse sin necesidad.
