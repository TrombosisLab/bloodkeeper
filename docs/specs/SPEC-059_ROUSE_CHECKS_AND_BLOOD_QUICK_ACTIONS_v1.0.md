# SPEC-059 – ROUSE_CHECKS_AND_BLOOD_QUICK_ACTIONS

## Información

| Campo | Valor |
|---|---|
| Código | SPEC-059 |
| Documento | SPEC-059_ROUSE_CHECKS_AND_BLOOD_QUICK_ACTIONS_v1.0.md |
| Proyecto | BloodKeeper / Vampiro V5 Revolution |
| Versión | 1.0 |
| Estado | **Aprobado — pendiente de implementación** |
| Baseline auditado | `main` @ `a1e483aac786b48e91bf1b3ee8be585dfcc22873` |
| Dependencias | SPEC-027, SPEC-036–039, SPEC-057, SPEC-058 |
| Integración diferida | Adenda de SPEC-025 para costes/mecánicas estructuradas de Poderes |

---

# 1. Propósito

Implementar el **Control de Enardecimiento** como una operación especial de
primera clase, rápida, persistible e idempotente, reutilizable desde la ficha y
desde acciones contextuales.

El objetivo es que el usuario no tenga que:

- construir manualmente una reserva normal;
- interpretar el resultado como una tirada V5 ordinaria;
- modificar Hambre manualmente después;
- crear registros paralelos de historial.

La resolución reglamentaria será autoritativa en backend y reutilizará las
fronteras actuales de Personaje, Sangre, Hambre, Dados e Historial sin
duplicarlas en React.

---

# 2. Estado real detectado por la auditoría

La auditoría de entrada sobre el baseline indicado confirma:

- `Character` ya dispone de `nature` y `revision`;
- `CharacterNature` real distingue `human` y `vampire`;
- `TRANSITIONAL_VAMPIRE` y `ESTABLISHED_VAMPIRE` son fases derivadas del
  perfil, no valores adicionales de `CharacterNature`;
- `CharacterBloodState` ya contiene `bloodPotency` y `hunger`;
- Hambre está centralmente restringida al rango entero `0..5`;
- existe `assertCharacterHungerAvailable(...)` para impedir Hambre ficticia en
  humanos o personajes sin estado de Sangre;
- existe motor de dados d10 con dados `normal` / `hunger`, éxitos, críticos,
  críticos conflictivos y fallos bestiales;
- existe historial persistido de tiradas;
- el historial distingue actualmente las fuentes:
  `manual`, `character` y `action`;
- existe concurrencia optimista mediante `expectedRevision`;
- existen patrones idempotentes mediante identificadores de operación en
  operaciones mecánicas de Personaje;
- SPEC-058 ya implementa una operación transaccional de Sangre/Resonancia que
  conserva `hungerBefore` y `hungerAfter`;
- SPEC-058 ya contiene una Discrasia con efecto estructurado
  `rouseCheckExemption` para `blushOfLife`;
- no existe actualmente un contrato implementado de `ROUSE_CHECK`;
- no existe SPEC-059 dentro de `docs/specs/`;
- no se ha localizado un sistema de Frenesí/Torpor suficientemente completo
  como para hacerlo consumidor automático de esta SPEC.

Por tanto, SPEC-059 debe ser aditiva y no reimplementar ninguno de esos
contratos.

---

# 3. Rutas reales relevantes

La implementación deberá auditar y reutilizar, entre otras, estas rutas reales:

