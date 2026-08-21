# SPEC-058 – CHARACTER_BLOOD_RESONANCE_AND_DYSCRASIA

## Información

| Campo | Valor |
|---|---|
| Código | SPEC-058 |
| Documento | `SPEC-058_CHARACTER_BLOOD_RESONANCE_AND_DYSCRASIA_v1.0.md` |
| Proyecto | BloodKeeper / Vampiro V5 Revolution |
| Versión | 1.0 |
| Estado | Cerrada |
| Baseline técnico auditado | `31a2f57c3935fecc5323e506d1dfe36ca6d69b4b` |
| Rama de desarrollo | `feature/spec-058-blood-resonance` |
| Worktree aislado | `/home/trombosis/vampiro-v5-revolution-spec058` |

## Propósito

Implementar Resonancia, Temperamento y Discrasias de Vampiro V5 como estado
mecánico real de la sangre consumida por un personaje vampiro.

La implementación deberá integrarse con los contratos existentes de:

- Hambre;
- Disciplinas;
- Dados;
- Experiencia/Evolución;
- Historial;
- ficha persistida;
- naturaleza y transición vampírica de SPEC-057.

No se duplicarán reglas ya existentes y no se utilizará la representación demo
actual de Resonancia como fuente de verdad.

## Fuentes normativas auditadas

Fuente principal:

- *Vampiro: La Mascarada V5 — Libro Básico*, págs. 226–231:
  - Resonancia;
  - los cuatro humores;
  - Temperamento y Discrasia;
  - Resonancia y Disciplinas;
  - humores animales;
  - efectos del Temperamento;
  - obtención y duración de Discrasias;
  - Resonancia y Experiencia.

Fuente complementaria:

- *Vampiro: La Mascarada V5 — Guía de Juego*, pág. 84:
  - afinidad de Olvido con sangre de personas emocionalmente distantes y
    sangre libre de Resonancia.

Fuente técnica:

- repositorio BloodKeeper auditado en el baseline indicado arriba;
- SPEC-020, SPEC-025, SPEC-027, SPEC-028, SPEC-036 a SPEC-039, SPEC-056 y
  SPEC-057 vigentes.

No se copiarán al repositorio público descripciones extensas de los manuales.

Los catálogos almacenarán únicamente:

- claves;
- nombres;
- asociaciones;
- valores mecánicos;
- resúmenes editoriales propios y breves;
- referencia de fuente y página.

## Estado real previo a SPEC-058

El código actual contiene una presentación demo:

```text
apps/web/src/features/character-sheet/components/CharacterBloodExperience.tsx
apps/web/src/features/character-sheet/data/demo-blood-experience.ts
apps/web/src/features/character-sheet/types/character-blood-experience.types.ts
```

con valores estáticos equivalentes a:

```text
Resonancia: Colérica
Temperamento: Intensa
```

`CharacterSheetModel` declara expresamente que Resonancia y Temperamento siguen
fuera de su contrato persistido.

La Experiencia de SPEC-056 ya posee un ledger real independiente. SPEC-058 no
confundirá Resonancia con el estado de Experiencia ni reutilizará los campos
demo como persistencia.

## Principios de diseño

- La Resonancia activa procede de sangre consumida; no es un Rasgo permanente
  del vampiro.
- La interfaz no calculará por sí sola beneficios normativos.
- Las claves de Disciplina reutilizarán el catálogo compartido existente.
- El bonus de Resonancia en Dados se derivará en backend/dominio.
- Un cliente no podrá concederse el bonus enviando simplemente un `+1`.
- La expiración se resolverá desde dominio/backend.
- Los personajes humanos no tendrán estado vampírico de Resonancia activa.
- Un vampiro transicional sólo podrá recibir beneficios si ya dispone de estado
  de Sangre/Hambre válido.
- Una Discrasia será una definición canónica estructurada, no texto libre,
  cuando produzca un efecto mecánico.
- Los efectos consumibles deberán ser idempotentes.
- Ausencia de Resonancia significativa será ausencia de estado, no una quinta
  Resonancia ficticia.
- Sangre animal y sangre libre de Resonancia se modelarán sin deformar las
  cuatro Resonancias humorales.

# 1. Resonancias canónicas

El Libro Básico fundamenta el sistema en **cuatro humores**.

BloodKeeper reconocerá exactamente estas cuatro Resonancias humorales:

```text
choleric    → Colérica
melancholy  → Melancólica
phlegmatic  → Flemática
sanguine    → Sanguínea
```

