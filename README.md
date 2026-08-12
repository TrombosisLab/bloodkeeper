# Vampiro V5 Revolution

Plataforma web modular para la gestión de partidas de
Vampiro: La Mascarada V5.

## Entorno

- Ubuntu Server 24.04 LTS.
- Docker Engine y Docker Compose.
- React + Vite + TypeScript.
- NestJS + TypeScript.
- PostgreSQL + Prisma.
- Operación mediante SSH.

## Despliegue

```bash
./scripts/bootstrap-server.sh
```

Después del primer despliegue:

```bash
./scripts/create-initial-admin.sh
```

## Operación

```bash
./scripts/start.sh
./scripts/restart.sh --confirm
./scripts/status.sh
./scripts/check.sh
./scripts/logs.sh
./scripts/backup.sh
./scripts/prepare-update.sh --check --target HEAD
./scripts/stop.sh --confirm
```

## Documentación

- `docs/DEPLOYMENT.md`: instalación y despliegue.
- `docs/DOCKER_ARCHITECTURE.md`: arquitectura Docker oficial.
- `docs/PROJECT_STRUCTURE.md`: estructura oficial del repositorio.
- `docs/DEVELOPMENT_WORKFLOW.md`: flujo oficial de desarrollo.
- `docs/VALIDATION.md`: validación técnica y funcional.
- `docs/RECOVERY.md`: copias y recuperación.
- `docs/MAINTENANCE_OPERATIONS.md`: mantenimiento por SSH.
- `docs/UI_DESIGN_SYSTEM.md`: fundamentos visuales de SPEC-010.
- `scripts/README.md`: catálogo de scripts.

## Estado

Proyecto en desarrollo incremental. Cada bloque debe quedar funcional,
probado y documentado antes de continuar.
