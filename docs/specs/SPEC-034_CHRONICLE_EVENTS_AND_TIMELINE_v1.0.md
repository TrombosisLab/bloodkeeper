# SPEC-034 – CHRONICLE_EVENTS_AND_TIMELINE

## Información
| Campo | Valor |
|---|---|
| Código | SPEC-034 |
| Documento | CHRONICLE_EVENTS_AND_TIMELINE.md |
| Proyecto | Vampiro V5 Revolution |
| Versión | 1.0 |
| Estado | Aprobado |

## Propósito

Definir la gestión de eventos narrativos y su organización cronológica dentro de una Crónica.

## Objetivos

- Registrar acontecimientos relevantes.
- Construir una cronología coherente.
- Relacionar eventos con recursos de la crónica.
- Facilitar preparación y consulta.
- Diferenciar tiempo narrativo y fecha real cuando sea necesario.

## Entidad Evento

Un evento podrá incluir:

- Identificador estable.
- Crónica.
- Título.
- Descripción.
- Fecha o referencia temporal narrativa.
- Fecha real cuando corresponda.
- Estado.
- Información reservada.
- Fechas técnicas.

## Tipos de tiempo

El sistema deberá permitir trabajar sin obligar a todas las crónicas a utilizar fechas exactas.

Un evento podrá utilizar:

- Fecha narrativa exacta.
- Fecha parcial.
- Orden relativo.
- Referencia textual controlada cuando no exista fecha concreta.

La primera implementación podrá priorizar un modelo sencillo.

## Línea temporal

La línea temporal será una representación ordenada de eventos.

Deberá permitir:

- Orden cronológico.
- Consulta rápida.
- Acceso al detalle.
- Filtrado cuando el volumen lo justifique.

No se requiere inicialmente una visualización gráfica compleja.

## Relaciones

Los eventos podrán relacionarse con:

- Personajes.
- PNJ.
- Localizaciones.
- Sesiones.
- Otros recursos futuros.

Las relaciones deberán implementarse únicamente cuando aporten funcionalidad concreta.

## Eventos planificados y ocurridos

La arquitectura podrá diferenciar:

- Eventos previstos o preparados.
- Eventos ocurridos.

Esta distinción no deberá complicar la primera implementación si todavía no se utiliza.

## Información reservada

Un evento podrá contener información exclusiva del narrador.

La arquitectura permitirá compartir posteriormente partes concretas cuando exista una especificación de visibilidad.

## Edición

Los narradores autorizados podrán:

- Crear.
- Editar.
- Reordenar cuando el modelo temporal lo permita.
- Archivar o eliminar según integridad.

Los cambios relevantes no deberán romper relaciones existentes.

## Integración con sesiones

Cuando se implemente el módulo de sesiones, un evento podrá:

- Haber ocurrido durante una sesión.
- Haber sido preparado para una sesión.
- Relacionarse con un resumen.

No se duplicará el mismo contenido innecesariamente.

## Integración con personajes

Los eventos podrán formar parte del historial narrativo de un personaje mediante relaciones.

No se copiará el evento completo dentro de cada ficha.

## Estados

Podrán utilizarse estados mínimos como:

- Planificado.
- Ocurrido.
- Archivado.

Solo se incorporarán cuando exista funcionalidad que los utilice.

## Persistencia

Los eventos pertenecerán explícitamente a una crónica.

El orden temporal deberá ser reproducible y consistente.

## Eliminación

Se preferirá archivado cuando existan relaciones históricas.

La eliminación definitiva requerirá comprobar dependencias.

## Permisos

- Narradores autorizados gestionan eventos.
- Jugadores acceden únicamente a información compartida.
- Toda autorización se valida en backend.

## Pruebas

Se incluirán pruebas para:

- Creación.
- Orden temporal.
- Fechas opcionales.
- Relaciones.
- Estados.
- Archivado.
- Visibilidad.
- Permisos.

## Criterios de aceptación

- Eventos fáciles de registrar.
- Cronología consistente.
- Fechas exactas no obligatorias.
- Relaciones con recursos sin duplicación.
- Información reservada protegida.
- Línea temporal útil sin complejidad visual prematura.
