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
./scripts/status.sh
./scripts/check.sh
./scripts/status.sh
./scripts/logs.sh
./scripts/backup.sh
./scripts/stop.sh
```

## Documentación

- `docs/DEPLOYMENT.md`: instalación y despliegue.
- `docs/VALIDATION.md`: validación técnica y funcional.
- `docs/RECOVERY.md`: copias y recuperación.
- `scripts/README.md`: catálogo de scripts.

## Estado

Proyecto en desarrollo incremental. Cada bloque debe quedar funcional,
probado y documentado antes de continuar.
