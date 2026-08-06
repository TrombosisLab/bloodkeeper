# SPEC-038 – DICE_HUNGER_AND_SPECIAL_RESULTS

## Información
| Campo | Valor |
|---|---|
| Código | SPEC-038 |
| Documento | DICE_HUNGER_AND_SPECIAL_RESULTS.md |
| Proyecto | Vampiro V5 Revolution |
| Versión | 1.0 |
| Estado | Aprobado |

## Propósito

Definir el tratamiento específico de los Dados de Hambre y la interpretación de resultados especiales de Vampiro V5.

## Objetivos

- Diferenciar inequívocamente dados normales y Dados de Hambre.
- Interpretar correctamente resultados especiales.
- Mantener reglas centralizadas y testeables.
- Proporcionar resultados estructurados y comprensibles.
- Evitar que la interfaz implemente lógica mecánica.

## Dados de Hambre

Los Dados de Hambre forman parte de la reserva cuando las reglas V5 aplicables lo determinen.

Cada dado deberá conservar explícitamente su tipo:

- Normal.
- Hambre.

El tipo no podrá inferirse únicamente por su posición visual.

## Sustitución en la reserva

La cantidad de Dados de Hambre deberá calcularse según:

- Reserva final.
- Hambre actual.
- Reglas específicas de la tirada.

El sistema no generará más Dados de Hambre que dados disponibles en la reserva.

## Representación

Los Dados de Hambre deberán distinguirse mediante más de una señal visual cuando sea razonable.

La accesibilidad no dependerá únicamente del color.

## Éxitos

El motor contará éxitos conforme a las reglas V5 implementadas.

El resultado deberá conservar información suficiente para explicar:

- Dados que generaron éxitos.
- Pares o combinaciones relevantes.
- Participación de Dados de Hambre en resultados especiales.

## Críticos

La detección y cálculo de críticos se realizará en el motor de reglas.

Las combinaciones de resultados deberán evaluarse de forma determinista a partir de los dados obtenidos.

## Crítico conflictivo

Cuando se cumplan las condiciones V5 correspondientes, el resultado se marcará explícitamente como crítico conflictivo.

El motor devolverá:

- Tipo de resultado.
- Número total de éxitos.
- Evidencia estructurada mínima necesaria para presentación.

La aplicación no inventará automáticamente consecuencias narrativas no definidas.

## Fallo bestial

Cuando se cumplan las condiciones correspondientes, el resultado deberá marcarse como fallo bestial.

La interpretación narrativa final corresponderá al juego o al narrador salvo automatización específicamente aprobada.

## Fallo normal

Un fallo sin condición especial deberá diferenciarse claramente de un fallo bestial.

## Éxito normal

Un éxito que no constituya un resultado especial deberá identificarse de forma sencilla y clara.

## Prioridad de clasificación

El motor deberá definir una prioridad inequívoca para clasificar una tirada cuando existan múltiples características simultáneas.

Esta prioridad deberá estar documentada en código mediante reglas y cubierta por pruebas.

## Resultado estructurado

Como mínimo podrá contener:

- Tipo global.
- Éxitos totales.
- Dificultad.
- Éxito o fracaso respecto a dificultad.
- Dados normales.
- Dados de Hambre.
- Críticos detectados.
- Indicadores especiales.

## Consecuencias narrativas

El motor no generará automáticamente contenido narrativo extenso.

Podrá mostrar etiquetas o ayudas breves como:

- Crítico conflictivo.
- Fallo bestial.

Las consecuencias específicas dependerán del contexto y del narrador.

## Interacción con dificultad

La clasificación especial y la comparación con dificultad deberán resolverse correctamente según las reglas implementadas.

No se asumirá que una característica especial implica siempre el mismo resultado global sin evaluar el contexto reglamentario.

## Casos límite

Se deberán probar explícitamente:

- Hambre cero.
- Todos los dados como Dados de Hambre.
- Reservas pequeñas.
- Múltiples resultados críticos.
- Dados de Hambre implicados en críticos.
- Tiradas sin éxitos.
- Tiradas sin dificultad.
- Combinaciones especiales ambiguas.

## Aleatoriedad controlable en pruebas

El generador de resultados deberá poder sustituirse o inyectarse en pruebas para definir secuencias exactas.

Las pruebas no dependerán del azar real.

## Presentación

La interfaz mostrará:

- Cada dado.
- Su tipo.
- Resultado global.
- Éxitos.
- Resultado especial destacado.

La presentación no deberá ocultar los resultados individuales.

## Sonido y animación

Cualquier efecto será opcional y puramente visual.

Nunca modificará:

- Resultado.
- Orden lógico.
- Tiempo necesario para obtener la respuesta del motor.

## Historial

Cuando una tirada se persista, deberá conservar suficiente información para volver a mostrar exactamente:

- Valores obtenidos.
- Tipos de dados.
- Resultado interpretado en el momento de ejecución.

Cambios futuros en reglas no deberán reescribir silenciosamente resultados históricos.

## Versionado de reglas

Cuando sea necesario, el historial podrá conservar una referencia a la versión del motor o reglas utilizada.

Solo se implementará si la evolución real del proyecto lo requiere.

## Pruebas

Se incluirán pruebas deterministas para:

- Éxitos.
- Fallos.
- Críticos.
- Críticos conflictivos.
- Fallos bestiales.
- Dados de Hambre.
- Dificultad.
- Casos límite.
- Clasificación prioritaria.

## Criterios de aceptación

- Dados de Hambre inequívocamente identificados.
- Resultados especiales calculados en el motor.
- Resultado estructurado y explicable.
- Casos límite cubiertos por pruebas.
- Historial capaz de preservar el resultado original.
- Interfaz libre de lógica reglamentaria duplicada.
