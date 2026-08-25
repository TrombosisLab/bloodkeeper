# SPEC-056 – CHARACTER_EXPERIENCE_AND_ADVANCEMENT

## Información

| Campo | Valor |
|---|---|
| Código | SPEC-056 |
| Documento | CHARACTER_EXPERIENCE_AND_ADVANCEMENT.md |
| Proyecto | Vampiro V5 Revolution |
| Versión | 1.0 |
| Estado | Aprobado |
| Orden operativo | Después de SPEC-035 y antes de SPEC-036 |

## Propósito

Definir el sistema de Experiencia y evolución de personajes después de la
creación, separando de forma explícita la progresión durante la crónica de las
reglas de creación inicial.

El sistema deberá registrar concesiones y gastos de Experiencia, calcular los
costes reglamentarios de Vampiro V5, validar cada mejora en contexto de
evolución y aplicar los cambios al personaje de forma atómica, trazable y
autorizada.

## Dependencias

Esta SPEC reutilizará y no duplicará los dominios definidos por:

- SPEC-023 — Atributos, Habilidades y Especialidades.
- SPEC-025 — Disciplinas, Poderes, Rituales, Ceremonias y Fórmulas.
- SPEC-026 — Ventajas, Trasfondos, Méritos y Defectos.
- SPEC-027 — estados de Sangre cuando proceda.
- SPEC-029 — validación global y contexto `evolution`.
- SPEC-031 — participantes, roles Narrador/Jugador y autorización contextual.
- SPEC-035 — sesiones de crónica.

La implementación funcional de SPEC-056 no comenzará antes de cerrar
SPEC-035. Después de SPEC-035 tendrá prioridad operativa antes de iniciar
SPEC-036.

## Fuentes normativas

La implementación deberá contrastarse siempre con los manuales V5 disponibles
en el proyecto.

Fuentes ya confirmadas para este contrato:

- Libro Básico V5, págs. 130–131: concesión de Experiencia durante la crónica.
- Libro Básico V5, págs. 151–152: tabla de costes de Rasgos y compra
  incremental.
- Guía de Juego V5, pág. 92: Ceremonias de Olvido, coste y prerrequisitos.

Si una expansión introduce una regla distinta o adicional para un elemento
concreto, deberá verificarse en su fuente antes de implementarla. No se
inferirán costes por analogía.

## Conceptos de Experiencia

El sistema distinguirá al menos:

- Experiencia total obtenida.
- Experiencia gastada.
- Experiencia disponible.

La Experiencia disponible se derivará de las operaciones registradas y nunca
podrá ser negativa.

No se mantendrán contadores independientes que puedan divergir del historial
de operaciones.

## Concesión de Experiencia

Como regla V5 de referencia:

- El Narrador concede 1 punto de Experiencia por sesión jugada.
- El Narrador concede 1 punto adicional al final de cada historia.
- En crónicas de progreso más rápido puede conceder 2 puntos por personaje al
  final de cada sesión.

Al completar explícitamente una sesión, la aplicación concederá 1 punto de
Experiencia a cada personaje registrado en su asistencia. La asistencia solo
podrá modificarse mientras la sesión permanezca en preparación y quedará
cerrada al completarla.

La finalización seguirá siendo una operación explícita y autorizada del
Narrador. Las concesiones adicionales por final de historia o ritmo rápido
seguirán siendo operaciones explícitas y autorizadas.

Cuando exista una sesión asociada, la concesión podrá referenciarla. El final
de una historia podrá registrarse como motivo de concesión sin obligar a crear
prematuramente una entidad Historia independiente.

Se evitarán concesiones duplicadas accidentales para el mismo personaje,
sesión y motivo. Una corrección deberá quedar registrada, no borrar
silenciosamente el historial previo.

## Experiencia inicial por edad

Cuando el flujo de creación utilice categorías de edad que otorguen
Experiencia inicial, se respetarán las reglas V5 confirmadas:

