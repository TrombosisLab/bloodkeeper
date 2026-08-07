# SPEC-014 – COMPONENT_LIBRARY

## Información
| Campo | Valor |
|---|---|
| Código | SPEC-014 |
| Documento | COMPONENT_LIBRARY.md |
| Proyecto | Vampiro V5 Revolution |
| Versión | 1.0 |
| Estado | Cerrada (2026-08-07) |

## Propósito
Definir criterios para los componentes reutilizables de interfaz y evitar duplicación, inconsistencias y código difícil de mantener.

## Componentes base
La aplicación podrá disponer, cuando sean necesarios, de:
- Botones.
- Campos y controles de formulario.
- Selectores.
- Tarjetas.
- Tablas y listas.
- Pestañas.
- Indicadores de estado.
- Alertas y notificaciones.
- Diálogos de confirmación.
- Controles de puntuación visual.
- Estados vacíos y de carga.

## Reglas
- No crear componentes genéricos sin necesidad real.
- Reutilizar antes de duplicar.
- Mantener una API clara y pequeña.
- Separar presentación y lógica cuando sea razonable.
- Evitar componentes excesivamente grandes.
- Los componentes específicos de un módulo permanecerán en ese módulo salvo reutilización real.

## Accesibilidad
Los componentes interactivos deberán soportar teclado, foco visible, etiquetas comprensibles y estados claros.

## Consistencia
Variantes visuales y comportamientos deberán estar centralizados para evitar implementaciones diferentes de una misma función.

## Criterios de aceptación
- Componentes reutilizables donde aporten valor.
- Sin duplicación innecesaria.
- Comportamiento consistente.
- Responsive y accesible.
- Organización modular.

<!-- SPEC-014-CLOSURE:START -->

## Acta de cierre — 2026-08-07

SPEC-014 queda cerrada con una biblioteca de componentes guiada por
reutilización funcional real, sin materializar familias genéricas por
adelantado.

### Reutilización consolidada

- `DotRating` permanece como control visual compartido ya existente y cuenta
  con múltiples consumidores reales.
- `ViewStateStatus` centraliza exclusivamente la semántica accesible común de
  los estados pasivos `loading` y `empty`.
- `ViewStateStatus` tiene dos consumidores reales: Dashboard y Crónicas.
- La API compartida se limita a `state`, `className` y `children`.
- `role="status"`, `aria-live="polite"` y `data-view-state` quedan
  centralizados para esos estados.

### Fronteras preservadas

- `error`, `permission` y `content` permanecen bajo responsabilidad de cada
  módulo.
- Reintentos, gateways, peticiones y lógica de carga no forman parte de la
  primitiva compartida.
- Los estilos continúan siendo locales a Dashboard y Crónicas.
- No se crean `Button`, `Input`, `Card`, tablas, diálogos ni otras familias
  genéricas sin una necesidad funcional demostrada.
- Los componentes específicos permanecen dentro de su feature salvo
  reutilización real.

### Validación

- Auditoría inicial y auditoría focalizada realizadas antes de implementar.
- Validación manual/visual confirmada por el usuario el 2026-08-07.
- Tests focalizados: 29/29.
- Suite web completa: 1278/1278.
- Typecheck web correcto.
- Build web correcto.
- `check-development-workflow.sh` correcto.
- `check.sh` correcto.
- Web, API y PostgreSQL healthy.
- Host y runtime sincronizados.
- No queda otra abstracción obligatoria demostrada por las auditorías de
  SPEC-014.

### Continuidad

- SPEC-016.A continúa suspendida y no se reanuda mediante este cierre.
- Este cierre no inicia ninguna SPEC posterior.
- No se realiza push automático.

<!-- SPEC-014-CLOSURE:END -->
