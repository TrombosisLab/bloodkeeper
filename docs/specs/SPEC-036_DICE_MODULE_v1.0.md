# SPEC-036 – DICE_MODULE

## Información
| Campo | Valor |
|---|---|
| Código | SPEC-036 |
| Documento | DICE_MODULE.md |
| Proyecto | Vampiro V5 Revolution |
| Versión | 1.0 |
| Estado | Aprobado |

## Propósito

Definir la arquitectura funcional general del sistema de tiradas de dados de Vampiro V5 Revolution conforme a las reglas V5 implementadas.

## Objetivos

- Ejecutar tiradas de forma rápida y comprensible.
- Integrarse con la ficha de personaje.
- Diferenciar dados normales y Dados de Hambre.
- Interpretar resultados mediante un motor centralizado.
- Mantener historial contextual cuando se implemente.
- Evitar lógica de dados duplicada en otros módulos.

## Principios

- El módulo de dados será independiente del módulo de personajes.
- Recibirá datos necesarios mediante interfaces definidas.
- Las reglas de resolución estarán centralizadas.
- La interfaz no interpretará resultados por sí sola.
- Cada tirada deberá ser reproducible conceptualmente a partir de sus datos registrados, sin requerir almacenar semillas aleatorias salvo necesidad futura.

## Reserva de dados

Una tirada deberá poder construirse a partir de:

- Atributo.
- Habilidad.
- Otros valores permitidos por reglas.
- Modificadores.
- Hambre.
- Dificultad cuando corresponda.

La arquitectura no deberá limitar todas las tiradas a Atributo + Habilidad.

## Integración con ficha

Desde la ficha se podrá iniciar progresivamente una tirada seleccionando elementos como:

- Atributo.
- Habilidad.
- Combinaciones válidas.
- Acciones o Poderes cuando se implementen.

La ficha enviará la información al módulo de dados; no ejecutará la resolución.

## Dados normales

Los dados normales utilizarán d10 y se evaluarán según las reglas V5 implementadas.

## Dados de Hambre

Cuando corresponda, parte de la reserva será sustituida por Dados de Hambre según el valor actual del personaje y las reglas aplicables.

Los Dados de Hambre deberán:

- Ser distinguibles visualmente.
- Mantenerse identificados individualmente en el resultado.
- Participar correctamente en la interpretación de resultados especiales.

## Límites de reserva

El sistema deberá gestionar correctamente situaciones donde:

- El Hambre sea cero.
- El Hambre sea menor que la reserva.
- El Hambre iguale o supere la cantidad de dados disponibles.

Las reglas exactas deberán estar centralizadas y cubiertas por pruebas.

## Resultados

El motor deberá calcular, según las reglas implementadas:

- Éxitos.
- Críticos.
- Críticos conflictivos cuando corresponda.
- Fallos.
- Fallos bestiales cuando corresponda.
- Otros resultados V5 aprobados para implementación.

La interfaz recibirá un resultado estructurado.

## Dados individuales

Cada dado deberá conservar, al menos durante la resolución:

- Valor obtenido.
- Tipo de dado.
- Participación en combinaciones relevantes cuando sea necesario para explicar el resultado.

## Aleatoriedad

Se utilizará un generador aleatorio apropiado para el contexto de una aplicación de juego.

No se requiere criptografía para las tiradas salvo que una futura especificación lo exija.

No se manipularán resultados para favorecer resultados concretos.

## Tiradas manuales

La arquitectura podrá permitir tiradas construidas manualmente indicando:

- Número de dados.
- Dados de Hambre.
- Dificultad.

Esto facilitará situaciones no vinculadas directamente a una ficha.

## Dificultad

Cuando una tirada tenga dificultad:

- Se registrará como parte del contexto.
- El motor podrá determinar éxito o fracaso global.

La ausencia de dificultad deberá ser válida para tiradas donde solo interese contar éxitos.

## Modificadores

Los modificadores deberán aplicarse antes de lanzar la reserva.

La interfaz mostrará claramente:

- Reserva base.
- Modificador.
- Reserva final.

## Rouse Checks y tiradas especiales

Las tiradas con reglas específicas no deberán implementarse como excepciones improvisadas en la interfaz.

Se modelarán mediante tipos de tirada o reglas especializadas reutilizando el motor base cuando sea posible.

## Presentación

Los resultados deberán mostrar claramente:

- Dados normales.
- Dados de Hambre.
- Número de éxitos.
- Resultado especial.
- Éxito o fracaso cuando exista dificultad.

La presentación deberá ser comprensible sin conocer detalles internos del algoritmo.

## Animaciones

Las animaciones de dados serán opcionales.

No deberán:

- Retrasar innecesariamente el resultado.
- Bloquear la accesibilidad.
- Condicionar la lógica.

La funcionalidad tendrá prioridad sobre efectos visuales.

## Contexto

Una tirada podrá asociarse en el futuro a:

- Usuario.
- Personaje.
- Crónica.
- Sesión.
- Acción o descripción.

Estas asociaciones serán opcionales según el tipo de tirada.

## Permisos

Un usuario solo podrá utilizar datos de personajes a los que tenga acceso.

La autorización se validará antes de construir reservas desde recursos protegidos.

## Persistencia

No todas las tiradas deberán persistirse obligatoriamente.

Cuando se habilite historial, se almacenarán los datos necesarios para consultar:

- Contexto.
- Reserva.
- Resultados individuales.
- Resultado interpretado.
- Fecha.
- Usuario.

## API interna

El motor de dados deberá exponer operaciones claras y testeables.

No dependerá directamente de componentes de interfaz ni de la base de datos para resolver una tirada pura.

## Pruebas

Se incluirán pruebas extensivas para:

- Conteo de éxitos.
- Críticos.
- Dados de Hambre.
- Resultados especiales.
- Límites de reserva.
- Dificultad.
- Modificadores.
- Tiradas especiales.
- Casos extremos.

Las pruebas del motor utilizarán resultados controlados o inyección de aleatoriedad para ser deterministas.

## Implementación incremental

Orden recomendado:

1. Motor d10 básico.
2. Conteo de éxitos.
3. Críticos.
4. Dados de Hambre.
5. Resultados especiales.
6. Constructor de reservas.
7. Integración con ficha.
8. Historial.
9. Tiradas especiales.

Cada incremento deberá probarse antes de continuar.

## Criterios de aceptación

- Motor independiente y testeable.
- Dados normales y de Hambre correctamente diferenciados.
- Interpretación centralizada.
- Integración limpia con personajes.
- Resultados comprensibles.
- Preparado para historial y contexto de crónica.
- Sin lógica de resolución duplicada en la interfaz.
