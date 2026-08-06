# SPEC-028 – CHARACTER_INVENTORY_NOTES_AND_HISTORY

## Información
| Campo | Valor |
|---|---|
| Código | SPEC-028 |
| Documento | CHARACTER_INVENTORY_NOTES_AND_HISTORY.md |
| Proyecto | Vampiro V5 Revolution |
| Versión | 1.0 |
| Estado | Aprobado |

## Propósito

Definir las áreas auxiliares de la ficha destinadas a Inventario, Notas e Historial, manteniéndolas separadas del núcleo mecánico del personaje.

## Objetivos

- Permitir registrar información útil sin sobrecargar la ficha principal.
- Mantener una estructura clara y extensible.
- Diferenciar información mecánica, narrativa y de seguimiento.
- Evitar campos genéricos descontrolados.

## Inventario

El inventario permitirá registrar objetos relevantes del personaje.

Cada elemento podrá incluir, cuando sea necesario:

- Identificador.
- Nombre.
- Cantidad.
- Descripción breve.
- Categoría.
- Notas.
- Estado activo o archivado.

Solo se añadirán propiedades mecánicas estructuradas cuando exista una regla o funcionalidad que realmente las utilice.

## Organización del inventario

La interfaz deberá permitir:

- Añadir.
- Editar.
- Eliminar o archivar según corresponda.
- Ordenar o agrupar de forma sencilla.
- Consultar detalles sin abandonar innecesariamente la ficha.

No se diseñará inicialmente un sistema complejo de peso, economía o equipamiento salvo especificación futura.

## Notas

Las Notas permitirán almacenar información libre asociada al personaje.

Podrán utilizarse para:

- Recordatorios.
- Información narrativa.
- Objetivos.
- Datos de interpretación.
- Apuntes de sesión.

## Estructura de notas

La primera versión podrá utilizar notas simples.

La arquitectura permitirá evolucionar hacia notas:

- Con título.
- Fechadas.
- Categorizadas.
- Privadas o compartidas cuando exista una necesidad funcional.

No se añadirá complejidad anticipadamente.

## Historial

El Historial representará acontecimientos relevantes del personaje, no un registro técnico de auditoría.

Podrá incluir:

- Eventos narrativos.
- Cambios importantes.
- Hitos.
- Evolución del personaje.

## Diferencia entre historial y auditoría

El historial narrativo será visible y útil para jugadores o narradores según permisos.

La auditoría técnica, si se incorpora, pertenecerá al sistema de administración y no se mezclará con esta sección.

## Presentación en ficha

Inventario, Notas e Historial serán información secundaria.

Podrán organizarse mediante:

- Pestañas.
- Secciones colapsables.
- Vistas secundarias integradas.

No deberán desplazar de la vista principal los elementos mecánicos de uso frecuente.

## Permisos

El acceso dependerá del contexto.

El sistema deberá poder soportar en el futuro:

- Información visible para jugador y narrador.
- Información privada del propietario.
- Información exclusiva del narrador.

No se implementarán niveles de privacidad complejos hasta que exista una especificación funcional que los requiera.

## Persistencia

Cada elemento tendrá relaciones explícitas con el personaje.

No se almacenarán todos los contenidos auxiliares en un único campo sin estructura cuando necesiten operaciones independientes.

## Búsqueda

No se requiere búsqueda avanzada inicialmente.

La arquitectura no deberá impedir añadirla cuando el volumen de información lo justifique.

## Eliminación

Cuando sea relevante preservar historia, se preferirá archivado o borrado lógico.

Para notas u objetos simples sin dependencias podrá permitirse eliminación definitiva con confirmación adecuada.

## Responsive

Estas secciones deberán ser cómodas en:

- Escritorio.
- Tablet.
- Móvil.

La edición de texto deberá ofrecer un área suficiente y controles táctiles adecuados.

## Pruebas

Se incluirán pruebas para:

- CRUD de inventario.
- Notas.
- Historial.
- Relaciones con personaje.
- Permisos.
- Eliminación o archivado.
- Estados vacíos.

## Criterios de aceptación

- Inventario gestionable sin sobrecargar la ficha.
- Notas sencillas y útiles.
- Historial narrativo claramente separado de auditoría técnica.
- Organización secundaria coherente.
- Modelo preparado para crecer sin complejidad prematura.
