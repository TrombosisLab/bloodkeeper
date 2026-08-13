# Versionado y releases

## Alcance

Este documento materializa el contrato de versiones de SPEC-045.

No define publicación en un registry, despliegue automático ni rollback
operativo. Esas operaciones pertenecen al procedimiento de despliegue y a
SPEC-046.

## Versión estable

Las tres unidades versionadas del proyecto deben compartir la misma versión:

- `apps/api/package.json`
- `apps/web/package.json`
- `packages/character-rules/package.json`

Una entrega estable usa `MAJOR.MINOR.PATCH` y se identifica en Git mediante
`vMAJOR.MINOR.PATCH`.

Los tags históricos de hitos o auditorías pueden conservarse, pero no
sustituyen esta convención para releases estables.

## Validación

```bash
./scripts/dev/release-check.sh --version-only
./scripts/dev/release-check.sh --candidate v0.1.0
```

Después de crear una etiqueta estable:

```bash
./scripts/dev/release-check.sh --tag v0.1.0
```

El script no crea, mueve ni elimina etiquetas.

## Secuencia de una release estable

1. Actualizar API, Web y reglas a la misma versión `MAJOR.MINOR.PATCH`.
2. Ejecutar `./scripts/dev/check.sh`.
3. Corregir cualquier fallo antes de continuar.
4. Confirmar los cambios mediante el flujo Git normal.
5. Crear `vMAJOR.MINOR.PATCH` sobre el commit validado.
6. Ejecutar `./scripts/dev/release-check.sh --tag vMAJOR.MINOR.PATCH`.
7. Aplicar después el procedimiento operativo de actualización.

Crear el tag y hacer push son acciones explícitas; SPEC-045 no las automatiza.

## Releases con migraciones

Si una release cambia `apps/api/prisma/migrations`, las migraciones deben
permanecer versionadas en Git y la validación de desarrollo debe pasar,
incluido Prisma.

La referencia objetivo puede analizarse sin aplicar cambios:

```bash
./scripts/prepare-update.sh --check --target vMAJOR.MINOR.PATCH
```

Cuando corresponda preparar la actualización:

```bash
./scripts/prepare-update.sh \
  --prepare \
  --target vMAJOR.MINOR.PATCH \
  --confirm
```

Ese procedimiento crea y verifica una copia completa previa y genera un plan
con los cambios de migración y una estrategia de reversión. La aplicación de
la actualización y el rollback operativo pertenecen a SPEC-046.

Tras una actualización debe ejecutarse la validación operativa del proyecto,
incluido `./scripts/check.sh`.
