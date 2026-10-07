# Cambiar la contraseña de PostgreSQL

Herramienta de consola para Ubuntu con Docker Compose v2 y Python 3. No necesita
instalar módulos de Python. Primera validación prevista en la máquina 84.

No cambia contraseñas de usuarios de BloodKeeper: cambia el usuario de PostgreSQL
que utiliza la aplicación. No modifica el túnel de Cloudflare, Git ni los datos.

## Antes de usarla

Ejecutar desde el repositorio, en una ventana de mantenimiento. Evitar despliegues,
`bloodkeeper-update`, restauraciones y copias manuales simultáneas. Esperar a que
termine cualquier backup que esté en curso. El bloqueo del script solo impide dos
rotaciones simultáneas; no bloquea otras herramientas.

Requiere `.env` no seguido por Git y del mismo propietario que el repositorio,
compose.yaml sin overrides, PostgreSQL, API y
backup-worker en ejecución. El usuario PostgreSQL debe poder consultar pg_authid
y cambiar su contraseña por la conexión local del contenedor. El script se detiene
si los consumidores de credenciales no coinciden con la configuración soportada.

Solo comprobar (no cambia credenciales, archivos o servicios):

```bash
sudo bash scripts/change-database-password.sh --repo "$PWD" --check
```

Ejecutar el cambio:

```bash
sudo bash scripts/change-database-password.sh --repo "$PWD"
```

La contraseña se escribe de forma VISIBLE, se solicita dos veces y se confirma con
`CAMBIAR`. No queda en el historial de comandos, pero sí puede aparecer en una
grabación de terminal, captura de pantalla o scrollback. No compartas esa salida.

Se admiten entre 16 y 128 caracteres ASCII: letras, números y los símbolos
`_ @ % + = : , . ! ? / $ # & * ( ) { } [ ] < > ; | ~ -`.
No se admiten espacios, comillas, barra invertida ni caracteres Unicode.
DATABASE_URL usa codificación porcentual; los valores nuevos de .env se escriben
con comillas simples para impedir interpolación de `$` y comentarios por `#`.
La configuración resuelta por Compose se vuelve a comprobar antes de cambiar nada.

## Qué hace

1. Comprueba configuración, autenticación TCP de PostgreSQL y del trabajador de
   backups, y estado healthy de la API. No imprime credenciales ni config resuelta.
2. Guarda .env, el verificador anterior del rol y un pg_dump en formato custom.
   Comprueba que pg_restore puede leer el índice (no equivale a ensayar restauración).
3. Detiene API y backup-worker; guarda la contraseña como SCRAM-SHA-256 en PostgreSQL.
   El texto de la contraseña no se incluye en argumentos de procesos ni SQL.
4. Actualiza de forma atómica POSTGRES_PASSWORD y DATABASE_URL en .env, conservando
   propietario y fijando permisos 0600. Deja el resto de claves intacto.
5. Recrea PostgreSQL para actualizar también su entorno y después API y worker,
   usando imágenes existentes: no compila, no descarga y no elimina volúmenes.
6. Comprueba estados healthy y autenticación del worker con su entorno instalado.

Hay una interrupción del servicio. Web y backup-scheduler no se recrean; el
programador puede dejar solicitudes pendientes hasta que regrese el worker.
No se provoca una copia real del worker como prueba; se verifica su conexión.

## Copias y recuperación

Las copias están fuera del repositorio:

```text
<directorio-padre>/<nombre-repositorio>_backups/credential-rotations/rotation-.../
```

La carpeta es privada de root (0700), con archivos 0600. Contiene contraseña
ANTERIOR en environment.env y datos en database.dump. Nunca publicar, adjuntar
ni subir a Git. El archivo temporal candidate.env contiene la contraseña nueva;
se elimina al terminar la operación o una recuperación automática, salvo apagado
brusco/SIGKILL. Los informes solo contienen resultados, nunca credenciales.

Un fallo después de iniciar la transición intenta volver al verificador anterior,
al .env anterior y recrear los servicios. No restaura datos de la base de datos.
Si esa recuperación falla, o se corta la corriente, se conserva la carpeta.

Para recuperar las credenciales antiguas de una copia, con PostgreSQL disponible:

```bash
sudo bash scripts/change-database-password.sh --repo "$PWD" \
  --recover /ruta/indicada/rotation-XXXXXXXX
```

Exige confirmar `RECUPERAR`. Detiene API y worker, restaura exclusivamente las
credenciales y recrea PostgreSQL/API/worker. No ejecuta pg_restore sobre los datos.
No ejecutar una recuperación antigua después de otros cambios de configuración:
environment.env restaura el archivo completo de aquel momento.

Si PostgreSQL no arranca o no acepta conexión local, la herramienta no puede
recuperarse sola: conservar el informe y las copias y revisar el fallo. Ninguna
herramienta puede garantizar recuperación automática ante falta de disco, pérdida
del host o volúmenes dañados.

## Pruebas sin acceso a la base de datos

```bash
python3 scripts/tests/change-database-password.test.py
bash -n scripts/change-database-password.sh
```

Las pruebas cubren formato SCRAM, codificación de URL, configuración inconsistente,
preservación de .env, ausencia de contraseñas en errores y transacciones simuladas
con fallo de despliegue, fallo de autenticación y fallo de recuperación. La primera
prueba real en la 84 sigue siendo necesaria antes de utilizarlo en la 118.

Referencias:
- https://www.postgresql.org/docs/17/catalog-pg-authid.html
- https://www.postgresql.org/docs/17/auth-password.html
- https://docs.docker.com/compose/how-tos/environment-variables/variable-interpolation/
