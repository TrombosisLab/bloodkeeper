# SPEC-031 – CHRONICLE_PARTICIPANTS_AND_CHARACTERS

## Información
| Campo | Valor |
|---|---|
| Código | SPEC-031 |
| Documento | CHRONICLE_PARTICIPANTS_AND_CHARACTERS.md |
| Proyecto | Vampiro V5 Revolution |
| Versión | 1.0 |
| Estado | Aprobado |

## Propósito

Definir cómo una Crónica gestiona participantes, narradores, jugadores y personajes asociados, manteniendo permisos y relaciones claras.

## Objetivos

- Gestionar participantes sin duplicar usuarios.
- Asociar personajes a una crónica de forma controlada.
- Diferenciar responsabilidades de narradores y jugadores.
- Preservar relaciones históricas.
- Preparar el módulo para múltiples narradores y cambios de participantes.

## Participación

La pertenencia de un usuario a una crónica deberá modelarse mediante una relación explícita.

La relación podrá contener:

- Usuario.
- Crónica.
- Rol dentro de la crónica.
- Estado de participación.
- Fechas técnicas necesarias.

No se utilizará únicamente el rol global del usuario para determinar sus capacidades dentro de una crónica.

## Roles dentro de una crónica

Como mínimo se contemplarán:

### Narrador

Gestiona la crónica y la información para la que tenga autorización.

### Jugador

Participa en la crónica y accede a la información compartida o autorizada.

La arquitectura permitirá incorporar otros roles contextuales solo cuando exista una necesidad real.

## Narradores múltiples

El modelo deberá permitir más de un narrador por crónica, aunque la primera versión pueda utilizar uno solo.

No se diseñará la base de datos de forma que impida esta evolución.

## Invitación o incorporación

La primera implementación podrá utilizar incorporación administrativa simple.

La arquitectura permitirá evolucionar hacia:

- Invitaciones.
- Códigos de acceso.
- Solicitudes de participación.

No se implementarán estos mecanismos hasta que sean necesarios.

## Estados de participación

Podrán contemplarse estados como:

- Activo.
- Retirado.

Los estados adicionales solo se incorporarán si existe funcionalidad que los utilice.

Retirar a un participante no deberá borrar su contribución histórica.

## Asociación de personajes

Un personaje podrá asociarse explícitamente a una crónica.

La relación deberá permitir identificar:

- Personaje.
- Crónica.
- Propietario o jugador responsable.
- Estado dentro de la crónica cuando sea necesario.

## Personajes de jugadores

Como principio:

- Un jugador solo gestionará personajes para los que tenga autorización.
- La asociación a una crónica no transferirá automáticamente propiedad.
- El narrador podrá disponer de capacidades adicionales definidas por permisos.

## Personajes sin crónica

El sistema deberá permitir personajes independientes cuando el flujo funcional lo requiera.

La creación de un personaje no deberá depender obligatoriamente de crear primero una crónica.

## Cambio de crónica

Mover un personaje entre crónicas no deberá realizarse como una simple modificación silenciosa si existen datos históricos asociados.

Cuando esta función se implemente deberá preservar integridad y solicitar confirmación adecuada.

## Personajes retirados

Un personaje podrá dejar de participar activamente sin eliminarse.

La retirada deberá preservar:

- Historial.
- Tiradas asociadas cuando existan.
- Eventos.
- Relaciones narrativas.

## Visibilidad

La pertenencia a una crónica no implicará acceso automático a todas las fichas.

La visibilidad podrá depender de:

- Propiedad.
- Rol contextual.
- Configuración de la crónica.
- Permisos específicos futuros.

La autorización siempre se comprobará en backend.

## Listado de participantes

La interfaz de crónica permitirá consultar de forma clara:

- Narradores.
- Jugadores.
- Personajes asociados.
- Estado cuando sea relevante.

Las acciones disponibles dependerán de permisos.

## Eliminación de participantes

Retirar un usuario de una crónica:

- No eliminará su cuenta.
- No eliminará automáticamente sus personajes.
- No destruirá historial.
- Deberá resolver explícitamente cualquier relación activa que requiera decisión.

## Integridad

No se permitirán:

- Relaciones duplicadas incompatibles.
- Personajes asociados de forma inconsistente.
- Participantes sin referencias válidas.
- Operaciones que rompan relaciones históricas.

## Persistencia

Las relaciones se modelarán mediante entidades o tablas explícitas cuando necesiten estado o metadatos.

No se duplicarán datos de usuario o personaje dentro de la crónica.

## Pruebas

Se incluirán pruebas para:

- Incorporación de participantes.
- Roles contextuales.
- Asociación de personajes.
- Retirada.
- Permisos.
- Duplicados.
- Integridad histórica.
- Personajes independientes.

## Criterios de aceptación

- Participantes gestionados mediante relaciones explícitas.
- Roles globales y contextuales correctamente diferenciados.
- Personajes asociados sin duplicación.
- Retirada sin pérdida de historial.
- Preparado para múltiples narradores.
- Permisos comprobados en backend.
