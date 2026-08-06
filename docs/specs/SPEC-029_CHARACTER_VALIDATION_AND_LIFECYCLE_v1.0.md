# SPEC-029 – CHARACTER_VALIDATION_AND_LIFECYCLE

## Información
| Campo | Valor |
|---|---|
| Código | SPEC-029 |
| Documento | CHARACTER_VALIDATION_AND_LIFECYCLE.md |
| Proyecto | Vampiro V5 Revolution |
| Versión | 1.0 |
| Estado | Aprobado |

## Propósito

Definir la validación global y el ciclo de vida de los personajes desde su creación como borrador hasta su uso, evolución y archivado.

## Objetivos

- Garantizar estados de personaje coherentes.
- Centralizar validaciones globales.
- Diferenciar creación, juego y evolución.
- Evitar cambios que dejen datos inconsistentes.
- Mantener trazabilidad suficiente sin complejidad innecesaria.

## Estados del ciclo de vida

### Borrador
Personaje cuya creación no ha finalizado.

Puede contener información incompleta y no debe considerarse válido para todas las funciones de juego.

### Activo
Personaje cuya creación ha sido completada y validada.

Puede utilizarse en las funciones habilitadas de la plataforma.

### Archivado
Personaje conservado por motivos históricos pero retirado del uso habitual.

El archivado no eliminará sus relaciones ni su información.

## Transiciones

Las transiciones deberán ser explícitas.

Como mínimo:

- Borrador → Activo: requiere validación completa.
- Activo → Archivado: requiere permiso y confirmación.
- Archivado → Activo: podrá permitirse cuando no exista una restricción funcional.

No se realizarán transiciones implícitas por simples cambios de interfaz.

## Validación de borradores

Los borradores podrán guardarse aunque estén incompletos.

El sistema deberá distinguir:

- Campos pendientes.
- Errores.
- Advertencias.
- Secciones completas.

## Validación para activación

Antes de activar un personaje se validará de forma global:

- Identidad mínima requerida.
- Atributos.
- Habilidades.
- Valores derivados.
- Clan, generación y elementos relacionados cuando sean obligatorios.
- Disciplinas y Poderes.
- Ventajas, Trasfondos, Méritos y Defectos.
- Humanidad y demás elementos requeridos.
- Cualquier dependencia entre decisiones.

La lista concreta dependerá de las reglas V5 implementadas.

## Motor de validación

Las reglas se organizarán en servicios o componentes de dominio.

El motor deberá poder devolver resultados estructurados con:

- Código de validación.
- Severidad.
- Campo o sección afectada.
- Mensaje comprensible.
- Datos adicionales mínimos cuando sean útiles.

## Errores y advertencias

### Error
Impide completar una operación cuando viola una regla obligatoria.

### Advertencia
Informa de una situación relevante pero no bloquea si las reglas permiten continuar.

La interfaz no decidirá qué reglas bloquean; utilizará la severidad proporcionada por el dominio.

## Contextos de validación

Las reglas podrán variar según el contexto:

- Creación.
- Activación.
- Edición.
- Evolución.
- Uso durante partida.

No se aplicará indiscriminadamente una única lista de reglas a todas las operaciones.

## Edición de personajes activos

Los cambios deberán validarse según su naturaleza.

Las modificaciones mecánicas relevantes no deberán tratarse como simples ediciones de formulario cuando estén sujetas a reglas de evolución.

## Evolución

La arquitectura deberá permitir posteriormente:

- Gastos de experiencia.
- Mejoras.
- Adquisición de nuevos elementos.
- Registro de cambios relevantes.

Las reglas de evolución se mantendrán separadas de la creación inicial.

## Integridad ante cambios dependientes

Cuando una modificación pueda invalidar otros datos:

1. El sistema detectará dependencias.
2. Informará al usuario.
3. Evitará pérdida silenciosa de información.
4. Revalidará el estado resultante.

## Eliminación

La eliminación definitiva de personajes no será la opción habitual.

Se preferirá archivado cuando existan:

- Relaciones con crónicas.
- Historial.
- Tiradas.
- Datos narrativos relacionados.

La eliminación definitiva, si existe, requerirá permisos elevados y confirmación explícita.

## Duplicación

Podrá incorporarse en el futuro la duplicación de personajes como borrador.

Una copia deberá recibir:

- Nuevo identificador.
- Estado Borrador.
- Relaciones revisadas para evitar heredar vínculos inapropiados.

No forma parte del alcance inicial obligatorio.

## Versionado del modelo

Las migraciones del sistema no deberán alterar silenciosamente el significado mecánico de personajes existentes.

Cuando una actualización de reglas requiera transformación de datos, deberá existir una migración explícita y validada.

## Permisos

Las operaciones de ciclo de vida respetarán:

- Propiedad.
- Rol.
- Contexto de crónica.
- Permisos administrativos.

La autorización se validará en backend.

## Pruebas

Se incluirán pruebas para:

- Guardado de borradores incompletos.
- Activación válida.
- Activación rechazada.
- Archivado.
- Reactivación.
- Dependencias.
- Contextos de validación.
- Permisos.
- Integridad tras cambios.

## Criterios de aceptación

- Estados del personaje inequívocos.
- Borradores permitidos sin comprometer personajes activos.
- Activación únicamente tras validación completa.
- Reglas centralizadas y contextuales.
- Archivado seguro.
- Preparado para evolución futura.
- Sin lógica de validación duplicada en la interfaz.
