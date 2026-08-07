# Biblioteca de componentes

Documento operativo de SPEC-014.

La biblioteca sólo incorpora componentes cuando existe reutilización funcional
real. Una coincidencia visual o la cantidad de etiquetas HTML repetidas no es
suficiente para crear una abstracción.

## ViewStateStatus

`apps/web/src/components/ui/ViewStateStatus.tsx`

Primera primitiva incorporada por SPEC-014. Centraliza exclusivamente la
semántica accesible común de los estados pasivos `loading` y `empty`.

Consumidores iniciales reales:

- Dashboard.
- Crónicas.

API:

- `state`: `loading` o `empty`;
- `className`: clase visual opcional propiedad del consumidor;
- `children`: contenido presentado.

Responsabilidad compartida:

- `data-view-state`;
- `role="status"`;
- `aria-live="polite"`.

Responsabilidades que permanecen fuera:

- lógica de carga;
- gateways y peticiones;
- reintentos;
- estados `error`, `permission` y `content`;
- estilos propios de cada módulo.

La extracción no modifica los CSS de Dashboard ni Crónicas. Ambos consumidores
mantienen sus clases y variantes visuales.

## Elementos no generalizados

Este primer bloque no crea:

- `Button`;
- `Input`;
- `Card`;
- estados de error genéricos;
- componentes de permisos;
- componentes de contenido;
- diálogos;
- tablas;
- selectores.

`DotRating` continúa como primitiva compartida ya existente y no se reescribe.

Los componentes específicos de cada feature permanecen dentro de su módulo
hasta que exista una segunda reutilización funcional demostrable.

SPEC-016.A continúa suspendida.

<!-- SPEC-014-CLOSURE:START -->

## Cierre de SPEC-014

SPEC-014 queda cerrada el 2026-08-07.

La biblioteca compartida actual se mantiene deliberadamente pequeña:

- `DotRating`, reutilizado por múltiples consumidores reales.
- `ViewStateStatus`, reutilizado por Dashboard y Crónicas para `loading` y
  `empty`.

La ausencia de `Button`, `Input`, `Card` u otras familias genéricas es
intencionada: la SPEC exige necesidad real antes de abstraer. Las futuras
incorporaciones deberán demostrar reutilización funcional y mantener una API
clara y pequeña.

Validación de cierre:

- 29/29 tests focalizados;
- 1278/1278 tests web;
- typecheck y build correctos;
- workflow y `check.sh` correctos;
- validación manual/visual confirmada;
- servicios healthy;
- SPEC-016.A continúa suspendida.

<!-- SPEC-014-CLOSURE:END -->