Tipo conceptual:

```ts
type BloodResonanceKey =
  | 'choleric'
  | 'melancholy'
  | 'phlegmatic'
  | 'sanguine'
```

No se añadirá `animalBlood` ni `resonanceFree` a este tipo.

## Asociaciones Resonancia → Disciplina

Se reutilizarán las claves reales del catálogo compartido:

```text
choleric
  → celerity
  → potence

melancholy
  → fortitude
  → obfuscate

phlegmatic
  → auspex
  → dominate

sanguine
  → bloodSorcery
  → presence
```

El catálogo de Resonancias no duplicará definiciones completas de Disciplina.

# 2. Temperamento

La Resonancia se presenta normativamente en tres Temperamentos:

```text
fleeting → Efímero
intense  → Intenso
acute    → Agudo
```

Tipo conceptual:

```ts
type BloodTemperament =
  | 'fleeting'
  | 'intense'
  | 'acute'
```

La entrada aleatoria del Libro Básico equivalente a Resonancia equilibrada o
insignificante no se convertirá en un cuarto Temperamento: representará
**ausencia de Resonancia mecánicamente significativa**.

## Efímero

- No concede un bonus general inmediato a reservas de Disciplina.
- Sí es relevante como ingrediente para Alquimia de Sangre Débil cuando el
  consumidor correspondiente lo necesite.
- Puede justificar narrativamente la adquisición de puntos en Disciplinas
  asociadas.
- No concede por sí mismo puntos temporales de Disciplina.

Resultado general:

```text
bonus de dados por Resonancia = 0
```

## Intenso

Cuando el vampiro obtiene el efecto de sangre de Resonancia intensa:

```text
+1 dado
```

a las reservas que usen una Disciplina asociada a esa Resonancia.

El bonus termina cuando:

- el vampiro vuelve a alimentarse y la Resonancia queda diluida/reemplazada;
- o alcanza Hambre/Ansia 5.

Resultado general:

```text
bonus de dados por Resonancia = +1
```

## Agudo

El Temperamento agudo:

- concede el mismo `+1 dado` que Intenso;
- incorpora una Discrasia en sangre humana;
- la Discrasia concede un efecto adicional propio.

Resultado general:

```text
bonus base de Resonancia = +1
efecto adicional = Discrasia
```

No se expresará como “puede contener una Discrasia” para sangre humana aguda.

# 3. Sangre animal

`Sangre animal` aparece en la tabla normativa de asociación con Disciplinas:

```text
Sangre animal → Animalismo, Protean
```

pero no constituye un quinto humor humano.

BloodKeeper deberá distinguir el origen/perfil de la sangre de la
`BloodResonanceKey`.

Conceptualmente deberá poder representar:

```text
bloodSourceKind = HUMAN | ANIMAL
```

y una afinidad especial equivalente a:

```text
animalBlood → animalism, protean
```

## Dos tratamientos normativos de animales

El Libro Básico permite al Narrador:

1. conectar estados de ánimo animales con una de las cuatro Resonancias
   humorales; o
2. tratar la sangre animal según especie/naturaleza con la afinidad
   Animalismo/Protean.

El modelo no debe impedir ninguna de las dos opciones.

Por tanto:

- un consumo animal puede llevar una de las cuatro Resonancias si el Narrador
  usa el modelo humoral;
- o puede usar la afinidad especial `animalBlood`;
- `animalBlood` no aumenta el recuento de Resonancias canónicas;
- los animales ordinarios no generan Discrasias.

La intensidad animal podrá alimentar el beneficio de su asociación
Animalismo/Protean cuando se utilice el tratamiento de sangre animal, sin
inventar una quinta Resonancia humoral.

# 4. Sangre libre de Resonancia y Olvido

La Guía de Juego asocia Olvido con:

- personas emocionalmente distantes;
- sangre libre de Resonancia.

BloodKeeper reconocerá este hecho como una **afinidad especial**, conceptualmente:

```text
resonanceFree → oblivion
```

No se añadirá `resonanceFree` a `BloodResonanceKey`.

La fuente auditada no basta por sí sola para afirmar que
`resonanceFree + intense` deba aplicar automáticamente el mismo `+1 dado` de
las cuatro Resonancias del Libro Básico.

Por tanto:

- 058-A podrá catalogar la afinidad;
- 058-C no aplicará un bonus automático a Olvido sin una regla normativa
  explícita adicional;
- no se inventará un quinto Temperamento ni una Resonancia “Olvido”.

