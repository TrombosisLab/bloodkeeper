# SPEC-019 – CHARACTER_MODULE

## Información
| Campo | Valor |
|---|---|
| Código | SPEC-019 |
| Documento | CHARACTER_MODULE.md |
| Proyecto | Vampiro V5 Revolution |
| Versión | 1.0 |
| Estado | Aprobado |

## Propósito

Definir la arquitectura funcional general del módulo de personajes, que será uno de los dominios principales de Vampiro V5 Revolution.

## Objetivos

- Crear, consultar y gestionar personajes de Vampiro: La Mascarada V5.
- Mantener una ficha digital reconocible, clara e interactiva.
- Separar la presentación, las reglas, los datos y las interacciones.
- Permitir crecimiento modular sin convertir el módulo en código monolítico.
- Preparar la integración futura con crónicas, dados y herramientas del narrador.

## Alcance inicial

El módulo incluirá progresivamente:

- Listado de personajes.
- Ficha de personaje.
- Creación guiada por fases.
- Edición controlada.
- Atributos.
- Habilidades.
- Salud.
- Fuerza de Voluntad.
- Humanidad y estados relacionados.
- Hambre.
- Disciplinas.
- Ventajas, trasfondos y defectos.
- Información narrativa.
- Notas y elementos auxiliares.
- Integración posterior con tiradas de dados.

## Principios de diseño

- La ficha debe resultar familiar para jugadores de V5 sin limitarse a copiar una hoja en papel.
- La información utilizada frecuentemente durante una partida tendrá prioridad visual.
- La información secundaria podrá organizarse mediante secciones o pestañas.
- Las reglas de juego no se mezclarán con componentes visuales.
- Los cálculos derivados deberán centralizarse y ser verificables.
- No se duplicará lógica de reglas entre creación, edición y ficha.

## Modularidad interna

El módulo se dividirá en responsabilidades pequeñas cuando sea necesario.

La arquitectura deberá permitir separar, entre otros:

- Dominio y modelo del personaje.
- Creación del personaje.
- Validación de reglas.
- Presentación de ficha.
- Estado durante la partida.
- Integración con dados.
- Persistencia.

No se crearán subdivisiones artificiales que no aporten claridad.

## Cabecera del personaje

La ficha contemplará como mínimo:

- Nombre del personaje.
- Concepto.
- Depredador.
- Crónica.
- Ambición.
- Clan.
- Sire.
- Deseo.
- Generación.

Los mecanismos concretos de introducción, selección y validación se definirán en las especificaciones de creación y ficha.

## Interacción

La ficha evolucionará hacia una herramienta activa de juego.

Los elementos interactivos deberán:

- Ser comprensibles visualmente.
- Evitar acciones accidentales.
- Mostrar estados claramente.
- Integrarse posteriormente con el sistema de dados sin acoplamiento innecesario.

## Dependencias

El módulo dependerá únicamente de servicios comunes necesarios, como:

- Autenticación y usuarios.
- Permisos.
- Persistencia.
- Componentes compartidos.

Las dependencias con crónicas o dados deberán realizarse mediante interfaces claramente definidas.

## Restricciones

- No implementar reglas improvisadas.
- No mezclar reglas de otras ediciones de Vampiro.
- Las reglas implementadas deberán corresponder a V5 y estar documentadas.
- No introducir contenido protegido extenso de manuales oficiales dentro del código o documentación del proyecto.
- No crear dependencias innecesarias entre módulos.

## Validación

Cada incremento del módulo deberá incluir:

- Pruebas de la lógica relevante.
- Comprobación visual cuando exista interfaz.
- Procedimiento sencillo de validación.
- Confirmación de que las funciones existentes siguen operativas.

## Criterios de aceptación

- Arquitectura modular y mantenible.
- Ficha preparada para crecer por etapas.
- Separación clara entre datos, reglas e interfaz.
- Integración futura con otros módulos sin acoplamiento fuerte.
- Comportamiento verificable sin necesidad de inspeccionar directamente el código.
