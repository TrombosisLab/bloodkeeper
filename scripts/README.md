# Scripts

Scripts reproducibles para instalación, desarrollo, validación,
despliegue y mantenimiento mediante SSH.

## Servidor y despliegue

| Script | Función |
|---|---|
| `bootstrap-server.sh` | Prepara Ubuntu y despliega la aplicación |
| `start.sh` | Inicia los servicios |
| `stop.sh` | Detiene los servicios sin borrar datos |
| `status.sh` | Muestra estado, API y disco |
| `check.sh` | Ejecuta los smoke tests operativos |
| `logs.sh` | Consulta los registros de Docker Compose |
| `backup.sh` | Crea y verifica una copia PostgreSQL |
| `restore.sh` | Verifica o aplica una restauración segura |
| `create-initial-admin.sh` | Crea la primera cuenta administrativa |

## Desarrollo

Los scripts de `scripts/dev/` conservan su finalidad histórica. El
repositorio actual usa `npm`; las validaciones oficiales deben
ejecutarse dentro de los contenedores con los comandos documentados en
`docs/VALIDATION.md`.

## Reglas

- Ejecutar desde una sesión SSH normal.
- No editar archivos manualmente durante un despliegue.
- No usar `docker compose down --volumes` en operación habitual.
- Validar después de cada cambio.