# 5. Estado de sangre sin Resonancia significativa

El dominio deberá poder expresar:

```text
Sin Resonancia activa
```

Casos posibles:

- sangre equilibrada/insignificante;
- sangre que no conserva Resonancia;
- expiración;
- personaje humano;
- vampiro sin estado de Sangre todavía disponible.

No se utilizará un valor ficticio como:

```text
NONE
```

si la arquitectura permite representar correctamente la ausencia con `null`.

La decisión Prisma final corresponde a 058-B.

# 6. Obtención del efecto de Resonancia

Probar sangre puede revelar la Resonancia, pero la activación mecánica deberá
estar ligada a alimentación real.

El Libro Básico sitúa el “subidón” de Resonancia cuando el personaje sacia al
menos un nivel de Hambre de la víctima.

La futura operación de aplicación deberá recibir o derivar suficiente
información para acreditar que la alimentación ocurrió.

Conceptualmente:

```text
ApplyConsumedBloodResonance
- characterId
- bloodSourceKind
- resonanceKey?
- specialAffinityKey?
- temperament?
- hungerSlaked
- dyscrasiaKey?
- context/sessionId?
- expectedRevision
- idempotencyKey
```

Reglas:

- `hungerSlaked` debe demostrar una alimentación válida para activar el efecto;
- la operación no implementará un segundo sistema de Hambre;
- la reducción de Hambre seguirá pasando por los contratos existentes;
- una nueva alimentación sustituirá/diluirá el beneficio anterior cuando la
  regla lo exija;
- el mismo evento no podrá aplicarse dos veces.

La forma definitiva se decidirá en 058-B tras auditar el patrón transaccional
vigente.

# 7. Consecuencias de SPEC-057

La regla no será simplemente:

```text
nature === vampire
```

Para poder adquirir o usar Resonancia mecánica deberá existir estado vampírico
de Sangre válido.

Por tanto:

- `nature == HUMAN` → no puede tener Resonancia activa como bebedor;
- `nature == VAMPIRE` + `blood == null` → no puede activar beneficios;
- `TRANSITIONAL_VAMPIRE` con estado de Sangre/Hambre válido → puede ser
  elegible;
- `ESTABLISHED_VAMPIRE` con estado de Sangre/Hambre válido → elegible.

Se reutilizarán las fronteras existentes, como `requireCharacterBlood()`, en
lugar de crear una segunda definición de “vampiro funcional”.

Esta SPEC no modela a víctimas humanas como personajes de alimentación.

# 8. Discrasias

Las Discrasias pertenecen a Resonancias agudas humanas y proporcionan efectos
adicionales.

Los animales ordinarios no generan Discrasias.

## Persistencia del recipiente vs efecto del bebedor

El dominio distinguirá dos conceptos:

1. **la Discrasia que posee el recipiente**, que puede ser persistente o
   circunstancial;
2. **el efecto activo en el vampiro**, que tiene su propia duración y consumo.

BloodKeeper no modelará inicialmente al recipiente como entidad persistida,
pero el catálogo deberá conservar esta distinción para no confundir:

```text
donorPersistence
```

con:

```text
drinkerEffectDuration
```

## Obtención

Los requisitos para aprovechar una Discrasia varían.

Como regla general normativa, salvo indicación particular, el efecto requiere
una alimentación mucho más profunda que una simple cata, pudiendo implicar
vaciar/matar al recipiente o alimentarse repetidamente de él durante varias
noches.

058-D modelará el modo de adquisición como dato estructurado y no asumirá que
toda Discrasia se obtiene automáticamente al detectar una Resonancia aguda.

## Duración general

Los efectos de una Discrasia normalmente terminan cuando:

- el vampiro vuelve a alimentarse;
- o alcanza Hambre/Ansia 5;

salvo que la definición concreta establezca:

- una escena;
- una sesión;
- la siguiente alimentación;
- hasta una tirada concreta;
- consumo inmediato;
- u otra duración específica.

## Catálogo mínimo

058-D deberá catalogar todas las Discrasias de ejemplo del Libro Básico
(págs. 229–231), con claves estables, nombre, Resonancia, fuente/página y efecto
estructurado.

El repositorio público no contendrá la descripción literal extensa del libro.

Familias de efecto necesarias incluyen, cuando corresponda:

- modificadores de reserva;
- repetición contextual de tiradas;
- restricciones sobre repetición de dados de Hambre;
- modificadores de daño;
- modificación de saciedad de Hambre;
- recuperación de Fuerza de Voluntad;
- resistencia a Frenesí;
- beneficios de Remordimiento;
- consumo de comida;
- efectos de duración de escena/sesión;
- beneficios restringidos de Experiencia;
- exención de un Control de Enardecimiento;
- otros efectos concretos presentes en el catálogo.

No se construirá un lenguaje universal de reglas si una unión discriminada de
casos explícitos es más segura.

## Consumidores todavía inexistentes

Cuando una Discrasia dependa de funcionalidad que aún pertenece a otra SPEC,
su efecto:

- se almacenará de forma estructurada;
- se mostrará de forma legible;
- no se simulará con lógica improvisada.

Ejemplo importante:

- una Discrasia que afecte a Control de Enardecimiento deberá integrarse con
  SPEC-059 cuando dicho consumidor exista;
- SPEC-058 no implementará por sí misma el sistema de Controles de
  Enardecimiento.

# 9. Integración con Hambre

SPEC-058 no creará un segundo tracker de Hambre.

El estado de Resonancia deberá reaccionar a eventos de dominio relevantes:

```text
nueva alimentación
→ reemplazo/dilución

Hambre = 5
→ expiración del bonus de Resonancia
→ expiración de Discrasias cuya duración general dependa de ello
```

Las excepciones de una Discrasia concreta se resolverán desde su definición.

La UI nunca limpiará el estado por su cuenta.

# 10. Integración con Dados

El constructor actual ya admite modificadores estructurados.

058-C deberá añadir un contexto verificable de Disciplina suficiente para que
el backend pueda decidir si una Resonancia aplica.

Conceptualmente:

```text
tirada usa disciplineKey
+
estado activo Intenso/Agudo
+
disciplineKey está asociado
→ modifier estructurado +1
```

Ejemplo de explicación derivada:

```text
Reserva base
+ Resonancia intensa (Colérica): +1
= Reserva final
```

Reglas:

- Efímero no añade `+1` general.
- Intenso añade exactamente `+1`.
- Agudo añade exactamente `+1` de Resonancia; su Discrasia puede añadir un
  efecto separado si corresponde.
- No se aplica a una Disciplina no asociada.
- No se aplica después de expirar.
- No se aplica dos veces al refrescar/reintentar.
- El frontend no enviará un modificador arbitrario de Resonancia como autoridad.
- No será necesario poblar los 105 `diceCheck` de Poderes para cerrar 058-C;
  esa deuda pertenece a SPEC-025.

# 11. Integración con Disciplinas

Los catálogos de Resonancia referenciarán exclusivamente claves canónicas de
Disciplina.

La ficha podrá derivar:

```text
Resonancia: Colérica
Temperamento: Intenso
Disciplinas asociadas: Celeridad, Potencia
Beneficio activo: +1 dado
```

No se persistirán nombres visibles como identidad.

La Alquimia de Sangre Débil seguirá siendo una Disciplina especial y sus reglas
de ingredientes no se reinterpretarán como un bonus general de Resonancia.

# 12. Resonancia y Experiencia

La fuente normativa exige Resonancia apropiada para justificar gasto de
Experiencia en Disciplinas y permite al Narrador exigir Resonancias más fuertes
para niveles superiores.

Aprender una Disciplina nueva fuera de Clan también requiere probar Sangre de
alguien que posea esa Disciplina.

BloodKeeper deberá preservar esta regla sin romper de forma opaca el sistema de
SPEC-056.

Por tanto, SPEC-058 preparará evidencia estructurada de alimentación:

```text
resonance evidence
- resonance/affinity
- temperament
- acquiredAt
- discipline context when known
- chronicle/session context when known
```

La integración final con compras de Disciplina se definirá en 058-E:

- la previsualización de avance podrá consultar evidencia;
- el sistema deberá poder explicar el requisito faltante;
- cualquier bloqueo automático deberá ser explícito, testeado y compatible con
  las atribuciones del Narrador;
- no se introducirá silenciosamente un bloqueo histórico imposible de satisfacer
  para personajes ya existentes.

# 13. Historial

No se registrará ruido por cada lectura de ficha.

Podrán registrarse hitos estructurados cuando:

- se adquiere/reemplaza una Resonancia mecánicamente relevante;
- se obtiene una Discrasia;
- se consume una Discrasia de uso único;
- se genera evidencia de Resonancia para aprendizaje;
- el Narrador decida conservar una alimentación significativa.

El diseño deberá distinguir el historial narrativo del personaje del estado
temporal activo.

