# SPEC-020 – CHARACTER_SHEET

## Información
| Campo | Valor |
|---|---|
| Código | SPEC-020 |
| Documento | CHARACTER_SHEET.md |
| Proyecto | Vampiro V5 Revolution |
| Versión | 1.0 |
| Estado | Aprobado |

## Propósito

Definir la estructura funcional y visual de la ficha digital de personaje de Vampiro: La Mascarada V5.

## Objetivo

La ficha será una herramienta de juego, no un simple formulario. Debe conservar una organización reconocible para jugadores de V5 y aprovechar las ventajas de una aplicación web.

## Principios

- Información frecuente visible sin navegación innecesaria.
- Diseño claro, sobrio y responsive.
- Interacción directa con elementos de juego.
- Separación entre visualización y edición cuando aporte seguridad.
- Sin ventanas emergentes innecesarias.
- Preparada para integración futura con el módulo de dados.

## Cabecera

La zona superior incluirá:

- Nombre del personaje.
- Concepto.
- Depredador.
- Crónica.
- Ambición.
- Clan.
- Sire.
- Deseo.
- Generación.

Los campos se presentarán de forma compacta y legible.

## Atributos

Se organizarán en tres categorías.

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

Los valores se representarán mediante un sistema visual de puntos o círculos coherente con el resto de la interfaz.

## Habilidades

Las habilidades se organizarán visualmente de forma clara y deberán mostrar su puntuación mediante el mismo lenguaje visual de la ficha.

La estructura concreta deberá respetar las categorías y reglas aplicables de V5.

## Salud

La ficha dispondrá de hasta diez casillas visuales preparadas para representar el valor disponible y los estados de daño.

El sistema deberá diferenciar claramente:

- Casilla disponible.
- Daño superficial.
- Daño agravado.

La interacción exacta se especificará en el documento correspondiente a estados del personaje.

## Fuerza de Voluntad

Dispondrá igualmente de hasta diez casillas visuales y representación diferenciada de sus estados aplicables.

## Humanidad y estados relacionados

La ficha mostrará de forma clara:

- Humanidad.
- Manchas u otros estados relacionados cuando correspondan según las reglas implementadas.

## Hambre

El nivel de Hambre deberá ser visible durante el juego y estar preparado para integrarse directamente con las tiradas de dados.

## Disciplinas

Las disciplinas mostrarán:

- Nombre.
- Nivel.
- Poderes adquiridos.

La interfaz podrá permitir expandir información útil sin abandonar la ficha.

No se incluirán reproducciones extensas de contenido protegido de manuales oficiales.

## Ventajas, trasfondos y defectos

Se organizarán en secciones claramente identificables y ampliables.

## Información secundaria

La información menos utilizada durante una tirada podrá organizarse mediante secciones o pestañas, incluyendo cuando proceda:

- Inventario.
- Notas.
- Información narrativa.
- Historial.
- Otros elementos futuros aprobados.

## Interacción con puntuaciones

Los controles visuales de puntuación deberán ser reutilizables y consistentes.

En modo visualización no deberán modificarse accidentalmente.

En modo edición, los cambios deberán ser explícitos y validados.

## Integración futura con dados

Los atributos y habilidades deberán quedar preparados para ser seleccionables como componentes de una reserva de dados.

La ficha no implementará lógica de tiradas directamente; delegará esa responsabilidad en el módulo de dados.

## Responsive

### Escritorio
Priorizar una vista amplia que permita consultar simultáneamente atributos, habilidades y estados principales.

### Tablet
Reorganizar columnas manteniendo accesible la información esencial.

### Móvil
Apilar secciones y facilitar navegación rápida sin eliminar funciones.

## Estados de interfaz

La ficha contemplará:

- Cargando.
- Sin personaje.
- Error.
- Sin permisos.
- Visualización.
- Edición cuando corresponda.

## Restricciones

- No convertir la ficha en una página excesivamente larga sin organización.
- No ocultar información esencial tras múltiples clics.
- No duplicar lógica de reglas en componentes visuales.
- No copiar literalmente una ficha oficial protegida; crear una adaptación digital propia y funcional.

## Primera implementación

La primera versión podrá ser únicamente visual y utilizar datos de demostración.

No requerirá inicialmente:

- Persistencia.
- Edición.
- Reglas automáticas.
- Tiradas.
- Autenticación integrada.

El objetivo inicial será validar estructura, legibilidad y experiencia visual antes de añadir lógica.

## Criterios de aceptación

- La ficha es reconocible como ficha de personaje V5.
- Cabecera, atributos, habilidades y estados principales son fáciles de localizar.
- Diseño responsive.
- Componentes visuales consistentes.
- Preparada para evolución modular.
- La primera maqueta puede validarse visualmente sin inspeccionar código.