```text
apps/api/prisma/schema.prisma

apps/api/src/characters/domain/persisted-character.types.ts
apps/api/src/characters/domain/character-transition.rules.ts
apps/api/src/characters/domain/character-hunger.rules.ts
apps/api/src/characters/domain/character-state.rules.ts
apps/api/src/characters/domain/character-blood-potency.rules.ts
apps/api/src/characters/domain/character-blood-resonance.types.ts

apps/api/src/characters/application/apply-character-blood-resonance.use-case.ts
apps/api/src/characters/infrastructure/prisma-character-draft.repository.ts

apps/api/src/dice/domain/dice-roll.types.ts
apps/api/src/dice/domain/dice-roll.rules.ts
apps/api/src/dice/domain/dice-history.types.ts
apps/api/src/dice/application/dice-execution.ts
apps/api/src/dice/application/dice-roll.repository.ts
apps/api/src/dice/application/dice-history.use-cases.ts
apps/api/src/dice/application/record-character-dice-roll.use-case.ts
apps/api/src/dice/infrastructure/prisma-dice-roll.repository.ts
apps/api/src/dice/presentation/dice.dto.ts
apps/api/src/dice/presentation/dice-history.dto.ts

apps/web/src/features/character-sheet/components/CharacterSheet.tsx
apps/web/src/features/character-sheet/components/CharacterState.tsx
apps/web/src/features/character-sheet/components/HungerTrack.tsx
apps/web/src/features/character-sheet/components/PersistedCharacterFeeding.tsx
apps/web/src/features/character-sheet/infrastructure/character-blood-resonance.api.ts

apps/web/src/features/character-creation/types/discipline-power.types.ts
apps/web/src/features/character-creation/domain/discipline-power-dice-read-model.ts
apps/web/src/features/character-creation/data/discipline-power-definitions.ts

packages/character-rules/catalogs/blood-dyscrasias.json
packages/character-rules/index.d.ts
```

Los nombres finales de nuevos tipos deben ajustarse al estilo real del módulo
donde se incorporen.

---

# 4. Fuentes normativas verificadas

Fuente principal:

- **Vampiro: La Mascarada V5, Libro Básico en español**.

Reglas contrastadas en la copia aportada al proyecto:

- pág. impresa 211: Control de Enardecimiento;
- pág. impresa 217: Potencia de Sangre y repetición contextual;
- pág. impresa 218: Rubor de la Vida, Arrebato de Sangre y curación;
- pág. impresa 219: Despertar y consecuencias especiales relacionadas.

No se incorporará texto extenso del manual al repositorio.

Se almacenarán únicamente reglas estructuradas, números, claves y resúmenes
propios breves.

---

# 5. Mecánica base

Un Control de Enardecimiento ordinario lanza:

```text
1d10
```

Resolución:

```text
6–10 -> éxito
1–5  -> fallo
```

Éxito:

```text
incremento de Hambre = 0
```

Fallo ordinario cuando Hambre está entre `0` y `4`:

```text
incremento de Hambre = 1
```

El efecto que provocó el Control se resuelve aunque el Control falle; la
consecuencia sobre Hambre se aplica después.

Un Control de Enardecimiento:

- no utiliza Dados de Hambre;
- no genera críticos;
- no genera críticos conflictivos;
- no genera fallos bestiales;
- no se interpreta mediante la resolución ordinaria de una reserva V5.

---

# 6. Resolución especializada y relación con el motor de Dados

SPEC-036 exige que los Controles de Enardecimiento y tiradas especiales se
modelen mediante un tipo o regla especializada reutilizando el motor común
cuando sea apropiado.

La auditoría demuestra que el `resolveDiceRoll(...)` actual está orientado a
reservas ordinarias y calcula resultados especiales que **no aplican** al
Control de Enardecimiento.

Por tanto, SPEC-059-A introducirá una **regla pura especializada de Rouse
Check**.

No se obliga de antemano a crear un enum global llamado `ROUSE_CHECK`.

La implementación podrá añadir un discriminador estable cuando sea necesario
para persistencia o presentación, pero no alterará semánticamente
`DiceHistorySource`, cuyos valores reales actuales son:

```text
manual
character
action
```

Una ejecución de Rouse contextual encaja inicialmente como fuente `action`,
acompañada de un discriminador/contexto específico que permita distinguirla de
otras acciones.

---

# 7. Potencia de Sangre y repetición contextual

La repetición de un Control de Enardecimiento por Potencia de Sangre **no es
una regla general para todos los motivos**.

La regla verificada afecta a Controles usados para activar determinados
**Poderes de Disciplina**.

