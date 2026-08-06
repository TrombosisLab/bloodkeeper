# SPEC-023 – CHARACTER_ATTRIBUTES_AND_SKILLS

## Información
| Campo | Valor |
|---|---|
| Código | SPEC-023 |
| Documento | CHARACTER_ATTRIBUTES_AND_SKILLS.md |
| Proyecto | Vampiro V5 Revolution |
| Versión | 1.0 |
| Estado | Aprobado |

## Propósito

Definir el tratamiento funcional de Atributos y Habilidades dentro del módulo de personajes.

## Objetivos

- Representar Atributos y Habilidades de forma clara y consistente.
- Aplicar validaciones de creación y edición sin duplicar reglas.
- Preparar su integración con el módulo de dados.
- Mantener una experiencia visual reconocible para jugadores de V5.

## Atributos

Los nueve atributos se agruparán en tres categorías.

### Físicos
- Fuerza.
- Destreza.
- Resistencia.

### Sociales
- Carisma.
- Manipulación.
- Compostura.

### Mentales
- Inteligencia.
- Astucia.
- Resolución.

## Representación visual

Los valores se mostrarán mediante un componente visual reutilizable de puntos o círculos.

El componente deberá diferenciar claramente:

- Valor actual.
- Valor disponible o editable cuando corresponda.
- Estado bloqueado o solo lectura.
- Error de validación.

## Reglas de creación

La asignación de Atributos deberá respetar la distribución oficial de creación V5 que esté configurada en el sistema.

La interfaz deberá mostrar en todo momento:

- Puntos asignados.
- Puntos pendientes.
- Estado válido o inválido.
- Motivo de cualquier restricción incumplida.

La lógica de validación deberá residir en servicios de dominio reutilizables.

## Reparto aleatorio

Cuando se ofrezca un reparto aleatorio:

- Siempre generará una distribución válida.
- No alterará reglas.
- Permitirá regenerar antes de confirmar.
- Utilizará la misma validación que la asignación manual.

## Habilidades

Las Habilidades deberán organizarse de forma coherente y fácilmente escaneable.

La implementación deberá contemplar:

- Puntuación.
- Especialidades cuando correspondan.
- Validación de límites.
- Distribuciones de creación permitidas.
- Integración futura con tiradas.

## Catálogo de habilidades

Las Habilidades no deberán estar repetidas como texto libre en múltiples partes del código.

Se utilizará una fuente de definición única para:

- Identificador.
- Nombre visible.
- Categoría.
- Estado activo.
- Metadatos mínimos necesarios.

## Especialidades

Las especialidades deberán vincularse a una habilidad concreta.

Su modelo deberá permitir:

- Cero o varias especialidades cuando las reglas lo permitan.
- Validación.
- Visualización compacta.
- Edición independiente de la puntuación de la habilidad.

## Interacción en ficha

En modo visualización:

- No se modificarán puntuaciones accidentalmente.
- Los valores serán fáciles de localizar.
- La interacción futura con dados deberá poder iniciarse desde estos elementos.

En modo edición:

- Los cambios deberán ser explícitos.
- Se validarán antes de persistir.
- Se mostrará feedback inmediato y comprensible.

## Integración con dados

Atributos y Habilidades deberán exponer de forma controlada la información necesaria para construir reservas de dados.

El módulo de personajes no implementará el motor de tiradas.

La selección podrá permitir combinaciones como:

- Atributo + Habilidad.
- Atributo solo.
- Habilidad solo cuando una regla lo requiera.
- Modificadores externos gestionados por el módulo de dados.

## Validaciones

Se deberán contemplar:

- Valores mínimos y máximos.
- Distribuciones inválidas.
- Reglas específicas de creación.
- Cambios posteriores a la creación cuando requieran restricciones diferentes.
- Datos corruptos o fuera de rango.

## Separación entre creación y evolución

Las reglas de creación inicial y las reglas de avance posterior no deberán mezclarse.

El mismo dato podrá tener distintos criterios según el contexto de operación.

## Persistencia

Las puntuaciones deberán almacenarse de forma consistente y normalizada.

No se duplicarán valores derivados.

## Pruebas

Se incluirán pruebas para:

- Distribuciones válidas de atributos.
- Distribuciones inválidas.
- Reparto aleatorio.
- Límites.
- Habilidades y especialidades.
- Casos de edición.
- Integración de lectura con el módulo de dados.

## Criterios de aceptación

- Atributos claramente agrupados y visualizados.
- Habilidades fáciles de consultar.
- Validación centralizada y reutilizable.
- Reparto aleatorio siempre válido.
- Sin lógica duplicada entre creación, edición y ficha.
- Preparado para integración limpia con dados.