# 14. Permisos

Las operaciones de Resonancia deberán reutilizar los patrones actuales de
propiedad de personaje y Narrador contextual.

Como mínimo:

- lectura de estado: propietario y Narrador contextual autorizado;
- aplicación/edición narrativa de Resonancia: según el patrón aprobado para
  mutaciones de personaje y decisiones de Narrador;
- consumo de beneficios: sólo mediante la operación mecánica correspondiente;
- nunca confiar en un campo enviado por cliente para adjudicar un beneficio.

Los permisos concretos se auditarán de nuevo en 058-B antes de crear endpoints.

# 15. Presentación en ficha

058-E sustituirá el demo histórico por estado real.

La sección mostrará de forma compacta:

- Resonancia activa, si existe;
- Temperamento;
- origen/perfil especial cuando sea relevante;
- Disciplinas asociadas;
- bonus activo;
- Discrasia activa;
- resumen breve del efecto;
- duración/condición de expiración cuando aporte valor.

Sin Resonancia activa:

```text
Sin Resonancia activa
```

La Experiencia seguirá mostrando datos del ledger real de SPEC-056.

`CharacterBloodExperience.tsx` deberá dejar de depender de
`demo-blood-experience.ts`.

Antes de implementar 058-E se volverá a auditar el trabajo visual en standby
de `main`, porque el sistema visual global se encuentra en evolución y no debe
ignorarse.

# 16. Cambio de Resonancia de víctimas

El Libro Básico contempla cambiar o intensificar la Resonancia de una víctima
mediante interacción narrativa.

Esta SPEC no modelará inicialmente víctimas humanas persistidas ni un
“simulador de manipulación de Resonancia”.

Se conservará como regla normativa y futura extensión.

Si en el futuro los PNJ humanos pasan a actuar como recipientes persistidos,
deberá reutilizarse el mismo catálogo de Resonancias y Temperamentos.

# 17. Relación con SPEC-025 y SPEC-059

## SPEC-025

SPEC-058 no poblará las mecánicas completas de los 105 Poderes.

Podrá utilizar un `disciplineKey` canónico en Dados sin duplicar la deuda de
Poderes.

## SPEC-059

SPEC-058 no implementará:

- botón de Control de Enardecimiento;
- resolución de Control de Enardecimiento;
- modificación de Hambre por Control de Enardecimiento;
- coste contextual de Poderes.

Las Discrasias que afecten a estos conceptos quedarán estructuralmente
preparadas para SPEC-059.

# 18. Bloques de implementación

## SPEC-058-A — Auditoría y catálogo base

Alcance exacto:

- incorporar la SPEC aprobada y actualizar el índice cuando se autorice;
- catálogo canónico de las cuatro Resonancias;
- catálogo de los tres Temperamentos;
- asociaciones Resonancia → Disciplina;
- afinidad especial `animalBlood → animalism, protean`;
- afinidad especial `resonanceFree → oblivion` como dato normativo sin bonus
  automático no demostrado;
- contratos puros para distinguir:
  - Resonancia humoral;
  - Temperamento;
  - origen de sangre;
  - afinidad especial;
- reglas puras del bonus base:
  - Efímero `0`;
  - Intenso `+1`;
  - Agudo `+1`;
- validación de claves frente al catálogo compartido de Disciplinas;
- tests puros.

No incluye:

- Prisma;
- migraciones;
- repositorios;
- endpoints;
- ficha real;
- mutaciones de Hambre;
- integración real con Dados;
- catálogo completo de Discrasias.

## SPEC-058-B — Persistencia de Resonancia activa

- diseño Prisma aditivo;
- migración;
- persistencia del estado activo;
- snapshot/API;
- repositorio;
- DTO/serializer;
- operación de aplicar/reemplazar/expirar;
- idempotencia;
- revisión optimista;
- eligibility HUMAN/VAMPIRE y estado de Sangre;
- vínculo con alimentación/Hambre sin duplicar su sistema.

## SPEC-058-C — Beneficio en reservas de Dados

- contexto canónico de Disciplina en tiradas;
- derivación backend del modificador;
- `+1` para Intenso/Agudo cuando corresponda;
- explicación estructurada en preview;
- no duplicación;
- expiración por Hambre/nueva alimentación;
- regresión del motor de Dados.

## SPEC-058-D — Discrasias