Tabla estructural mínima:

| Potencia de Sangre | Poderes cuyo Control puede repetirse |
|---:|---|
| 0 | ninguno |
| 1–2 | nivel 1 |
| 3–4 | nivel 2 o inferior |
| 5+ | nivel 3 o inferior |

Cuando proceda:

```text
se lanzan 2d10
se conserva el resultado más alto
si cualquiera obtiene 6+, el Control tiene éxito
```

No son dos Controles distintos y nunca pueden producir dos incrementos de
Hambre.

La regla pura podrá recibir de forma explícita:

```text
bloodPotency
disciplinePowerLevel
```

cuando `reason == disciplinePower`.

SPEC-059-A no necesitará consultar todavía el catálogo de Poderes para probar
esta regla.

La integración real desde un Poder adquirido queda diferida hasta que la
adenda de SPEC-025 proporcione coste y nivel/contexto estructurados suficientes.

---

# 8. Hambre 5

`CHARACTER_HUNGER_MAX` continúa siendo:

```text
5
```

Nunca se persistirá Hambre `6`.

## 8.1 Acción voluntaria

Una acción voluntaria que requiera Enardecer la Sangre no podrá iniciarse desde
la acción rápida cuando el personaje esté en Hambre 5.

El backend también validará esta restricción; la UI no será la única barrera.

## 8.2 Control provocado externamente

Si una causa externa obliga a realizar un Control en Hambre 5:

- el Control puede resolverse;
- si falla, Hambre permanece persistida en 5;
- el efecto que provocó el Control sigue resolviéndose cuando corresponda;
- el resultado deberá indicar una consecuencia estructurada equivalente a:

```text
HUNGER_FRENZY_TEST_REQUIRED
difficulty = 4
```

SPEC-059 no implementará por sí sola un sistema incompleto de Frenesí.

## 8.3 Despertar

El Despertar es una excepción normativa relevante.

Si el Control de Despertar falla estando ya en Hambre 5, la consecuencia
normativa no es el test general de Frenesí anterior, sino una consecuencia de
**Torpor**.

Mientras BloodKeeper no disponga de un contrato persistido suficientemente
completo para Torpor, SPEC-059 devolverá la consecuencia de forma estructurada
sin inventar un segundo sistema de estados.

Conceptualmente:

```text
TORPOR_TRIGGERED
```

La persistencia automática del estado queda fuera hasta existir un consumidor
canónico.

---

# 9. Consecuencias estructuradas

La resolución pura podrá expresar como mínimo:

```text
none
hungerFrenzyTestRequired
torporTriggered
```

Los nombres finales se ajustarán al estilo de tipos del backend.

No se creará un motor genérico de consecuencias sobrenaturales.

---

# 10. Contexto del Control

Cada ejecución tendrá un motivo estructurado.

Nombres de dominio propuestos, adaptados al estilo lower-camel del código:

```text
awakening
blushOfLife
bloodSurge
healing
disciplinePower
ritualOrCeremony
other
```

`other` podrá incluir una etiqueta breve y limitada.

El contexto podrá incorporar sólo cuando corresponda:

```text
disciplinePowerKey?
disciplinePowerLevel?
ritualKey?
ceremonyKey?
sessionId?
chronicleId?
label?
```

No se exigirá crear referencias ficticias si el consumidor todavía no existe.

---

# 11. Personajes humanos y vampiros en transición

La regla canónica no será:

```text
profilePhase == ESTABLISHED_VAMPIRE
```

sino la disponibilidad real de la mecánica:

```text
nature == human
-> Control no disponible

nature == vampire
+ blood == null
-> Control no disponible

nature == vampire
+ blood válido
-> elegible, sujeto al resto de reglas
```

Por tanto, un perfil `TRANSITIONAL_VAMPIRE` puede ejecutar un Control si ya
dispone de estado de Sangre/Hambre válido.

No se creará Hambre ficticia para un humano.

---

# 12. Integración con Hambre

SPEC-059 no creará un segundo tracker ni permitirá que React decida el nuevo
valor.

