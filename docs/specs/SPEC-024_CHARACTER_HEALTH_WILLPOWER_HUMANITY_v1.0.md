# SPEC-024 – CHARACTER_HEALTH_WILLPOWER_HUMANITY

## Información
| Campo | Valor |
|---|---|
| Código | SPEC-024 |
| Documento | CHARACTER_HEALTH_WILLPOWER_HUMANITY.md |
| Proyecto | Vampiro V5 Revolution |
| Versión | 1.0 |
| Estado | Aprobado |

## Propósito

Definir la representación, cálculo, interacción y validación de Salud, Fuerza de Voluntad, Humanidad y estados relacionados en la ficha de personaje.

## Objetivos

- Representar visualmente los estados de forma clara.
- Diferenciar correctamente tipos de daño y marcas.
- Centralizar cálculos derivados.
- Evitar modificaciones accidentales.
- Preparar estos estados para su uso durante partidas.

## Salud

La Salud tendrá:

- Valor máximo calculado según las reglas V5 implementadas.
- Estado actual.
- Representación visual mediante hasta diez casillas preparadas para la interfaz.
- Diferenciación entre casillas disponibles y daño registrado.

## Tipos de daño

La interfaz deberá diferenciar de forma inequívoca:

- Sin daño.
- Daño superficial.
- Daño agravado.

La representación no dependerá únicamente del color; deberá existir también una diferencia de forma, símbolo o patrón para mantener accesibilidad.

## Interacción con Salud

En modo de juego, las casillas podrán modificarse mediante una interacción sencilla y deliberada.

El diseño deberá evitar cambios accidentales y permitir corregir errores.

La lógica de aplicación, conversión y curación de daño deberá residir en reglas de dominio, no en el componente visual.

## Fuerza de Voluntad

La Fuerza de Voluntad tendrá:

- Valor máximo derivado según las reglas V5 implementadas.
- Estado actual.
- Hasta diez casillas visuales.
- Representación de los tipos de daño aplicables.

Se utilizará un componente coherente con Salud, reutilizando comportamiento cuando las reglas sean equivalentes.

## Valores derivados

Los valores máximos de Salud y Fuerza de Voluntad se calcularán desde los atributos correspondientes mediante servicios de reglas centralizados.

No se almacenarán cálculos duplicados salvo que exista una justificación técnica documentada.

## Humanidad

La ficha mostrará la puntuación actual de Humanidad mediante un control visual coherente con el sistema de diseño.

La modificación de Humanidad será una operación explícita y sujeta a las reglas aplicables.

## Manchas y estados relacionados

Cuando corresponda, la ficha permitirá representar las Manchas y otros estados directamente relacionados con Humanidad.

Estos estados deberán mantenerse separados conceptualmente de la puntuación base para evitar inconsistencias.

## Hambre

Aunque Hambre tendrá especificaciones adicionales relacionadas con dados y juego, deberá mostrarse junto a los estados principales del personaje cuando resulte útil.

La representación será clara, inmediata y preparada para actualizarse durante una sesión.

## Estados de incapacidad o límites

Cuando un estado alcance un límite relevante, la interfaz deberá:

- Indicarlo visualmente.
- Evitar interpretar por sí sola consecuencias no implementadas.
- Delegar reglas automáticas en el dominio.
- Mostrar mensajes comprensibles cuando una acción no sea válida.

## Historial

No se requiere inicialmente un historial completo de cada cambio de daño o Humanidad.

La arquitectura no deberá impedir añadir auditoría o historial de sesión en el futuro.

## Persistencia

Se almacenará únicamente la información necesaria para reconstruir el estado exacto del personaje.

La estructura deberá evitar combinaciones imposibles o ambiguas.

## Concurrencia

Si en el futuro varios usuarios pueden modificar el mismo personaje, deberá evitarse la pérdida silenciosa de cambios.

La primera versión no necesita colaboración en tiempo real.

## Responsive

Los controles deberán ser utilizables mediante:

- Ratón.
- Pantalla táctil.
- Teclado cuando corresponda.

Las casillas mantendrán un tamaño suficiente para interacción táctil.

## Accesibilidad

Los estados no dependerán exclusivamente del color.

Cada tipo deberá disponer de:

- Indicador visual distinguible.
- Etiqueta accesible.
- Estado comprensible para tecnologías de asistencia cuando sea aplicable.

## Pruebas

Se incluirán pruebas para:

- Cálculo de máximos.
- Límites.
- Aplicación de daño.
- Conversión entre tipos cuando las reglas lo requieran.
- Curación.
- Humanidad.
- Manchas.
- Estados inválidos.
- Persistencia y reconstrucción del estado.

## Criterios de aceptación

- Salud y Voluntad representadas claramente.
- Hasta diez casillas disponibles en la interfaz.
- Daño superficial y agravado inequívocamente diferenciados.
- Cálculos derivados centralizados.
- Humanidad y Manchas representadas correctamente.
- Interacción segura y usable.
- Reglas separadas de la presentación.
