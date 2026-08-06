# SPEC-039 – DICE_HISTORY_AND_CONTEXT

## Información
| Campo | Valor |
|---|---|
| Código | SPEC-039 |
| Documento | DICE_HISTORY_AND_CONTEXT.md |
| Proyecto | Vampiro V5 Revolution |
| Versión | 1.0 |
| Estado | Aprobado |

## Propósito

Definir el historial de tiradas y su asociación contextual con usuarios, personajes, crónicas y sesiones.

## Objetivos

- Conservar tiradas relevantes sin alterar sus resultados históricos.
- Facilitar consulta durante y después de una sesión.
- Relacionar cada tirada con su contexto cuando exista.
- Mantener permisos y privacidad.
- Evitar que el historial se convierta en un sistema de auditoría innecesariamente complejo.

## Registro de tirada

Cuando una tirada deba persistirse, el registro podrá incluir:

- Identificador estable.
- Fecha y hora.
- Usuario que ejecutó la tirada.
- Personaje asociado cuando exista.
- Crónica asociada cuando exista.
- Sesión asociada cuando exista.
- Descripción breve o etiqueta opcional.
- Reserva utilizada.
- Modificadores.
- Dificultad.
- Dados individuales y sus tipos.
- Resultado interpretado.
- Metadatos técnicos mínimos necesarios.

## Inmutabilidad histórica

Una tirada completada no deberá recalcularse automáticamente cuando cambien:

- La ficha del personaje.
- El Hambre.
- Las reglas futuras.
- La dificultad original.
- Los modificadores.

El historial representa lo ocurrido en ese momento.

## Contexto opcional

No todas las tiradas necesitan todos los vínculos.

Se permitirán:

- Tiradas manuales sin personaje.
- Tiradas de personaje sin crónica.
- Tiradas dentro de crónica.
- Tiradas asociadas a una sesión.

Las relaciones deberán ser consistentes cuando se proporcionen.

## Historial de personaje

La ficha podrá mostrar tiradas recientes o acceder a un historial filtrado.

No deberá sobrecargar la vista principal.

## Historial de sesión

Una sesión podrá mostrar las tiradas asociadas en orden cronológico.

Esto permitirá reconstruir actividad relevante sin convertir cada tirada en un evento narrativo.

## Historial de crónica

La crónica podrá consultar tiradas según permisos y filtros.

No se requiere inicialmente analítica avanzada.

## Visibilidad

La visibilidad dependerá del contexto y permisos.

El sistema deberá estar preparado para reglas como:

- Tiradas públicas para participantes.
- Tiradas privadas del narrador.
- Tiradas visibles únicamente para quien las ejecutó y usuarios autorizados.

La primera versión podrá implementar un modelo más simple siempre que no cierre la arquitectura.

## Tiradas privadas

Cuando se incorporen, deberán marcarse explícitamente.

Ocultar visualmente una tirada no sustituirá la autorización en backend.

## Eliminación

Como principio, las tiradas históricas no se editarán.

La eliminación podrá permitirse únicamente cuando:

- Exista permiso.
- No comprometa requisitos funcionales.
- Se trate de datos de prueba o situaciones justificadas.

Para actividad real se preferirá preservar el historial.

## Rerolls y relaciones

Cuando una tirada derive de otra, el modelo podrá mantener una relación explícita.

Ejemplos:

- Repetición parcial.
- Repetición completa.
- Mecánicas específicas futuras.

No se sobrescribirá la tirada original.

## Rendimiento

El historial podrá crecer significativamente.

La persistencia deberá permitir:

- Paginación.
- Filtrado por contexto.
- Índices adecuados cuando el volumen lo justifique.

No se cargarán todas las tiradas de una crónica de una sola vez.

## Filtros

Cuando se implemente la interfaz, podrá filtrar por:

- Fecha.
- Personaje.
- Usuario.
- Sesión.
- Tipo o descripción.

Solo se añadirán filtros que aporten utilidad real.

## Presentación

Cada registro deberá mostrar de forma compacta:

- Quién tiró.
- Contexto.
- Reserva.
- Resultado.
- Momento.

El detalle permitirá consultar dados individuales y resultado especial.

## Auditoría

El historial de dados no sustituye a un log técnico de auditoría.

Los eventos administrativos o de seguridad se gestionarán en el módulo correspondiente.

## Retención

No se requiere inicialmente una política automática de purgado.

Si el volumen futuro lo exige, cualquier política deberá preservar coherencia con crónicas y sesiones.

## Exportación

La exportación de historiales no forma parte del alcance inicial.

La arquitectura no deberá impedirla.

## Pruebas

Se incluirán pruebas para:

- Persistencia.
- Inmutabilidad.
- Contextos opcionales.
- Relaciones.
- Permisos.
- Tiradas privadas cuando existan.
- Paginación.
- Filtros.
- Rerolls relacionados.

## Criterios de aceptación

- Tiradas históricas inmutables.
- Contexto flexible y consistente.
- Consulta por personaje, crónica y sesión.
- Permisos aplicados en backend.
- Paginación preparada para crecimiento.
- Resultados originales preservados.
