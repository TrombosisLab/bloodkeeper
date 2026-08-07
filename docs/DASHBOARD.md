# Dashboard

## SPEC-013 — primer bloque incremental

Este bloque materializa **Inicio** como pantalla inicial real de la aplicación.

Incluye:

- ubicación canónica `#/dashboard`;
- resolución de la entrada vacía y de ubicaciones desconocidas hacia Inicio;
- entrada **Inicio** en la navegación persistente;
- saludo con el nombre visible del usuario autenticado;
- acceso rápido a **Personajes**;
- acceso y resumen de **Crónicas** únicamente para usuarios con rol de narrador;
- reutilización de `ChronicleGateway.list()` sin duplicar la pantalla completa de
  Crónicas;
- estados de carga, vacío, contenido y error con reintento;
- diseño responsive integrado en `AppLayout`.

## Frontera de alcance

No existe todavía un listado de personajes. Por tanto, este bloque no muestra
personajes recientes o activos ni crea un endpoint nuevo para obtenerlos.

Tampoco incorpora:

- Actividad reciente, porque no existe una fuente funcional;
- Administración, porque no existe una pantalla o destino real;
- Dados, Configuración o Ayuda;
- componentes genéricos pertenecientes a SPEC-014;
- cambios en dominio de personajes, API, Prisma o persistencia.

SPEC-016.A continúa suspendida.

## Criterio de relevancia de Crónicas

El resumen muestra hasta tres crónicas. Prioriza las activas, después las que
están en preparación y finalmente las archivadas. Dentro de cada estado,
ordena por la actualización más reciente.

El acceso completo sigue perteneciendo al módulo **Crónicas**.

<!-- SPEC-013-CLOSURE:START -->
## Cierre de SPEC-013

SPEC-013 queda cerrada el 7 de agosto de 2026.

El dashboard queda establecido como pantalla inicial real de BloodKeeper. La
auditoría de cierre confirmó navegación, permisos, estados, adaptación
responsive y ausencia de duplicación de módulos.

Resultado consolidado:

- contratos focalizados: 47/47;
- web: 1272/1272;
- typecheck y build: correctos;
- workflow y `check.sh`: correctos;
- servicios: saludables;
- validación manual/visual: correcta.

Las áreas sin soporte funcional real continúan fuera del dashboard. No se
anticipa SPEC-014 y SPEC-016.A continúa suspendida.
<!-- SPEC-013-CLOSURE:END -->