- Neonato: 15 puntos de Experiencia para gastar.
- Ancilla: 35 puntos de Experiencia para gastar.

Esta Experiencia reutilizará el mismo motor de costes, pero deberá permanecer
diferenciada conceptualmente de la Experiencia obtenida durante sesiones de
una crónica.

No se alterarán personajes existentes de forma retroactiva sin una migración o
decisión explícita.

## Costes reglamentarios

La primera versión del motor de costes utilizará las reglas V5 confirmadas:

| Mejora | Coste de Experiencia |
|---|---|
| Incrementar Atributo | nuevo nivel × 5 |
| Incrementar Habilidad | nuevo nivel × 3 |
| Nueva Especialidad | 3 |
| Disciplina de Clan | nuevo nivel × 5 |
| Otra Disciplina | nuevo nivel × 7 |
| Disciplina Caitiff | nuevo nivel × 6 |
| Ritual de Hechicería de Sangre | nivel del Ritual × 3 |
| Fórmula de Alquimia de Sangre Débil | nivel de la Fórmula × 3 |
| Ceremonia de Olvido | nivel de la Ceremonia × 3 |
| Ventaja | 3 por punto |
| Potencia de Sangre | nuevo nivel × 10 |

Los costes se calcularán desde el estado actual real del personaje.

Cuando una regla use “nuevo nivel”, el personaje deberá comprar los niveles de
forma secuencial. No podrá saltarse niveles para pagar únicamente el coste del
destino final.

## Atributos y Habilidades

Una mejora de Atributo o Habilidad:

1. partirá de la puntuación persistida actual;
2. calculará el coste del nivel inmediatamente siguiente;
3. comprobará el máximo permitido y cualquier restricción aplicable;
4. comprobará Experiencia disponible;
5. aplicará gasto y nueva puntuación en una única operación.

La interfaz no modificará directamente la puntuación para simular una compra.

## Especialidades

Comprar una Especialidad costará 3 puntos de Experiencia.

Se reutilizarán las reglas de Habilidades y Especialidades existentes para:

- exigir una Habilidad válida;
- impedir duplicados;
- conservar identidad estable;
- diferenciar las Especialidades adquiridas durante creación de las adquiridas
  durante evolución cuando el modelo necesite conocer su origen.

## Disciplinas y Poderes

El coste de una Disciplina dependerá de su relación con el personaje:

- Disciplina de Clan: nuevo nivel × 5.
- Otra Disciplina: nuevo nivel × 7.
- Caitiff: nuevo nivel × 6.

La clasificación deberá resolverse desde los catálogos y reglas de dominio
existentes; nunca desde etiquetas de interfaz.

Al incrementar una Disciplina, la adquisición de Poderes deberá validarse con
SPEC-025 y sus catálogos canónicos.

No se cobrará un coste de Experiencia separado por un Poder si la fuente
normativa aplicable no establece dicho coste.

Se respetarán todos los prerrequisitos de nivel, Disciplina, clan, origen y
cualquier otro requisito ya implementado.

## Rituales, Fórmulas y Ceremonias

Podrán adquirirse mediante evolución cuando el personaje cumpla los
prerrequisitos reglamentarios.

Costes confirmados:

- Ritual de Hechicería de Sangre: nivel × 3.
- Fórmula de Alquimia de Sangre Débil: nivel × 3.
- Ceremonia de Olvido: nivel × 3.

Las Ceremonias de Olvido deberán respetar además sus Poderes prerrequisito.

Los requisitos narrativos de aprendizaje, investigación, maestro o tiempo
establecidos por los manuales no se convertirán automáticamente en
temporizadores de aplicación. Se conservarán como requisitos de dominio o
información narrativa cuando el flujo funcional los necesite.

## Ventajas

La adquisición o mejora permanente de una Ventaja mediante Experiencia costará
3 puntos por punto adquirido cuando la fuente normativa permita esa compra.

Se reutilizarán íntegramente:

- catálogo canónico;
- ratings permitidos;
- relaciones padre/hijo;
- detalles estructurados;
- incompatibilidades;
- requisitos de edad, clan u otros;
- reglas de adquisición contextual.

Los Defectos no se tratarán como una compra de Experiencia salvo que una fuente
normativa específica establezca una operación distinta.

Las Ventajas temporales obtenidas narrativamente no deberán confundirse con
compras permanentes de Experiencia.

## Potencia de Sangre

Incrementar Potencia de Sangre costará nuevo nivel × 10.

La operación deberá respetar los límites y dependencias de generación, tipo de
personaje y reglas de Sangre implementadas.

No se permitirá usar el gasto de Experiencia para crear un estado que el
validador global considere mecánicamente imposible.

## Motor de evolución

Toda compra utilizará el contexto de validación `evolution` definido por
SPEC-029.

El motor deberá ofrecer una operación de previsualización que permita conocer,
antes de confirmar:

- mejora solicitada;
- puntuación actual y nueva cuando proceda;
- coste;
- Experiencia disponible;
- prerrequisitos incumplidos;
- consecuencias o dependencias relevantes.

La decisión final de validez procederá del dominio/backend.

La UI no duplicará fórmulas de coste ni reglas de elegibilidad.

## Atomicidad y concurrencia

Una compra de Experiencia deberá ser atómica:

1. comprobar autorización;
2. cargar personaje y saldo vigentes;
3. comprobar revisión/concurrencia;
4. calcular y validar coste;
5. validar el estado resultante en contexto `evolution`;
6. registrar el gasto;
7. aplicar la mejora;
8. incrementar la revisión correspondiente.

Si cualquier paso falla, ni el gasto ni la mejora podrán quedar aplicados de
forma parcial.

Los conflictos concurrentes deberán producir una respuesta explícita y
recuperable.

## Historial de Experiencia

Las concesiones, gastos y correcciones formarán un historial cronológico.

Cada movimiento deberá poder identificar como mínimo:

- personaje;
- tipo de movimiento;
- cantidad;
- actor autorizado;
- fecha técnica;
- motivo;
- relación con sesión cuando exista;
- adquisición o mejora asociada cuando sea un gasto.

Los movimientos ya consolidados no se eliminarán para “arreglar” el saldo.
Las correcciones se realizarán mediante una operación compensatoria o
mecanismo equivalente trazable.

Este historial es mecánico y deberá diferenciarse del historial narrativo de
SPEC-028 y de la auditoría técnica de la plataforma.

## Permisos

La autorización se comprobará siempre en backend.

Como mínimo:

- un Narrador autorizado de la crónica podrá conceder Experiencia;
- un jugador/propietario podrá gastar Experiencia de un personaje para el que
  tenga autorización, sujeto a las reglas mecánicas;
- el rol técnico de Administrador no sustituirá automáticamente al Narrador en
  decisiones narrativas;
- un personaje archivado no podrá evolucionar mientras permanezca archivado.

No se habilitará auto-concesión de Experiencia al propietario por defecto.

La política de concesión para personajes sin crónica deberá resolverse de forma
explícita contra SPEC-017/SPEC-018 antes de habilitarse; no se inferirá.

## Integración con sesiones

Tras SPEC-035, una sesión podrá servir como origen de concesiones de
Experiencia.

Al completar una sesión, cada personaje registrado en su asistencia recibirá
automáticamente la concesión estándar de 1 punto de Experiencia por sesión
jugada.

La operación deberá impedir duplicados accidentales, conservar quién realizó
la finalización y tolerar reintentos sin volver a conceder el mismo punto. Una
corrección posterior se registrará como un nuevo movimiento trazable.

La interfaz del Narrador podrá permitir concesiones adicionales de forma
individual o controlada en grupo cuando corresponda otro motivo autorizado.

## Integración con la ficha

La ficha persistida mostrará de forma clara:

- Experiencia disponible.
- Experiencia gastada.
- Experiencia total.

La evolución deberá accederse mediante una acción específica y no mediante la
edición libre de los valores mecánicos.

El historial detallado podrá mostrarse en una vista secundaria para no
sobrecargar la ficha de juego.

Tras una compra válida, la ficha deberá reflejar inmediatamente tanto el nuevo
Rasgo como el nuevo saldo de Experiencia.

## Personajes borrador, activos y archivados

- Borrador: podrá utilizar Experiencia inicial de creación cuando corresponda.
- Activo: podrá utilizar el sistema normal de evolución.
- Archivado: no podrá recibir compras de evolución mientras esté archivado.

Reactivar un personaje devolverá el acceso a evolución sólo si sigue
cumpliendo las reglas de ciclo de vida y permisos.

## Persistencia

La Experiencia no se almacenará únicamente como tres números editables.

El modelo persistente deberá conservar movimientos suficientes para reconstruir
total, gastado y disponible.

Las relaciones con personaje, actor y sesión serán explícitas cuando existan.

Los cambios de puntuación realizados por evolución deberán seguir utilizando
los modelos canónicos del personaje; no se crearán copias paralelas de
Atributos, Habilidades, Disciplinas o Ventajas.

## Errores esperados

El dominio distinguirá, como mínimo:

- Experiencia insuficiente.
- Compra no permitida.
- Prerrequisito incumplido.
- Nivel no consecutivo.
- Rasgo ya al máximo.
- Movimiento duplicado.
- Personaje archivado.
- Falta de permiso.
- Conflicto de revisión.
- Datos de catálogo o regla no disponibles.

Los mensajes de UI consumirán errores estructurados del backend.

## Fuera de alcance inicial

No forman parte de la primera implementación obligatoria:

- mercados o economía ajena a Experiencia;
- automatizar entrenamiento mediante tiempo real;
- temporizadores de semanas para aprendizaje;
- árboles de progresión inventados;
- costes no respaldados por los manuales disponibles;
- permitir al jugador editar manualmente total/gastado/disponible;
- conceder Experiencia por IA o por heurísticas automáticas;
- reescribir retrospectivamente el historial para cuadrar saldos.

## Pruebas

Se incluirán pruebas para:

- concesión estándar por sesión;
- concesión de final de historia;
- concesión rápida de 2 puntos cuando el Narrador la seleccione;
- prevención de concesión duplicada;
- Experiencia inicial de Neonato y Ancilla cuando aplique;
- cálculo de cada coste reglamentario;
- compra incremental sin saltar niveles;
- Experiencia insuficiente;
- Atributos;
- Habilidades;
- Especialidades;
- Disciplina de Clan;
- Disciplina no de Clan;
- Caitiff;
- Rituales;
- Fórmulas;
- Ceremonias y sus prerrequisitos;
- Ventajas;
- Potencia de Sangre;
- validación en contexto `evolution`;
- personaje archivado;
- permisos de Narrador y propietario;
- concurrencia;
- atomicidad entre gasto y mejora;
- historial y correcciones;
- relación opcional con sesión;
- lectura de disponible/gastada/total en ficha;
- ausencia de lógica de costes duplicada en frontend.

## Criterios de aceptación

- El saldo de Experiencia es trazable y no puede divergir del historial.
- Sólo actores autorizados pueden conceder o gastar Experiencia.
- Los costes V5 se calculan en dominio desde el estado real del personaje.
- No se pueden saltar niveles ni gastar más Experiencia de la disponible.
- Las compras respetan prerrequisitos y validación `evolution`.
- Gasto y mejora se aplican de forma atómica.
- Sesiones pueden originar concesiones sin automatización irreversible.
- La ficha muestra total, gastada y disponible de forma coherente.
- El historial mecánico de Experiencia queda separado del historial narrativo.
- La implementación reutiliza SPEC-023/025/026/029/031/035 sin crear sistemas
  paralelos.
