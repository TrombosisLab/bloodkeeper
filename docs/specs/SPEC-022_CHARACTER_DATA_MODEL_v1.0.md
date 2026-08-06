# SPEC-022 – CHARACTER_DATA_MODEL

## Información
| Campo | Valor |
|---|---|
| Código | SPEC-022 |
| Documento | CHARACTER_DATA_MODEL.md |
| Proyecto | Vampiro V5 Revolution |
| Versión | 1.0 |
| Estado | Aprobado |

## Propósito

Definir los principios y estructura lógica del modelo de datos del dominio de personajes, manteniendo independencia entre persistencia, reglas de negocio e interfaz.

## Objetivos

- Representar de forma consistente un personaje de Vampiro V5.
- Evitar modelos monolíticos difíciles de mantener.
- Permitir evolución incremental.
- Mantener integridad y trazabilidad.
- Facilitar integración con crónicas y dados.

## Entidad principal: Personaje

La entidad principal deberá disponer de un identificador interno estable y relaciones explícitas con sus componentes.

### Identidad y cabecera

Como mínimo contemplará:

- Nombre del personaje.
- Concepto.
- Tipo de depredador.
- Crónica asociada cuando exista.
- Ambición.
- Clan.
- Sire.
- Deseo.
- Generación.
- Propietario o usuario responsable.
- Estado del personaje.
- Fechas técnicas necesarias.

Los campos opcionales deberán diferenciar ausencia de información de valores vacíos cuando sea relevante.

## Estado del personaje

El modelo deberá permitir distinguir, como mínimo:

- Borrador o creación incompleta.
- Activo o finalizado.
- Archivado cuando se incorpore esa capacidad.

No se eliminarán físicamente personajes cuando ello pueda romper relaciones históricas sin una razón técnica aprobada.

## Atributos

Los nueve atributos se representarán mediante una estructura validable:

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

Los límites y distribuciones válidas pertenecerán a la capa de reglas, no a componentes visuales.

## Habilidades

Las habilidades deberán modelarse de forma que:

- Puedan validarse puntuaciones.
- Sea posible añadir especialidades cuando corresponda.
- La lógica no dependa de nombres escritos repetidamente en múltiples partes del código.
- La evolución del catálogo no requiera rediseñar toda la entidad Personaje.

## Salud y Fuerza de Voluntad

Se distinguirán:

- Valor máximo o capacidad.
- Estado actual.
- Daño o marcas aplicables.

Los valores derivados deberán calcularse mediante reglas centralizadas cuando corresponda.

El modelo deberá permitir representar correctamente los distintos tipos de daño previstos por V5.

## Hambre

Se almacenará el estado actual necesario para el juego y deberá integrarse posteriormente con el módulo de dados.

Los límites serán validados por reglas de dominio.

## Humanidad y estados relacionados

El modelo contemplará la puntuación de Humanidad y los estados relacionados que requiera la implementación de reglas aprobada.

## Clan y generación

Clan y generación no deberán representarse como texto libre cuando formen parte de catálogos o reglas controladas.

Sus relaciones deberán permitir aplicar reglas sin introducir condicionales dispersos por el código.

## Disciplinas y poderes

Se modelarán separando:

- Disciplina.
- Nivel o puntuación.
- Poderes adquiridos.

La estructura deberá permitir validación y crecimiento sin añadir columnas específicas por cada disciplina.

## Ventajas, trasfondos y defectos

Se representarán mediante estructuras extensibles.

Cada elemento podrá disponer de:

- Tipo o referencia.
- Puntuación cuando corresponda.
- Datos específicos mínimos.
- Notas del personaje cuando sean necesarias.

No se utilizarán campos genéricos indiscriminados si dificultan validación o mantenimiento.

## Información narrativa

Los datos narrativos deberán separarse de las estadísticas cuando sea razonable.

Podrán incluir:

- Notas.
- Descripciones.
- Relaciones narrativas.
- Información adicional aprobada en especificaciones posteriores.

## Inventario

La arquitectura permitirá añadir inventario sin acoplarlo al núcleo estadístico del personaje.

## Propiedad y permisos

Todo personaje tendrá una relación clara con el usuario o usuarios autorizados.

La pertenencia a una crónica no implicará automáticamente acceso completo; los permisos se resolverán mediante el sistema de autorización.

## Relación con crónicas

La asociación con una crónica deberá ser explícita y permitir personajes no asociados cuando el flujo funcional lo requiera.

Las reglas específicas de pertenencia se definirán en el módulo de crónicas.

## Integración con dados

El módulo de dados consumirá una representación autorizada de las puntuaciones necesarias.

No deberá modificar directamente estructuras internas del personaje salvo mediante operaciones de dominio definidas.

## Auditoría y trazabilidad

Se contemplarán campos técnicos mínimos como:

- Fecha de creación.
- Fecha de modificación.

Los historiales detallados solo se añadirán cuando exista una necesidad funcional real.

## Persistencia

El diseño físico de base de datos deberá:

- Usar claves y relaciones explícitas.
- Mantener integridad referencial.
- Evitar duplicación.
- Incluir índices cuando exista una necesidad demostrable.
- Gestionar cambios mediante migraciones versionadas.

## Restricciones arquitectónicas

- No crear una única tabla gigantesca para toda la ficha.
- No almacenar estructuras importantes como texto sin validar solo por comodidad.
- No duplicar datos derivados salvo justificación.
- No acoplar nombres de campos a detalles puramente visuales.
- No permitir que la base de datos sea la única capa de validación de reglas de juego.

## Migraciones

Toda modificación del esquema deberá:

1. Estar versionada.
2. Ser reversible cuando sea razonable.
3. Probarse antes de integrarse.
4. Considerar datos existentes.

## Pruebas

El modelo deberá disponer de pruebas para:

- Creación válida.
- Restricciones.
- Relaciones.
- Eliminaciones o archivado.
- Migraciones relevantes.
- Integridad de datos.

## Criterios de aceptación

- Modelo modular y comprensible.
- Integridad referencial.
- Sin duplicación innecesaria.
- Preparado para reglas V5.
- Preparado para creación guiada, ficha, crónicas y dados.
- Evolución posible mediante migraciones controladas.
