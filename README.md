# Vampiro V5 Revolution

Plataforma web modular para la gestión de partidas de
Vampiro: La Mascarada V5.

## Distribución portátil

- Docker Engine o Docker Desktop con Docker Compose; `install.sh` puede
  preparar automáticamente Ubuntu 24.04 después de pedir autorización.
- Construcción local de imágenes release para la arquitectura Docker
  del host.
- Sin dependencia de Ubuntu, ruta personal o IP fija.

Instalación desde el repositorio público:

```bash
git clone https://github.com/TrombosisLab/bloodkeeper.git && cd bloodkeeper && ./install.sh
```

La guía completa está en `docs/PORTABLE_INSTALLATION.md`.

## Desarrollo y adaptadores heredados

`compose.yaml` se conserva para desarrollo. La distribución construye
localmente los Dockerfiles release mediante `compose.deploy.yaml`,
`install.sh` y `scripts/portable-compose.sh`.

## Operación source-build heredada

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

- `docs/PORTABLE_INSTALLATION.md`: instalación pública y construcción local.
- `docs/DEPLOYMENT.md`: instalación y despliegue.
- `docs/DOCKER_ARCHITECTURE.md`: arquitectura Docker oficial.
- `docs/PROJECT_STRUCTURE.md`: estructura oficial del repositorio.
- `docs/DEVELOPMENT_WORKFLOW.md`: flujo oficial de desarrollo.
- `docs/VALIDATION.md`: validación técnica y funcional.
- `docs/RECOVERY.md`: copias y recuperación.
- `docs/MAINTENANCE_OPERATIONS.md`: mantenimiento por SSH.
- `docs/UI_DESIGN_SYSTEM.md`: fundamentos visuales de SPEC-010.
- `docs/USER_MANUAL.md`: manual de usuario basado en funciones reales.
- `docs/ADMINISTRATOR_MANUAL.md`: manual de administración Web y SSH.
- `scripts/README.md`: catálogo de scripts.

## Estado

Proyecto en desarrollo incremental. Cada bloque debe quedar funcional,
probado y documentado antes de continuar.
