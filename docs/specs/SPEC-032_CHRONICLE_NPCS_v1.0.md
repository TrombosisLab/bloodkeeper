# SPEC-032 – CHRONICLE_NPCS

## Información
| Campo | Valor |
|---|---|
| Código | SPEC-032 |
| Documento | CHRONICLE_NPCS.md |
| Proyecto | Vampiro V5 Revolution |
| Versión | 1.0 |
| Estado | Aprobado |

## Propósito

Definir la gestión de Personajes No Jugadores (PNJ) dentro de las Crónicas.

## Objetivos

- Permitir al narrador crear y organizar PNJ con distintos niveles de detalle.
- Evitar obligar a crear una ficha completa cuando no sea necesaria.
- Facilitar consulta rápida durante una sesión.
- Relacionar PNJ con localizaciones, eventos y otros recursos.
- Mantener información reservada protegida.

## Niveles de detalle

La arquitectura deberá admitir progresivamente distintos niveles de complejidad.

### PNJ simple

Adecuado para personajes secundarios.

Podrá incluir:

- Nombre.
- Tipo o categoría.
- Descripción breve.
- Rol narrativo.
- Notas.
- Estado.

### PNJ desarrollado

Podrá incluir información mecánica estructurada necesaria para juego.

### PNJ con ficha completa

Cuando sea necesario, un PNJ podrá vincularse o representarse mediante el dominio completo de Personajes.

No se duplicará una segunda implementación completa de ficha dentro del módulo de PNJ.

## Entidad PNJ

Como mínimo podrá contemplar:

- Identificador.
- Crónica.
- Nombre.
- Descripción breve.
- Rol narrativo.
- Estado.
- Nivel de detalle.
- Información reservada.
- Fechas técnicas.

Los campos se añadirán progresivamente según necesidad real.

## Estados

Podrán existir estados como:

- Activo.
- Inactivo.
- Archivado.

Los estados narrativos específicos no deberán convertirse automáticamente en estados técnicos si no aportan funcionalidad.

## Información pública y privada

El modelo deberá permitir diferenciar información que puede compartirse con jugadores de información exclusiva del narrador.

La primera versión podrá mantener los PNJ como contenido privado del narrador hasta implementar reglas de visibilidad más detalladas.

## Relaciones

Un PNJ podrá relacionarse con:

- Localizaciones.
- Eventos.
- Sesiones.
- Otros PNJ.
- Personajes.
- Recursos narrativos futuros.

Las relaciones solo se implementarán cuando aporten funcionalidad concreta.

## Organización

La interfaz deberá permitir:

- Listar PNJ.
- Buscar o filtrar cuando el volumen lo justifique.
- Consultar detalles.
- Crear.
- Editar.
- Archivar.

No se implementarán sistemas complejos de clasificación antes de necesitarlos.

## Consulta durante partida

La vista de PNJ deberá priorizar información útil rápidamente.

El narrador no deberá navegar por múltiples pantallas para consultar datos esenciales.

## Estadísticas mecánicas

Las estadísticas necesarias deberán utilizar estructuras reutilizables del dominio cuando sea razonable.

No se copiará lógica de:

- Atributos.
- Habilidades.
- Salud.
- Voluntad.
- Disciplinas.
- Dados.

## Conversión o promoción

La arquitectura permitirá convertir o vincular un PNJ simple a una ficha más completa sin perder información.

No es obligatorio implementar esta conversión en la primera versión.

## Eliminación

Se preferirá archivado cuando un PNJ tenga relaciones históricas.

La eliminación definitiva solo será posible cuando no comprometa integridad o mediante una operación explícita.

## Permisos

Por defecto:

- Narradores autorizados gestionan PNJ.
- Jugadores solo acceden a información expresamente compartida.
- Toda autorización se valida en backend.

## Persistencia

Los PNJ pertenecerán explícitamente a una crónica.

No se duplicarán datos completos de personajes cuando exista una relación con una ficha.

## Pruebas

Se incluirán pruebas para:

- Creación.
- Edición.
- Archivado.
- Niveles de detalle.
- Relaciones.
- Visibilidad.
- Permisos.
- Integridad.

## Criterios de aceptación

- PNJ simples rápidos de crear.
- Posibilidad de ampliar detalle progresivamente.
- Sin duplicación del dominio de Personajes.
- Información privada protegida.
- Consulta eficiente durante sesiones.
- Relaciones extensibles con recursos de la crónica.