La operación persistida reutilizará:

- validación canónica `0..5`;
- disponibilidad real de estado de Sangre;
- `expectedRevision`;
- transacción de repositorio;
- incremento de `revision`;
- patrones de operación idempotente ya existentes.

Para un fallo ordinario:

```text
hungerAfter = min(5, hungerBefore + 1)
```

La fórmula es una descripción del resultado de dominio; la implementación
deberá pasar por las reglas canónicas existentes y no duplicar validadores.

Un retry del mismo evento devolverá el mismo resultado persistido y no volverá
a incrementar Hambre.

---

# 13. Idempotencia

El patrón conceptual `idempotencyKey` del borrador se adapta al patrón real de
operaciones del proyecto.

La operación deberá disponer de un identificador estable equivalente a:

```text
operationId
```

El retry con el mismo `operationId` y el mismo contenido:

```text
-> devuelve el resultado de la operación original
-> no vuelve a lanzar
-> no vuelve a modificar Hambre
-> no crea un segundo historial
```

Un mismo `operationId` reutilizado con contenido incompatible deberá rechazarse.

La comprobación idempotente deberá preceder al rechazo por una revisión ya
consumida cuando se trate de un retry legítimo, siguiendo los patrones
existentes.

---

# 14. Persistencia y atomicidad

SPEC-059-B implementará una operación persistida dedicada.

La frontera transaccional deberá cubrir de forma coherente:

```text
autorizar
-> validar personaje / naturaleza / Sangre
-> resolver idempotencia
-> validar expectedRevision
-> determinar regla contextual
-> generar resultado aleatorio
-> resolver Control
-> derivar hambreAfter
-> persistir cambio de Hambre
-> aplicar expiraciones ya canónicas derivadas de alcanzar Hambre 5
-> persistir operación
-> registrar historial de Dados cuando corresponda
-> incrementar revision
-> devolver resultado
```

Si cualquier paso falla, no deberá existir un estado parcial observable.

La implementación podrá ajustar el orden técnico interno para garantizar
atomicidad real con Prisma, siempre que preserve estas invariantes.

---

# 15. Relación con el historial de Dados

El historial actual ya ofrece:

- usuario;
- personaje;
- crónica/sesión cuando corresponda;
- timestamp;
- visibilidad;
- fuente;
- snapshot de tirada.

SPEC-059 no añadirá un `operationId` directamente a `DiceRollRecord` por
comodidad si ello contradice el contrato vigente de SPEC-039.

La operación de Rouse será la fuente canónica de:

```text
reason
rolls
selectedResult
success
hungerBefore
hungerAfter
consequence
contextReference
```

Cuando se cree un registro en el historial de Dados, deberá poder relacionarse
de forma estable con esa operación mediante el incremento mínimo compatible
con SPEC-039.

La decisión física exacta —referencia desde la operación al roll histórico,
discriminador aditivo en el snapshot u otra opción mínima— pertenece a la
auditoría focal de SPEC-059-B.

El historial debe mostrar el Control como una acción especial, no como reserva
normal.

---

# 16. Aleatoriedad

La resolución pura no dependerá de la base de datos ni de React.

La generación real de d10 deberá ser sustituible en tests para usar secuencias
deterministas.

Casos mínimos:

```text
5 -> fallo
6 -> éxito

2,7 -> éxito
7,2 -> éxito
2,4 -> fallo
```

Dos resultados sólo serán válidos cuando la regla contextual autorice la
repetición.

---

# 17. Acción rápida desde ficha

SPEC-059-C añadirá a una ficha persistida elegible una acción equivalente a:

```text
Control de Enardecimiento
```

Flujo mínimo:

```text
seleccionar/confirmar motivo
-> enviar operación
-> backend resuelve
-> mostrar dado(s)
-> mostrar éxito/fallo
-> mostrar Hambre antes/después
-> refrescar snapshot real
```

No abrirá el constructor general de reservas.

La UI:

