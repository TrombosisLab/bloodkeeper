# SPEC-037 – DICE_POOLS_AND_ROLLS

## Información
| Campo | Valor |
|---|---|
| Código | SPEC-037 |
| Documento | DICE_POOLS_AND_ROLLS.md |
| Proyecto | Vampiro V5 Revolution |
| Versión | 1.0 |
| Estado | Aprobado |

## Propósito

Definir la construcción, validación y ejecución de reservas de dados dentro del módulo de dados.

## Objetivos

- Construir reservas desde distintas fuentes.
- Mostrar de forma transparente cómo se obtiene la reserva final.
- Validar modificadores y límites.
- Permitir tiradas vinculadas o manuales.
- Mantener el motor desacoplado de la interfaz.

## Modelo de reserva

Una reserva deberá representar, cuando corresponda:

- Componentes base.
- Valor de cada componente.
- Modificadores.
- Total antes de Hambre.
- Cantidad de Dados de Hambre.
- Dados normales.
- Dificultad.
- Contexto opcional.

## Componentes base

Una reserva podrá construirse con:

- Atributo + Habilidad.
- Atributo + Atributo cuando una regla lo requiera.
- Un único valor.
- Valores definidos por una acción o Poder.
- Cantidad manual.

El motor no deberá asumir una única fórmula universal.

## Constructor de reserva

La construcción deberá separar:

1. Selección de componentes.
2. Cálculo del valor base.
3. Aplicación de modificadores.
4. Determinación de reserva final.
5. Sustitución correspondiente por Dados de Hambre.
6. Ejecución.

Cada paso deberá poder validarse.

## Modificadores

Los modificadores podrán ser positivos o negativos cuando las reglas lo permitan.

La interfaz mostrará:

- Reserva base.
- Modificadores aplicados.
- Reserva final.

Los modificadores podrán incluir una descripción breve de origen cuando sea útil.

## Reserva mínima

Las situaciones donde la reserva se reduzca a valores muy bajos o cero deberán resolverse según las reglas V5 implementadas.

No se improvisarán resultados en la interfaz.

Los casos especiales tendrán reglas y pruebas explícitas.

## Hambre

La cantidad de Dados de Hambre se determinará a partir del contexto del personaje y de la reserva final según las reglas aplicables.

El sistema deberá evitar cantidades imposibles.

## Dificultad

La dificultad será opcional.

Cuando exista:

- Será un valor validado.
- Se utilizará para determinar éxito o fracaso.
- Se conservará en el resultado y en historial cuando corresponda.

## Tirada vinculada

Una tirada vinculada podrá obtener datos desde un personaje autorizado.

Ejemplos:

- Atributo.
- Habilidad.
- Hambre.
- Datos de una acción definida.

Los valores deberán leerse en el momento de construir la reserva.

## Tirada manual

El usuario podrá introducir una reserva directamente cuando tenga permisos para utilizar la herramienta.

Como mínimo podrá especificar:

- Número total de dados.
- Dados de Hambre aplicables.
- Dificultad opcional.
- Descripción opcional.

La interfaz validará antes de ejecutar.

## Confirmación previa

Antes de lanzar, la interfaz deberá permitir ver claramente la reserva final.

No será obligatorio añadir una pantalla adicional si la información ya es visible de forma inequívoca.

## Ejecución

Una vez confirmada:

1. La reserva se congela para esa tirada.
2. Se generan resultados.
3. El motor interpreta los dados.
4. Se devuelve un resultado estructurado.
5. Se persiste si el contexto requiere historial.

Cambios posteriores en la ficha no alterarán una tirada ya realizada.

## Repetición

Repetir una tirada deberá crear una nueva ejecución.

No se sobrescribirá el resultado anterior cuando exista historial.

## Rerolls

Las mecánicas de repetición parcial de dados, cuando se implementen, deberán:

- Mantener relación con la tirada original.
- Identificar qué dados fueron repetidos.
- Aplicar reglas específicas.
- Conservar trazabilidad suficiente.

No forman parte obligatoria de la primera versión del motor.

## Resultado estructurado

La ejecución devolverá como mínimo:

- Dados individuales.
- Tipo de cada dado.
- Éxitos.
- Resultado especial cuando exista.
- Dificultad.
- Resultado global cuando sea calculable.

## Errores

Se deberán gestionar de forma comprensible:

- Reserva inválida.
- Valores fuera de rango.
- Personaje no autorizado.
- Datos inexistentes.
- Estado incompatible.
- Error inesperado del sistema.

## Idempotencia

Una solicitud de ejecución no deberá duplicar accidentalmente una tirada persistida por reintentos técnicos cuando se implemente una API susceptible a ello.

## Pruebas

Se incluirán pruebas para:

- Construcción desde atributo y habilidad.
- Otras combinaciones.
- Modificadores positivos y negativos.
- Hambre.
- Dificultad.
- Reservas límite.
- Tiradas manuales.
- Congelación de datos.
- Errores.
- Repetición.

## Criterios de aceptación

- Reserva final transparente para el usuario.
- Construcción flexible.
- Modificadores correctamente aplicados.
- Hambre correctamente integrada.
- Ejecución independiente de la interfaz.
- Tiradas realizadas inmutables respecto a cambios posteriores.
- Preparado para rerolls e historial sin rediseño del núcleo.
