# SPEC-012 – MAIN_LAYOUT

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
