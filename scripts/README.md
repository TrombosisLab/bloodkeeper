# Scripts

Scripts reproducibles para instalación, desarrollo, validación,
despliegue y mantenimiento mediante SSH.

## Servidor y despliegue

| Script | Función |
|---|---|
| `bootstrap-server.sh` | Prepara Ubuntu y despliega la aplicación |
| `start.sh` | Inicia los servicios |
| `stop.sh` | Detiene los servicios sin borrar datos |
| `restart.sh` | Reinicia servicios y valida su salud |
| `status.sh` | Muestra estado completo, recursos, backups y versión |
| `check.sh` | Ejecuta los smoke tests operativos |
| `check-docker-architecture.sh` | Valida aislamiento, usuarios y persistencia Docker |
| `check-project-structure.sh` | Valida la estructura oficial del repositorio |
| `check-development-workflow.sh` | Valida el flujo oficial de desarrollo |
| `check-deployment.sh` | Valida el despliegue oficial de SPEC-006 |
| `logs.sh` | Consulta los registros de Docker Compose |
| `backup.sh` | Crea y verifica una copia PostgreSQL |
| `restore.sh` | Verifica o aplica una restauración segura |
| `backup-full.sh` | Crea el paquete completo de SPEC-007 |
| `restore-full.sh` | Verifica o extrae un paquete completo |
| `install-backup-schedule.sh` | Gestiona la tarea diaria de backup |
| `check-backup-recovery.sh` | Valida backup y recuperación de SPEC-007 |
| `check-system-monitoring.sh` | Valida la supervisión oficial de SPEC-008 |
| `prepare-update.sh` | Comprueba y prepara actualizaciones sin aplicarlas |
| `check-maintenance-operations.sh` | Valida el mantenimiento de SPEC-009 |
| `check-ui-design-system.sh` | Valida los fundamentos de SPEC-010.A |
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
