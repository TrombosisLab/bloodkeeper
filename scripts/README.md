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
| `check-docker-architecture.sh` | Valida aislamiento, usuarios y persistencia Docker |
| `check-project-structure.sh` | Valida la estructura oficial del repositorio |
| `check-development-workflow.sh` | Valida el flujo oficial de desarrollo |
| `logs.sh` | Consulta los registros de Docker Compose |
| `backup.sh` | Crea y verifica una copia PostgreSQL |
| `restore.sh` | Verifica o aplica una restauración segura |
| `create-initial-admin.sh` | Crea la primera cuenta administrativa |

## Desarrollo

Los scripts de `scripts/dev/` constituyen la automatización oficial del
incremento y ejecutan Node exclusivamente dentro de Docker mediante
`npm`.

| Script | Función |
|---|---|
| `dev/typecheck.sh` | Comprueba TypeScript en API y web |
| `dev/test.sh` | Ejecuta pruebas web, API e integración |
| `dev/build.sh` | Valida Prisma y construye API y web |
| `dev/check.sh` | Ejecuta la validación estándar completa |

El procedimiento y las evidencias de cierre están documentados en
`docs/DEVELOPMENT_WORKFLOW.md`.

## Reglas

- Ejecutar desde una sesión SSH normal.
- No editar archivos manualmente durante un despliegue.
- No usar `docker compose down --volumes` en operación habitual.
- Validar después de cada cambio.
