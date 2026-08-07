# SPEC-013 – DASHBOARD

## Información
| Campo | Valor |
|---|---|
| Código | SPEC-013 |
| Documento | DASHBOARD.md |
| Proyecto | Vampiro V5 Revolution |
| Versión | 1.0 |
| Estado | Cerrada (2026-08-07) |

## Propósito
Definir la pantalla inicial de la aplicación como punto de acceso rápido a la información y acciones relevantes.

## Principios
- Información útil antes que decoración.
- Contenido adaptado al rol del usuario.
- Acceso rápido a módulos principales.
- Evitar saturación visual.

## Contenido previsto
Según permisos y disponibilidad:
- Personajes recientes o activos.
- Crónicas relevantes.
- Accesos rápidos.
- Actividad reciente cuando exista.
- Estado o avisos importantes.
- Acceso a administración para usuarios autorizados.

## Comportamiento
El dashboard no duplicará pantallas completas de otros módulos. Mostrará resúmenes y accesos.

Los bloques sin información deberán mostrar estados vacíos claros o no mostrarse cuando carezcan de utilidad.

## Evolución
Los widgets o bloques adicionales se incorporarán únicamente cuando exista una necesidad funcional real.

## Criterios de aceptación
- Carga clara y rápida.
- Información relevante según usuario.
- Accesos principales visibles.
- Diseño responsive.
- Sin información redundante.

<!-- SPEC-013-CLOSURE:START -->
## Acta de cierre

SPEC-013 queda cerrada el 7 de agosto de 2026.

Implementación consolidada:

- Inicio materializado como pantalla inicial real mediante `#/dashboard`;
- navegación persistente con Inicio, Personajes y Crónicas según permisos;
- saludo adaptado al usuario autenticado;
- acceso real a Personajes sin simular un listado inexistente;
- resumen de hasta tres Crónicas relevantes para narradores;
- estados `loading`, `empty`, `content` y `error` con reintento;
- integración dentro de `AppLayout` sin duplicar landmarks `<main>`;
- diseño responsive con los tokens ya existentes.

Validación de cierre:

- contratos focalizados: 47/47;
- suite web completa: 1272/1272;
- typecheck y build web correctos;
- workflow y `check.sh` correctos;
- Web, API y PostgreSQL saludables;
- host y runtime sincronizados;
- validación manual y visual confirmada en escritorio, tablet y móvil.

Fronteras preservadas:

- no se crea un listado o endpoint nuevo de Personajes;
- Actividad reciente permanece fuera por no existir una fuente funcional;
- Administración permanece fuera por no existir un destino real;
- no se crean Dados, Configuración ni Ayuda;
- SPEC-014 no se anticipa;
- SPEC-016.A continúa suspendida.
<!-- SPEC-013-CLOSURE:END -->
