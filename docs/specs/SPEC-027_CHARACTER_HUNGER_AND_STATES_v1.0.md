# SPEC-027 – CHARACTER_HUNGER_AND_STATES

## Información
| Campo | Valor |
|---|---|
| Código | SPEC-027 |
| Documento | CHARACTER_HUNGER_AND_STATES.md |
| Proyecto | Vampiro V5 Revolution |
| Versión | 1.0 |
| Estado | Aprobado |

## Propósito

Definir la representación y gestión del Hambre y de los estados dinámicos relevantes del personaje durante una partida.

## Objetivos

- Hacer visible el Hambre de forma inmediata.
- Mantener una fuente única de verdad para estados dinámicos.
- Integrar estos estados con reglas y dados sin duplicar lógica.
- Facilitar actualizaciones rápidas y seguras durante el juego.

## Hambre

El personaje mantendrá un valor actual de Hambre dentro de los límites definidos por las reglas V5 implementadas.

La interfaz deberá:

- Mostrarlo en una zona de alta visibilidad.
- Permitir identificar su valor de un vistazo.
- Evitar modificaciones accidentales.
- Reflejar inmediatamente cambios confirmados.

## Modificación del Hambre

Los cambios podrán originarse por operaciones de dominio como:

- Incremento.
- Reducción.
- Resultados de acciones o reglas implementadas.

La interfaz no decidirá por sí sola las consecuencias mecánicas.

Toda modificación deberá pasar por reglas centralizadas.

## Integración con dados

El módulo de dados deberá poder consultar el Hambre actual autorizado del personaje para determinar la composición de una reserva cuando corresponda.

El módulo de dados no modificará directamente el valor de Hambre salvo mediante operaciones de dominio explícitas.

## Dados de Hambre

Cuando una tirada requiera Dados de Hambre:

- Su cantidad se calculará conforme a las reglas implementadas.
- Se distinguirán visualmente de los dados normales.
- Los resultados especiales se interpretarán en el motor de dados.

La ficha no duplicará esa lógica.

## Estados dinámicos

El dominio deberá permitir representar estados temporales o dinámicos necesarios para el juego sin convertir la entidad Personaje en una colección de campos arbitrarios.

Solo se añadirán estados cuando exista una necesidad funcional aprobada.

## Principios de modelado

Cada estado deberá definir:

- Identificador estable.
- Valor o condición.
- Reglas de transición cuando existan.
- Persistencia necesaria.
- Forma de presentación.

No se utilizarán textos libres como sustituto de estados mecánicos que requieran validación.

## Presentación

Los estados importantes durante una sesión deberán:

- Ser fáciles de localizar.
- Mostrar significado comprensible.
- No depender únicamente del color.
- Mantener consistencia con Salud, Voluntad y Humanidad.

## Cambios durante la sesión

Las operaciones frecuentes deberán requerir pocas acciones.

Cuando un cambio tenga consecuencias relevantes o sea difícil de revertir, podrá requerir confirmación.

## Validación

Se impedirán:

- Valores fuera de rango.
- Transiciones imposibles.
- Estados incompatibles cuando las reglas los definan.
- Modificaciones sin permisos.

## Persistencia

Los estados que deban sobrevivir entre sesiones se almacenarán.

Los estados puramente efímeros solo se persistirán si existe una necesidad funcional.

## Historial

No se requiere inicialmente registrar cada modificación.

La arquitectura permitirá añadir historial de sesión o auditoría cuando aporte valor.

## Concurrencia

Si varios usuarios pueden actuar sobre un personaje, el sistema deberá evitar sobrescrituras silenciosas.

La colaboración en tiempo real no forma parte del alcance inicial.

## Pruebas

Se incluirán pruebas para:

- Límites de Hambre.
- Incrementos y reducciones.
- Integración de lectura con dados.
- Transiciones de estados.
- Persistencia.
- Permisos.
- Casos inválidos.

## Criterios de aceptación

- Hambre visible y fácilmente actualizable.
- Límites validados.
- Integración limpia con dados.
- Estados dinámicos modelados explícitamente.
- Sin lógica duplicada entre ficha, reglas y dados.
- Interacción segura durante partidas.