- no calculará la repetición por Potencia de Sangre;
- no calculará el nuevo Hambre;
- no interpretará consecuencias reglamentarias;
- no generará un `operationId` mediante una API incompatible con HTTP local;
- reutilizará el patrón UUID con fallback ya validado por la UI de alimentación.

En Hambre 5, la acción voluntaria aparecerá bloqueada o inequívocamente no
disponible con explicación legible.

---

# 18. Integración con SPEC-058

SPEC-058 ya contiene un consumidor real futuro:

```text
effect.kind = rouseCheckExemption
action = blushOfLife
```

SPEC-059-D deberá consumir esa definición de forma canónica.

Cuando el personaje disponga legítimamente de esa exención para Rubor de la
Vida:

```text
no se ejecuta el Control correspondiente
no se modifica Hambre por ese Control omitido
```

El consumo/duración del efecto seguirá la definición canónica de la Discrasia.

No se duplicará esa regla en React.

Al alcanzar Hambre 5 mediante SPEC-059, las expiraciones de Resonancia y
Discrasias que SPEC-058 ya vincula a Hambre 5 deberán producirse en la misma
operación coherente.

---

# 19. Integración con Poderes de Disciplina

SPEC-059 no implementará la adenda de SPEC-025.

Actualmente existe:

```text
DisciplinePowerDefinition
summary
requirements
sourceKey
sourcePage
diceCheck?
```

pero todavía no existe un coste de Enardecimiento poblado de forma canónica
para todos los Poderes.

Por tanto:

- 059-A puede implementar la regla pura de Potencia de Sangre usando
  `disciplinePowerLevel` explícito;
- 059-B puede admitir contexto de Poder sin inferir costes;
- 059-C no mostrará botones falsos en todos los Poderes;
- 059-D conectará Poderes sólo cuando SPEC-025 exponga un coste estructurado
  verificable equivalente a `rouseCheckCount`.

La Disciplina nunca modificará Hambre directamente.

---

# 20. Rubor de la Vida

`blushOfLife` será un contexto real de SPEC-059-D.

Primera integración:

- resolver u omitir el Control según reglas canónicas;
- aplicar la exención de Discrasia ya existente cuando proceda;
- registrar contexto.

SPEC-059 no inventará por sí misma un estado temporal persistente de Rubor si
el proyecto todavía no dispone de ese contrato.

---

# 21. Arrebato de Sangre

`bloodSurge` será un contexto real.

SPEC-059 resolverá el Control de Enardecimiento.

El bonus posterior de dados a Atributos depende de Potencia de Sangre y
pertenece al constructor de reservas.

No se implementará como una variable local de la ficha ni se confundirá con la
repetición del propio Control.

La integración del bonus de reserva se realizará sólo mediante un consumidor
real del motor de Dados.

---

# 22. Despertar

`awakening` será un contexto soportado por el dominio.

SPEC-059 puede resolver y registrar el Control.

No automatizará un ciclo completo día/noche.

Debe preservar la consecuencia especial de fallo en Hambre 5 descrita en la
sección 8.3.

---

# 23. Curación

`healing` podrá reutilizar el mismo servicio cuando exista una acción de
curación vampírica real.

SPEC-059 no creará un segundo sistema de daño/curación.

La cantidad reparada depende de las reglas de Potencia de Sangre y pertenece al
consumidor de curación, no a la resolución básica del Control.

Los múltiples Controles requeridos por ciertos tipos de curación deberán
modelarse como operaciones/controles explícitos según las reglas del consumidor;
no se convertirán silenciosamente en “2d10 y elegir el mejor”.

---

# 24. Rituales y Ceremonias

`ritualOrCeremony` queda preparado como contexto.

No se habilitará automáticamente hasta existir datos estructurados de coste y
un consumidor real.

No se inferirán costes desde textos libres.

---

# 25. Resultado conceptual de dominio

## 059-A — resolución pura

Entrada conceptual:

```text
reason
rolls
bloodPotency?
disciplinePowerLevel?
hungerBefore?
forced?
```

Salida conceptual:

```text
rolls
selectedResult
success
hungerIncrease
consequence
```

La forma final deberá ser más estricta que este pseudocontrato y evitar campos
irrelevantes por contexto.

## 059-B — operación persistida

Entrada conceptual:

```text
characterId
reason
context?
expectedRevision
operationId
```

Salida conceptual:

```text
operationId
reason
rolls
selectedResult
success
hungerBefore
hungerAfter
consequence
rollHistoryId?
characterRevision
```

No se consideran contractuales estos nombres hasta implementar los tipos reales.

---

# 26. Bloques de implementación

## SPEC-059-A — Dominio de Control de Enardecimiento

Scope:

- tipos de dominio mínimos;
- resolución especializada pura;
- umbral 6+;
- selección del mejor resultado cuando una regla lo autoriza;
- regla contextual de repetición por Potencia de Sangre para Poderes;
- clasificación de Hambre 5;
- clasificación de consecuencia de Despertar;
- tests deterministas.

No incluye:

- Prisma;
- endpoint;
- mutación persistida de Hambre;
- historial persistido;
- UI;
- integración con catálogo de Poderes;
- Frenesí/Torpor persistidos.

## SPEC-059-B — Operación persistida y API

Scope:

- operación persistida dedicada;
- migración aditiva si resulta necesaria;
- `operationId`;
- `expectedRevision`;
- atomicidad;
- autorización;
- lectura de Sangre real;
- modificación de Hambre;
- interacción correcta con expiraciones de SPEC-058;
- historial de Dados mediante incremento mínimo compatible;
- DTO/controller/serializer;
- tests de idempotencia y concurrencia.

## SPEC-059-C — Acción rápida de ficha

Scope:

- botón/acción accesible;
- motivos realmente utilizables;
- estado bloqueado en Hambre 5 para acciones voluntarias;
- resultado inmediato;
- dado(s) visuales de Rouse;
- Hambre antes/después;
- recarga del snapshot;
- responsive y teclado;
- sin lógica reglamentaria en React.

## SPEC-059-D — Integraciones contextuales

Scope incremental, sólo con consumidores reales:

1. Rubor de la Vida;
2. exención `rouseCheckExemption` de SPEC-058;
3. Arrebato de Sangre;
4. Despertar;
5. Poderes cuando la adenda SPEC-025 exponga coste estructurado;
6. curación cuando exista acción real;
7. Rituales/Ceremonias cuando exista coste estructurado.

Cada integración podrá subdividirse y validarse por separado.

## SPEC-059-E — Cierre

- regresión SPEC-027;
- regresión SPEC-036–039;
- regresión SPEC-057;
- regresión SPEC-058;
- typecheck;
- build;
- suites API/Web necesarias;
- migraciones;
- `scripts/check.sh`;
- runtime;
- validación visual escritorio/móvil;
- documentación de cierre.

---

# 27. Pruebas mínimas

## Dominio

- `5` es fallo;
- `6` es éxito;
- éxito ordinario produce incremento `0`;
- fallo ordinario produce incremento `1`;
- Rouse no produce crítico;
- Rouse no produce crítico conflictivo;
- Rouse no produce fallo bestial;
- `2,7` autorizado resuelve éxito;
- `7,2` autorizado resuelve éxito;
- `2,4` autorizado resuelve fallo;
- dos dados no autorizados se rechazan;
- Potencia 1 permite repetición para Poder nivel 1;
- Potencia 2 permite repetición para Poder nivel 1;
- Potencia 3 permite repetición hasta Poder nivel 2;
- Potencia 4 permite repetición hasta Poder nivel 2;
- Potencia 5 permite repetición hasta Poder nivel 3;
- la repetición de Poder no se aplica a `awakening`, `blushOfLife`,
  `bloodSurge` ni `healing` sólo por tener Potencia alta.

## Elegibilidad / Hambre

- humano no puede ejecutar Control;
- vampiro sin `blood` no puede ejecutarlo;
- vampiro transicional con `blood` válido sí puede ser elegible;
- acción voluntaria en Hambre 5 se rechaza antes de tirar;
- control externo fallido en Hambre 5 mantiene Hambre 5 y devuelve consecuencia
  de Frenesí requerida;
