# Copias y recuperación de BloodKeeper

## Flujo oficial portable

Este documento cubre la distribución actual basada en `install.sh`,
`compose.deploy.yaml` y `scripts/portable-compose.sh`. Los scripts
`backup-full.sh`, `restore-full.sh` y `restore-full-guided.sh` son
heredados: **no se usan para una instalación portable nueva**.

La copia portable es un paquete PostgreSQL con dump, manifiesto de formato,
revisión de código y checksums. Los retratos y las imágenes de recursos se
guardan en PostgreSQL, por lo que quedan incluidos. El código se obtiene de
Git; los secretos de instalación no se guardan dentro de la copia.

## Cómo se crean las copias

- BloodKeeper crea automáticamente una copia diaria a las 03:00 UTC.
- Se conservan siete copias dentro del volumen Docker `backup_archives`.
- Administración muestra el estado y permite solicitar una copia manual.
- El trabajador valida el dump y publica checksum, manifiesto y estado.

No se requiere crontab para las copias internas; cron solo se usa si se
activa la exportación opcional al anfitrión.

Las copias dentro de Docker protegen frente a errores de datos, pero no ante
la pérdida del anfitrión o de su disco. Para redundancia, expórtalas fuera del
volumen Docker.

## Exportar copias al anfitrión

Exportar una vez a una carpeta local:

```bash
./scripts/export-portable-backups.sh --destination "$HOME/bloodkeeper-copias" --keep 30
```

El exportador solo copia una copia de hoy cuyo estado sea correcto. Verifica
los checksums externo e interno antes de publicarla en el destino. No borra
el paquete de Docker. Conserva 30 conjuntos en el anfitrión; usa
`--keep 0` para desactivar la eliminación automática. Los archivos se
protegen con permisos privados del anfitrión.

Para un disco USB o una unidad montada, exige que el destino esté realmente
montado. Así no se escribirán copias por error en la carpeta vacía del disco
del sistema si la unidad está desconectada:

```bash
./scripts/export-portable-backups.sh \
  --destination /mnt/bloodkeeper \
  --keep 30 \
  --require-mounted
```

### Activar exportación diaria opcional

La exportación automática es independiente del respaldo diario interno y usa
cron del anfitrión. Elige una hora posterior a la copia diaria:

```bash
sudo ./scripts/install-host-backup-export.sh \
  --enable \
  --destination /mnt/bloodkeeper \
  --hour 4 \
  --minute 0 \
  --keep 30 \
  --require-mounted
```

Consulta o desactiva la tarea:

```bash
./scripts/install-host-backup-export.sh --status
sudo ./scripts/install-host-backup-export.sh --disable
```

Desactivar la tarea no borra las copias exportadas. La ejecución y los
errores quedan en `/var/log/bloodkeeper-backup-export.log`.

Una carpeta del mismo disco del servidor **no es una copia ante fallo del
servidor**. Para redundancia física, usa un disco separado o almacenamiento
montado desde otro equipo. La integración con servicios de nube queda fuera
de este procedimiento.

## Verificar una copia

No hace falta sustituir los datos para probar una copia:

```bash
./scripts/restore-portable-backup.sh --verify \
  /ruta/bloodkeeper_full_FECHA.tar.gz
```

Debe estar junto al archivo su `.sha256`. El comando comprueba los checksums,
verifica la revisión de código cuando está disponible, restaura el dump en
una base temporal y comprueba que contiene tablas e historial de migraciones.
La base activa no se reemplaza.

## Restaurar en el servidor actual

La restauración reemplaza los datos actuales. Usa primero `--verify`, revisa
que el archivo sea el correcto y después ejecuta:

```bash
./scripts/restore-portable-backup.sh --apply \
  /ruta/bloodkeeper_full_FECHA.tar.gz \
  --confirm
```

El programa pide escribir exactamente `RESTAURAR`. Antes de cambiar la base
crea y valida una copia previa en `backups/pre-restore/`. Prepara la copia
nueva aparte, detiene temporalmente Web/API y el trabajador, aplica las
migraciones pendientes y comprueba la salud de la aplicación. Si la
validación falla, intenta volver a la base previa y deja la base fallida
conservada para diagnóstico. No elimina volúmenes Docker.

## Recuperación desde servidor limpio

1. Instala Docker Engine, Docker Compose integrado y Git.
2. Descarga el código e instala BloodKeeper. Se omite crear un usuario nuevo
   porque la copia ya contiene las cuentas:

   ```bash
   git clone https://github.com/TrombosisLab/bloodkeeper.git
   cd bloodkeeper
   BLOODKEEPER_SKIP_ADMIN=1 ./install.sh
   ```

3. Copia al servidor el paquete `.tar.gz` y su archivo `.sha256` desde el
   disco externo. No basta con tenerlos dentro del servidor antiguo.
4. Verifica la ruta y la integridad:

   ```bash
   ./scripts/restore-portable-backup.sh --verify \
     /ruta/bloodkeeper_full_FECHA.tar.gz
   ```

5. Aplica la copia:

   ```bash
   ./scripts/restore-portable-backup.sh --apply \
     /ruta/bloodkeeper_full_FECHA.tar.gz \
     --confirm
   ```

   Escribe `RESTAURAR` cuando lo solicite.

6. Entra con una cuenta que ya existía en la copia y comprueba personajes,
   retratos, crónicas e imágenes. La dirección y los puertos de acceso son
   los configurados en el nuevo anfitrión; si se cambia el dominio o el
   proxy, esa parte se configura por separado.

Las credenciales de base de datos se generan de nuevo en el `.env` del
servidor limpio. No copies el `.env` antiguo sobre él. Los usuarios,
personajes y contraseñas de BloodKeeper sí proceden de la base restaurada.

## Protección y límites

Los paquetes contienen datos privados de la crónica y no se cifran en esta
fase. Guarda el destino con acceso restringido y protégelo como datos
sensibles. La copia incluye los datos de la aplicación, no imágenes Docker,
logs del sistema ni secretos de despliegue.

## Instalaciones antiguas

El adaptador source-build conserva scripts de recuperación histórica. No
mezcles esos archivos con una instalación portable. Para una instalación
antigua, consulta la documentación específica de esa versión antes de
restaurar.