- catálogo completo de ejemplos del Libro Básico;
- claves y resúmenes editoriales propios;
- familias de efecto estructuradas;
- adquisición;
- duración;
- consumo;
- idempotencia;
- consumidores automáticos donde ya exista infraestructura;
- efectos preparados pero no fingidos cuando dependan de SPEC futuras.

## SPEC-058-E — Ficha e integraciones

- eliminar dependencia de datos demo;
- mostrar estado real;
- separar claramente Resonancia de Experiencia;
- integración con evidencia para aprendizaje de Disciplinas;
- Historial relevante;
- Alquimia de Sangre Débil cuando exista consumidor compatible;
- revisar sistema visual pendiente antes de cerrar UI.

## SPEC-058-F — Cierre

- regresión completa;
- typecheck;
- tests focalizados e integrales;
- build;
- `scripts/check.sh` cuando corresponda;
- runtime Docker aislado cuando sea necesario;
- documentación;
- auditoría final;
- verificación de que `main` visual no fue mezclado.

### Cierre ejecutado

SPEC-058 quedó cerrada tras verificar:

- cadena completa de implementación 058-A → 058-E4B;
- catálogos canónicos de Resonancia, Temperamento y Discrasia;
- persistencia e idempotencia del estado activo y de los consumos;
- integración con Dados, aprendizaje de Disciplinas, Experiencia e Historial;
- ficha persistida sin dependencia del demo;
- opt-in autoritativo para Discrasias de Experiencia;
- `prisma validate`, typecheck, suites API/Web completas y builds;
- `scripts/check.sh` sobre el runtime canónico;
- ausencia de automatización adelantada de SPEC-059;
- separación íntegra del trabajo visual pendiente de `main`.

El cierre no mezcla las trece rutas visuales mantenidas deliberadamente en
`main` ni realiza push de la rama de trabajo.

# 19. Pruebas mínimas

## 058-A

- existen exactamente 4 Resonancias humorales;
- existen exactamente 3 Temperamentos;
- `animalBlood` no cuenta como quinta Resonancia;
- `resonanceFree` no cuenta como quinta Resonancia;
- todas las claves de Disciplina asociadas existen;
- Colérica resuelve Celeridad/Potencia;
- Melancólica resuelve Fortaleza/Ofuscación;
- Flemática resuelve Auspex/Dominación;
- Sanguínea resuelve Hechicería de Sangre/Presencia;
- sangre animal resuelve Animalismo/Protean como afinidad especial;
- sangre libre de Resonancia referencia Olvido sin inventar bonus;
- Efímero produce bonus base `0`;
- Intenso produce bonus base `+1`;
- Agudo produce bonus base `+1`.

## 058-B+

- humano no puede tener Resonancia activa como bebedor;
- vampiro sin estado de Sangre no puede activarla;
- nueva alimentación sustituye/diluye correctamente;
- Hambre 5 expira el bonus aplicable;
- snapshot conserva estado real;
- reintentos no duplican efectos;
- Discrasia consumida no puede reutilizarse cuando sea de uso único;
- animal ordinario no genera Discrasia;
- Dice aplica exactamente un modificador de Resonancia;
- Dice no aplica bonus a Disciplina no asociada;
- UI no usa datos demo;
- Experiencia sigue leyendo su ledger real;
- regresión de Hambre, Disciplinas, Dados, XP y SPEC-057.

# 20. Criterios de aceptación globales

SPEC-058 estará cerrada cuando:

- las cuatro Resonancias estén modeladas canónicamente;
- los tres Temperamentos estén modelados canónicamente;
- sangre animal esté soportada sin inventar una quinta Resonancia humoral;
- sangre libre de Resonancia/Olvido esté representada sin inventar un bonus;
- Resonancia activa sea persistida y real;
- el estado sea compatible con HUMAN/TRANSITIONAL/ESTABLISHED;
- Intenso y Agudo apliquen correctamente su bonus;
- la expiración por nueva alimentación/Hambre 5 sea correcta;
- las Discrasias del Libro Básico estén catalogadas estructuralmente;
- los efectos consumibles sean idempotentes;
- la ficha no dependa del demo;
- el constructor de Dados explique el modificador;
- la integración con aprendizaje de Disciplinas disponga de evidencia
  estructurada;
- no se dupliquen reglas en React;
- no se reproduzca texto extenso de los manuales;
- no se adelanten funcionalidades de SPEC-059;
- no haya regresiones en Hambre, Disciplinas, Dados, Experiencia o SPEC-057;
- el trabajo visual de `main` permanezca separado hasta su integración
  consciente en 058-E.
