# SPEC-033 – CHRONICLE_LOCATIONS

## Información
| Campo | Valor |
|---|---|
| Código | SPEC-033 |
| Documento | CHRONICLE_LOCATIONS.md |
| Proyecto | Vampiro V5 Revolution |
| Versión | 1.0 |
| Estado | Aprobado |

## Propósito

Definir la gestión de localizaciones narrativas dentro de una Crónica.

## Objetivos

- Registrar lugares relevantes de forma estructurada.
- Facilitar consulta y preparación del narrador.
- Relacionar lugares con PNJ, personajes y eventos.
- Permitir información pública y reservada.
- Evitar complejidad cartográfica prematura.

## Entidad Localización

Una localización podrá incluir:

- Identificador estable.
- Crónica.
- Nombre.
- Tipo o categoría opcional.
- Descripción.
- Información reservada.
- Estado.
- Localización padre cuando exista una jerarquía útil.
- Fechas técnicas.

## Jerarquía

El sistema podrá representar relaciones simples de contención, por ejemplo:

- Ciudad.
- Distrito.
- Edificio.
- Sala o zona.

La jerarquía será opcional y no obligará a utilizar una profundidad fija.

Se evitarán estructuras excesivamente complejas.

## Categorías

Las categorías podrán ayudar a organizar lugares cuando el volumen lo justifique.

No se codificarán listas rígidas si no existe una necesidad de reglas.

## Información visible y reservada

La arquitectura deberá permitir diferenciar:

- Información compartible.
- Notas privadas del narrador.

La primera implementación podrá mantener la gestión completa restringida al narrador.

## Relaciones

Una localización podrá relacionarse con:

- PNJ.
- Personajes.
- Eventos.
- Sesiones.
- Otras localizaciones.
- Recursos narrativos futuros.

Las relaciones deberán ser explícitas cuando sean necesarias para funcionalidad.

## Presentación

La vista deberá permitir:

- Listar.
- Consultar.
- Crear.
- Editar.
- Archivar.

La navegación jerárquica solo se mostrará cuando aporte claridad.

## Consulta durante partida

La información esencial deberá ser accesible rápidamente.

Los detalles secundarios podrán organizarse mediante secciones.

## Mapas e imágenes

La arquitectura podrá permitir adjuntar recursos visuales en el futuro.

No se implementará inicialmente:

- GIS.
- Mapas interactivos complejos.
- Posicionamiento geográfico obligatorio.

Estas funciones requerirán una especificación independiente si se incorporan.

## Estado

Podrán existir estados simples como:

- Activa.
- Inactiva.
- Archivada.

No se crearán estados técnicos para cada situación narrativa.

## Archivado

Archivar una localización:

- No eliminará eventos relacionados.
- No romperá relaciones históricas.
- La retirará de los listados habituales cuando corresponda.

## Permisos

Como principio:

- Narradores autorizados gestionan localizaciones.
- Jugadores acceden únicamente a información compartida.
- Toda autorización se valida en backend.

## Persistencia

Las localizaciones pertenecerán explícitamente a una crónica.

Las relaciones jerárquicas deberán evitar ciclos.

## Validación

Se contemplarán:

- Nombre requerido.
- Referencias válidas.
- Ciclos jerárquicos.
- Permisos.
- Integridad al archivar o eliminar.

## Pruebas

Se incluirán pruebas para:

- Creación.
- Edición.
- Jerarquía.
- Prevención de ciclos.
- Relaciones.
- Archivado.
- Visibilidad.
- Permisos.

## Criterios de aceptación

- Localizaciones fáciles de crear y consultar.
- Jerarquía opcional y simple.
- Información reservada protegida.
- Relaciones extensibles.
- Sin complejidad cartográfica innecesaria.
- Archivado sin pérdida de integridad.
