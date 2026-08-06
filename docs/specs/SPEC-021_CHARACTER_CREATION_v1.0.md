# SPEC-021 – CHARACTER_CREATION

## Información
| Campo | Valor |
|---|---|
| Código | SPEC-021 |
| Documento | CHARACTER_CREATION.md |
| Proyecto | Vampiro V5 Revolution |
| Versión | 1.0 |
| Estado | Aprobado |

## Propósito

Definir el asistente modular de creación de personajes de Vampiro: La Mascarada V5.

## Objetivo

Permitir crear personajes mediante un proceso guiado por fases, comprensible para usuarios con distinto nivel de experiencia y alineado con las reglas V5 implementadas en el sistema.

Cada fase completará una parte concreta de la ficha y validará sus propias reglas antes de avanzar.

## Principios

- Creación progresiva.
- Una responsabilidad principal por fase.
- Reglas centralizadas y verificables.
- No duplicar lógica entre creación, ficha y edición.
- Información clara sobre decisiones pendientes y errores.
- Posibilidad futura de guardar progreso incompleto.
- Diseño preparado para ampliar contenido sin rehacer el flujo completo.

## Flujo general

El proceso se organizará en fases claramente identificadas.

La división exacta podrá ajustarse durante la implementación si mejora la experiencia sin alterar las reglas ni mezclar responsabilidades.

## Fase 1 – Identidad

Recogerá los datos principales de cabecera:

- Nombre del personaje.
- Concepto.
- Depredador.
- Crónica.
- Ambición.
- Clan.
- Sire.
- Deseo.
- Generación.

Los campos que dependan de opciones controladas deberán utilizar selectores o mecanismos guiados cuando corresponda.

## Fase 2 – Atributos

Permitirá asignar las puntuaciones de:

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

La asignación deberá respetar las reglas de creación V5 configuradas.

La interfaz mostrará claramente:

- Puntos disponibles.
- Puntos utilizados.
- Distribución válida o inválida.
- Motivo de cualquier error.

Podrá existir un botón de reparto aleatorio, siempre que el resultado generado cumpla estrictamente las reglas aplicables.

## Fase 3 – Habilidades

Permitirá distribuir habilidades siguiendo los métodos de creación admitidos por las reglas implementadas.

La interfaz deberá impedir finalizar una distribución inválida.

## Fase 4 – Salud y Fuerza de Voluntad

Los valores derivados se calcularán desde los atributos correspondientes según las reglas centralizadas.

La creación no duplicará fórmulas dentro de la interfaz.

## Fase 5 – Clan y elementos relacionados

Cuando corresponda, se aplicarán o seleccionarán los elementos asociados al clan y a las decisiones previas del personaje.

Las dependencias deberán mostrarse de forma comprensible.

## Fase 6 – Disciplinas

Permitirá seleccionar niveles y poderes válidos según las reglas, clan, opciones disponibles y decisiones anteriores.

## Fase 7 – Ventajas, trasfondos y defectos

Gestionará la selección y distribución de estos elementos con validación de límites, requisitos e incompatibilidades.

## Fase 8 – Humanidad y elementos narrativos

Gestionará los elementos correspondientes de creación relacionados con Humanidad y otros componentes narrativos que se definan en las reglas del proyecto.

## Fase 9 – Revisión

Antes de finalizar se mostrará un resumen completo.

La revisión deberá indicar:

- Secciones completas.
- Errores.
- Decisiones pendientes.
- Advertencias relevantes.

No se permitirá finalizar un personaje inválido.

## Navegación entre fases

El usuario podrá volver a fases anteriores.

Cuando un cambio invalide decisiones posteriores, el sistema deberá:

1. Detectarlo.
2. Informar claramente.
3. Solicitar confirmación cuando pueda perderse información.
4. Revalidar las fases dependientes.

## Validación

Las reglas deberán implementarse en servicios o componentes de dominio reutilizables.

La interfaz únicamente presentará resultados y errores.

No se mantendrán copias independientes de las mismas reglas en distintas pantallas.

## Reparto aleatorio

Cuando exista una opción de distribución aleatoria:

- Siempre generará una configuración válida.
- No otorgará ventajas fuera de las reglas.
- Permitirá volver a generar antes de confirmar.
- Será equivalente funcionalmente a una distribución manual válida.

## Persistencia del progreso

La arquitectura deberá permitir incorporar guardado de borradores.

Un personaje incompleto deberá diferenciarse claramente de uno finalizado.

## Experiencia de usuario

El asistente mostrará:

- Fase actual.
- Progreso global.
- Acciones anterior/siguiente.
- Estado de validación.
- Resumen de recursos disponibles cuando corresponda.

No deberá exigir al usuario interpretar mensajes técnicos.

## Reglas y contenido oficial

Las reglas implementadas deberán corresponder a Vampiro V5 y estar documentadas internamente mediante referencias suficientes para mantenimiento.

No se reproducirán extensos textos protegidos de manuales oficiales.

## Pruebas

Cada fase deberá disponer de pruebas para:

- Configuraciones válidas.
- Configuraciones inválidas.
- Límites.
- Dependencias entre fases.
- Cambios que invaliden decisiones posteriores.
- Distribuciones aleatorias cuando existan.

## Implementación incremental

El asistente no se construirá completo de una sola vez.

Orden recomendado:

1. Esqueleto del asistente.
2. Identidad.
3. Atributos.
4. Validación.
5. Habilidades.
6. Valores derivados.
7. Resto de fases progresivamente.

Cada incremento deberá quedar funcional y probado antes de continuar.

## Criterios de aceptación

- Flujo guiado y comprensible.
- Validación de reglas centralizada.
- Navegación segura entre fases.
- Imposibilidad de finalizar personajes inválidos.
- Distribución aleatoria válida cuando esté disponible.
- Integración limpia con la ficha.
- Arquitectura preparada para añadir contenido y reglas sin código espagueti.
