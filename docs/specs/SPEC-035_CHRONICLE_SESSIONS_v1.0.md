# SPEC-035 – CHRONICLE_SESSIONS

## Información
| Campo | Valor |
|---|---|
| Código | SPEC-035 |
| Documento | CHRONICLE_SESSIONS.md |
| Proyecto | Vampiro V5 Revolution |
| Versión | 1.0 |
| Estado | Aprobado |

## Propósito

Definir la gestión de sesiones de juego dentro de una Crónica, incluyendo preparación, ejecución, resumen y relaciones con otros recursos narrativos.

## Objetivos

- Organizar las sesiones de una crónica.
- Facilitar la preparación del narrador.
- Registrar lo ocurrido sin obligar a una documentación excesiva.
- Relacionar sesiones con eventos, personajes, PNJ y localizaciones.
- Preparar integración futura con tiradas y actividad de juego.

## Entidad Sesión

Una sesión podrá incluir:

- Identificador estable.
- Crónica.
- Número o posición dentro de la crónica.
- Título opcional.
- Fecha real.
- Estado.
- Resumen.
- Notas privadas del narrador.
- Fechas técnicas.

## Estados

Como mínimo podrán contemplarse:

- Preparación.
- Completada.
- Archivada.

Solo se añadirán estados adicionales cuando exista una necesidad funcional real.

## Preparación

La vista de preparación podrá reunir accesos o referencias a:

- PNJ relevantes.
- Localizaciones.
- Eventos previstos.
- Personajes participantes.
- Notas del narrador.

No se duplicará el contenido original; se utilizarán relaciones o referencias.

## Durante la sesión

La arquitectura deberá permitir que la sesión actúe como contexto de actividad.

En el futuro podrá asociar:

- Tiradas.
- Cambios relevantes.
- Eventos ocurridos.
- Notas rápidas.

La primera versión no requiere automatización en tiempo real.

## Resumen

Una sesión completada podrá disponer de un resumen narrativo.

El resumen deberá diferenciarse de:

- Notas privadas.
- Eventos estructurados.
- Historial técnico.

## Participantes

La sesión podrá relacionarse con los participantes presentes cuando exista una necesidad funcional.

No se duplicarán usuarios ni personajes.

## Eventos

Los eventos podrán:

- Prepararse para una sesión.
- Marcarse como ocurridos durante ella.
- Crearse posteriormente a partir de lo sucedido.

La relación entre sesión y evento será explícita.

## PNJ y localizaciones

La sesión podrá relacionarse con PNJ y localizaciones relevantes para facilitar consulta y seguimiento.

## Integración con dados

El módulo de dados podrá asociar tiradas a una sesión activa.

Esto permitirá posteriormente:

- Historial de tiradas por sesión.
- Consulta contextual.
- Estadísticas si se aprueban en el futuro.

El módulo de sesiones no implementará el motor de dados.

## Sesión activa

La arquitectura podrá permitir marcar una sesión como activa.

No se asumirá inicialmente colaboración en tiempo real ni sincronización compleja.

## Visibilidad

Podrá diferenciarse entre:

- Información privada del narrador.
- Resumen compartido.
- Información estructurada con permisos propios.

Toda autorización se validará en backend.

## Numeración

La numeración deberá ser flexible.

No se dependerá exclusivamente del número como identificador.

El sistema deberá soportar sesiones especiales o interludios si se necesitan.

## Archivado

Archivar una sesión:

- No eliminará eventos.
- No eliminará tiradas.
- No romperá relaciones.
- La retirará del flujo habitual.

## Persistencia

Las relaciones con otros recursos serán explícitas cuando necesiten consulta o funcionalidad.

No se copiarán descripciones completas dentro de la sesión por comodidad.

## Pruebas

Se incluirán pruebas para:

- Creación.
- Estados.
- Numeración.
- Relaciones.
- Finalización.
- Archivado.
- Permisos.
- Integridad histórica.

## Criterios de aceptación

- Sesiones organizadas por crónica.
- Preparación sencilla.
- Resumen diferenciado de notas privadas.
- Relaciones sin duplicación.
- Preparado para integración con dados.
- Archivado sin pérdida de historial.
