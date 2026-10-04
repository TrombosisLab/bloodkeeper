# Actualizaciones de BloodKeeper por consola

`bloodkeeper-update` instala la última versión de `main` del repositorio
público en una instalación Linux desde Git. Es una operación de servidor:
ejecútala por SSH como el usuario registrado, sin `sudo` delante. El comando
pide los permisos de sudo necesarios para Docker.

## Registro del comando

Una instalación Linux mediante `install.sh` registra automáticamente su
usuario, ruta, archivo Compose, configuración `.env` y nombre del proyecto.
No necesita una dirección IP fija. Las instalaciones desde ZIP o tarball sin
historial Git no pueden actualizarse con este comando; primero necesitan un
checkout Git con su configuración y datos conservados.

Para una instalación existente con `compose.yaml`, entra en su carpeta:

```bash
sudo bash scripts/install-update-command.sh --user "$(id -un)"
```

Para una instalación de producción, usa exactamente el proyecto y el archivo
Compose que ya gestionan sus contenedores. Por ejemplo, si se instaló con los
valores predeterminados de `install.sh`:

```bash
sudo bash scripts/install-update-command.sh \
  --user "$(id -un)" \
  --compose-file "$PWD/compose.deploy.yaml" \
  --env-file "$PWD/.env" \
  --project-name bloodkeeper
```

El registro no descarga código ni reinicia servicios. Conserva una copia del
comando anterior y de su configuración cuando existen. La configuración queda
en `/etc/bloodkeeper-update.conf` y el lanzador en
`/usr/local/bin/bloodkeeper-update`, ambos propiedad de root. Por defecto el
usuario se obtiene del propietario de `.git`; `--user` permite indicarlo.
Existe un comando global por máquina: repetir el registro lo asocia al proyecto
indicado. Para varios proyectos, ejecuta el script del repositorio con sus
argumentos correspondientes en lugar de registrar varios con el mismo nombre.

## Uso habitual

```bash
bloodkeeper-update
```

El comando realiza estas operaciones:

1. Comprueba usuario, rama `main`, configuración y ausencia de cambios locales,
   incluidos archivos nuevos no ignorados. No borra ni guarda automáticamente
   esos cambios. Un bloqueo impide dos actualizaciones simultáneas del repositorio.
2. Descarga `main` por HTTPS desde GitHub, sin cambiar `origin` ni solicitar
   credenciales de GitHub para este repositorio público. Exige avance directo:
   no elimina commits locales ni fuerza la rama.
3. Conserva el código anterior, una copia lógica de PostgreSQL comprobada con
   `pg_restore --list`, el archivo Compose y `.env`. No es un snapshot del host
   ni sustituye las copias completas periódicas.
4. Integra el código en `main`, construye las imágenes del archivo Compose y
   comprueba la compilación de API y web. Las imágenes de producción ya compilan
   en sus etapas Docker; las de desarrollo se comprueban en contenedores temporales.
5. Espera PostgreSQL, prepara los volúmenes y aplica las migraciones pendientes.
6. Despliega API, web y servicios de copias, espera sus comprobaciones de salud
   y confirma que web responde y que la API informa estado y base de datos correctos.

La versión se registra como desplegada solo al completar esas comprobaciones.
En la primera ejecución puede reconstruir aunque Git no encuentre nuevos commits:
todavía no hay una versión desplegada registrada por esta herramienta. Después,
si la versión coincide y los servicios responden, no reconstruye innecesariamente.

El comando no hace commits ni push. Los datos de la aplicación, imágenes,
credenciales y copias locales no se suben a GitHub. Puede haber una interrupción
durante el despliegue o las migraciones; no promete una actualización sin parada.

## Informes y reintentos

Las copias e informes se guardan en una carpeta propia de cada intento bajo
`$HOME/bloodkeeper_backups/updates`, con permisos restrictivos. Para otro destino,
define `BLOODKEEPER_UPDATE_BACKUP_DIR` al ejecutar el comando. No se eliminan
automáticamente las copias antiguas: revisa el espacio disponible periódicamente.

Cada carpeta contiene `result.txt`, `source-before.tar.gz`, `database.dump`,
`environment.env`, `compose-before.yaml` y `versions.txt` cuando esas fases se han
completado. Si no había nada que actualizar, contiene únicamente el informe.
Protege la carpeta: la copia de `.env` contiene credenciales.

Si falla la descarga, copia, compilación, migración o comprobación de salud, se
detiene y muestra la fase y el informe. No registra el intento como completado.
Corrige el problema y repite `bloodkeeper-update`, incluso si el código ya quedó
descargado. Conserva también la copia del primer intento: las copias de reintentos
posteriores pueden corresponder al código ya actualizado.

El estado local vive dentro del directorio Git (`bloodkeeper-deployed-version`
y `bloodkeeper-update-pending`), fuera de los archivos versionados. No se modifica
`.env` ni se vuelve a ejecutar la creación de usuarios administradores.

No se restaura la base de datos automáticamente ante un fallo. Una migración puede
haber aplicado cambios válidos y una restauración podría perder trabajo posterior.
Para revertir, revisa el informe y la versión previa y sigue el procedimiento de
recuperación del proyecto. Si Prisma comunica una migración fallida, resuelve ese
estado antes de reintentar; este comando no fuerza ni descarta migraciones.

## Compatibilidad

Requiere Bash, Git, Docker Compose con `--wait`, `flock` y utilidades habituales
de Linux. Los servicios de la instalación deben usar los nombres oficiales
`postgres`, `backup-init`, `api`, `web`, `backup-worker` y `backup-scheduler`.
No está diseñado para cambiar automáticamente entre desarrollo y producción,
cambiar de proyecto Compose, resolver conflictos Git o restaurar datos.

Puedes omitir el registro automático del comando en `install.sh` con
`BLOODKEEPER_SKIP_UPDATE_COMMAND=1`. Esta opción no omite ningún despliegue del
instalador; solo deja sin instalar el acceso global `bloodkeeper-update`.
