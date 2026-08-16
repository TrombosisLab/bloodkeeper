# Vampiro V5 Revolution

Plataforma web modular para la gestión de partidas de
Vampiro: La Mascarada V5.

## Distribución portátil

- Docker Engine o Docker Desktop con Docker Compose.
- Imágenes release para `linux/amd64` y `linux/arm64`.
- Sin dependencia de Ubuntu, ruta personal o IP fija.

Instalación desde el repositorio privado:

```bash
git clone https://github.com/TrombosisLab/bloodkeeper.git && cd bloodkeeper && ./install.sh
```

La guía completa está en `docs/PORTABLE_INSTALLATION.md`.

## Desarrollo y adaptadores heredados

`compose.yaml` y `scripts/bootstrap-server.sh` se conservan para el flujo
source-build y la preparación opcional de Ubuntu. La distribución usa
`compose.deploy.yaml`, `install.sh` y `scripts/portable-compose.sh`.

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

- `docs/PORTABLE_INSTALLATION.md`: instalación desde GitHub y GHCR.
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
