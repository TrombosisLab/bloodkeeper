# SPEC-030 – CHRONICLE_MODULE

## Información
| Campo | Valor |
|---|---|
| Código | SPEC-030 |
| Documento | CHRONICLE_MODULE.md |
| Proyecto | Vampiro V5 Revolution |
| Versión | 1.0 |
| Estado | Aprobado |

## Propósito

Definir la arquitectura funcional general del módulo de Crónicas de Vampiro V5 Revolution.

## Objetivos

- Centralizar la gestión de una campaña o crónica.
- Relacionar narradores, jugadores, personajes y recursos narrativos.
- Facilitar preparación, seguimiento y consulta.
- Separar información pública, compartida y reservada cuando sea necesario.
- Mantener una arquitectura modular que pueda crecer progresivamente.

## Entidad Crónica

Cada crónica dispondrá, como mínimo, de:

- Identificador estable.
- Nombre.
- Descripción o premisa breve.
- Estado.
- Narrador o responsables.
- Fechas técnicas necesarias.

Los campos adicionales se incorporarán solo cuando exista una necesidad funcional.

## Estados

La arquitectura contemplará como mínimo:

- Preparación.
- Activa.
- Archivada.

Las transiciones serán explícitas y sujetas a permisos.

## Participantes

Una crónica podrá relacionarse con:

- Uno o varios narradores cuando se habilite.
- Jugadores.
- Personajes.

La pertenencia a una crónica no otorgará automáticamente acceso a toda su información.

## Personajes

Los personajes podrán asociarse a una crónica.

El sistema deberá distinguir, cuando sea necesario:

- Personajes de jugadores.
- Personajes no jugadores.
- Personajes archivados o retirados.

No se duplicarán fichas completas dentro del módulo de crónicas.

## Panel de crónica

La crónica dispondrá de una vista principal con acceso a información relevante, como:

- Resumen.
- Participantes.
- Personajes.
- PNJ.
- Localizaciones.
- Eventos.
- Línea temporal.
- Notas o recursos cuando se incorporen.

La interfaz no deberá mostrar todas las áreas simultáneamente si perjudica la claridad.

## PNJ

Los personajes no jugadores se integrarán mediante una estructura adecuada al nivel de detalle necesario.

La arquitectura deberá permitir desde PNJ simples hasta personajes con ficha más completa sin duplicar innecesariamente el modelo de personaje.

## Localizaciones

Las crónicas podrán gestionar localizaciones relevantes.

Cada localización podrá disponer de:

- Nombre.
- Descripción.
- Relaciones con otros recursos.
- Información de visibilidad controlada cuando sea necesaria.

No se implementará inicialmente un sistema cartográfico complejo salvo especificación posterior.

## Eventos

Los eventos representarán hechos relevantes de la crónica.

Podrán relacionarse con:

- Sesiones.
- Personajes.
- PNJ.
- Localizaciones.
- Fechas narrativas o reales cuando corresponda.

## Línea temporal

La arquitectura permitirá ordenar y consultar eventos cronológicamente.

No se requiere inicialmente una visualización gráfica avanzada.

## Sesiones

El modelo deberá estar preparado para incorporar sesiones de juego con información como:

- Número o título.
- Fecha.
- Resumen.
- Notas.
- Eventos asociados.

La especificación detallada se realizará cuando se implemente esta funcionalidad.

## Información narrativa y visibilidad

El sistema deberá poder evolucionar hacia distintos niveles de visibilidad:

- Narrador.
- Jugadores de la crónica.
- Usuario concreto cuando exista una necesidad real.

No se añadirá un sistema excesivamente granular antes de necesitarlo.

## Permisos

Como principio:

- Narradores autorizados gestionan la crónica.
- Jugadores acceden únicamente a información permitida.
- Administración técnica no sustituye las reglas funcionales de visibilidad.

Toda autorización se validará en backend.

## Relaciones

Las relaciones entre recursos serán explícitas.

Se evitarán campos de texto como sustituto de relaciones estructuradas cuando estas sean necesarias para funcionalidad.

## Archivado

Archivar una crónica:

- No eliminará personajes.
- No eliminará eventos.
- No romperá relaciones históricas.
- La retirará del flujo habitual.

## Integración con dados

Las tiradas podrán asociarse en el futuro a:

- Crónica.
- Sesión.
- Personaje.

El módulo de crónicas no implementará el motor de dados.

## Integración con personajes

El módulo consumirá las interfaces públicas del dominio de personajes.

No accederá directamente a estructuras internas para modificar fichas sin operaciones autorizadas.

## Implementación incremental

Orden recomendado:

1. Entidad Crónica.
2. Listado y creación.
3. Participantes.
4. Asociación de personajes.
5. PNJ.
6. Localizaciones.
7. Eventos.
8. Línea temporal.
9. Sesiones y funciones avanzadas.

Cada incremento deberá quedar funcional y probado antes del siguiente.

## Pruebas

Se incluirán pruebas para:

- Creación.
- Estados.
- Participantes.
- Permisos.
- Asociación de personajes.
- Archivado.
- Integridad de relaciones.
- Visibilidad cuando se implemente.

## Criterios de aceptación

- Crónicas gestionables de forma independiente.
- Relaciones claras con usuarios y personajes.
- Arquitectura preparada para PNJ, localizaciones, eventos y sesiones.
- Permisos validados en backend.
- Archivado sin pérdida de información.
- Crecimiento modular sin convertir el módulo en un monolito.

## Cierre de implementación

SPEC-030 queda cerrada operativamente tras completar y validar el módulo base de Crónicas.

Alcance materializado:

- Entidad y persistencia de Crónica.
- Creación, listado y consulta individual.
- Estados Preparación, Activa y Archivada.
- Transiciones explícitas de ciclo de vida con validación y persistencia.
- Archivado sin pérdida de relaciones históricas.
- Permisos de backend y aislamiento por Narrador.
- Panel individual de Crónica con Resumen.
- Navegación real desde el listado y retorno al mismo.
- Arquitectura modular preparada para los incrementos posteriores.

Quedan deliberadamente fuera de SPEC-030 y continúan en sus SPEC propias:

- SPEC-031: participantes, roles contextuales y asociación funcional de personajes.
- SPEC-032: PNJ.
- SPEC-033: localizaciones.
- SPEC-034: eventos y línea temporal.
- SPEC-035: sesiones.

Validación de cierre:

- Auditoría final: 6/6 criterios de aceptación.
- API: 37/37 tests SPEC-030 enfocados OK.
- Web: 34/34 tests SPEC-030 enfocados OK.
- Web typecheck: OK.
- API y Web reconstruidos y healthy.
- Prueba manual de creación, lifecycle, archivado, persistencia, apertura del panel y retorno: OK.
