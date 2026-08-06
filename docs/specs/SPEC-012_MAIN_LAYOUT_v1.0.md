# SPEC-012 – MAIN_LAYOUT

**Estado:** Cerrada (2026-08-07)

## Información
| Campo | Valor |
|---|---|
| Código | SPEC-012 |
| Documento | MAIN_LAYOUT.md |
| Proyecto | Vampiro V5 Revolution |
| Versión | 1.0 |
| Estado | Aprobado |

## Propósito
Definir la estructura visual común de la aplicación.

## Estructura
La interfaz dispondrá de:
- Navegación principal persistente.
- Cabecera contextual cuando sea necesaria.
- Área principal de contenido.
- Sistema uniforme de mensajes y estados.
- Zona secundaria solo cuando aporte valor.

## Principios
- Priorizar espacio útil.
- Evitar elementos decorativos que dificulten el uso.
- Mantener coherencia entre módulos.
- No duplicar navegación.
- Las funciones habituales deberán estar visibles o a un máximo de dos acciones.

## Escritorio
La navegación podrá mostrarse lateralmente y el contenido aprovechará el espacio restante.

## Tablet y móvil
La navegación será colapsable. El contenido se reorganizará sin perder funcionalidad y se evitará el desplazamiento horizontal salvo en componentes donde sea imprescindible.

## Estados
Todas las vistas deberán contemplar:
- Cargando.
- Vacío.
- Error.
- Sin permisos.
- Contenido disponible.

## Criterios de aceptación
- Layout reutilizable.
- Navegación coherente.
- Responsive.
- Sin duplicación estructural entre módulos.

<!-- SPEC-012-CLOSURE:START -->
## Acta de cierre

SPEC-012 queda cerrada el 7 de agosto de 2026.

Implementación consolidada:

- `a8c0a8f` — `feat(layout): add reusable application layout`;
- `b636c28` — `feat(layout): standardize reachable view states`.

Validación de cierre:

- contrato de layout: 8/8;
- contrato de estados: 10/10;
- contratos SPEC-011: 16/16;
- suite web: 1262/1262;
- API unitaria: 265/265;
- integración API: 9/9;
- typecheck, builds, Prisma, sistema de diseño y workflow correctos;
- validación visual manual confirmada;
- máximo simultáneo de landmarks `<main>`: 1;
- repositorio limpio y sin regresiones detectadas.

Fronteras preservadas:

- SPEC-013 no se inicia automáticamente;
- SPEC-014 no se inicia automáticamente;
- SPEC-016.A continúa suspendida;
- no se añaden rutas, destinos, acciones o módulos ficticios.
<!-- SPEC-012-CLOSURE:END -->