- Despertar fallido en Hambre 5 mantiene Hambre 5 y devuelve consecuencia de
  Torpor;
- nunca se intenta persistir Hambre 6.

## Persistencia

- fallo desde Hambre 0–4 incrementa exactamente 1;
- éxito no cambia Hambre;
- un Control nunca incrementa Hambre dos veces;
- retry con mismo `operationId` no vuelve a tirar;
- retry no vuelve a incrementar Hambre;
- retry no duplica historial;
- revisión concurrente incompatible se rechaza;
- operación fallida no deja mutación parcial;
- alcanzar Hambre 5 conserva las expiraciones canónicas de SPEC-058.

## Historial

- Rouse queda distinguible de una reserva ordinaria;
- conserva los valores de dado;
- conserva el resultado seleccionado;
- conserva éxito/fallo;
- conserva contexto;
- conserva Hambre antes/después;
- no muestra semántica de crítico/fallo bestial.

## Web

- acción rápida sólo aparece/es utilizable cuando corresponde;
- Hambre 5 voluntaria queda explicada;
- doble clic no duplica operación;
- tracker refleja el estado persistido;
- UI no calcula `hungerAfter`;
- UI no calcula la repetición por Potencia de Sangre.

---

# 28. Criterios de aceptación globales

SPEC-059 estará cerrada cuando:

- el Control de Enardecimiento exista como regla especializada real;
- utilice d10 y umbral 6+ conforme a las reglas verificadas;
- el fallo ordinario modifique Hambre de forma atómica;
- nunca persista Hambre por encima de 5;
- distinga correctamente las consecuencias especiales de Hambre 5;
- implemente correctamente la repetición contextual por Potencia de Sangre;
- no interprete el Control como una reserva V5 ordinaria;
- disponga de operación idempotente y protegida por revisión;
- disponga de historial suficiente y estable;
- la ficha ofrezca una acción rápida usable;
- humanos y vampiros sin Sangre queden excluidos correctamente;
- SPEC-058 siga siendo la fuente canónica de Resonancia/Discrasias;
- la exención de Rubor de SPEC-058 tenga consumidor real;
- la integración con Poderes espere datos estructurados de SPEC-025;
- no se creen sistemas incompletos de Frenesí, Torpor, curación o estados
  temporales;
- no haya lógica reglamentaria duplicada en React;
- las regresiones de Hambre, Dados, transición y Resonancia queden verdes.

---

# 29. Decisiones expresamente descartadas tras auditoría

No se aprobarán como contrato de SPEC-059:

```text
"Potencia alta siempre tira 2d10 en cualquier Rouse"
"TRANSITIONAL_VAMPIRE es un CharacterNature"
"ROUSE_CHECK debe ser obligatoriamente un nuevo DiceHistorySource"
"usar resolveDiceRoll normal y ocultar críticos en UI"
"fallo en Hambre 5 persiste Hambre 6"
"todo fallo forzado en Hambre 5 tiene la misma consecuencia"
"cada Poder ya conoce rouseCheckCount"
"SPEC-059 debe completar la adenda de SPEC-025"
"DiceRollRecord debe recibir operationId por conveniencia"
"React puede calcular hungerAfter"
```

---

# 30. Estado de este documento

Este documento queda **aprobado** tras la auditoría de entrada realizada sobre:

```text
main @ a1e483aac786b48e91bf1b3ee8be585dfcc22873
```

Estado operativo inicial:

```text
SPEC-059 aprobada
auditoría de entrada completada
implementación pendiente
primer bloque: SPEC-059-A
```

La aprobación documental no implica que ningún bloque funcional esté
implementado o cerrado.

Flujo siguiente:

```text
incorporación documental
-> validación del diff
-> commit sólo con autorización expresa
-> SPEC-059-A
-> validación
-> commit autorizado
-> SPEC-059-B
-> ...
```
