# SPEC-057 – CHARACTER_SESSION_ZERO_AND_EMBRACE

## Información

| Campo | Valor |
|---|---|
| Código | SPEC-057 |
| Documento | CHARACTER_SESSION_ZERO_AND_EMBRACE.md |
| Proyecto | Vampiro V5 Revolution |
| Versión | 1.0 |
| Estado | Aprobado |
| Orden operativo | Después de SPEC-056 y del cierre de portabilidad |


## Decisiones funcionales cerradas

### Creación humana de Sesión 0

Un personaje humano activable deberá construirse como un personaje mortal V5
completo para los elementos aplicables a su naturaleza.

La ruta de Sesión 0 incluirá:

- Identidad.
- Atributos.
- Habilidades.
- Especialidades.
- Ventajas y Defectos válidos para mortales.
- Humanidad.
- Convicciones y Piedras de Toque.
- Revisión.

El humano no recibirá valores vampíricos ficticios.

### Humanidad y Abrazo

Un humano de Sesión 0 comienza con:

```text
Humanidad 7
```

El Abrazo no aplica una pérdida automática de Humanidad.

La transición conserva el valor actual:

```text
Humanidad antes del Abrazo
=
Humanidad inmediatamente después del Abrazo
```

Por tanto, un humano que llegue al Abrazo con Humanidad 7 continuará como
vampiro con Humanidad 7.

Si durante las sesiones humanas perdió o ganó Humanidad de forma legítima, ese
valor se conserva y no se restablece artificialmente.

Las modificaciones posteriores derivadas de Tipo de Depredador u otras reglas
se aplicarán únicamente cuando corresponda mediante sus reglas canónicas.

La ruta Sesión 0 no podrá penalizar al personaje frente a la creación vampírica
estándar por el mero hecho de haber comenzado como humano.

### Clan todavía desconocido

SPEC-057 no implementará dos valores paralelos del Clan.

No existirán en esta versión campos equivalentes a:

```text
realClan
visibleClan
```

Mientras el Clan no se haya incorporado al estado canónico del personaje:

```text
clan = null
```

y la presentación podrá indicar:

```text
Clan: Desconocido
```

No se resolverán decisiones mecánicas que dependan del Clan mientras éste siga
pendiente.

La gestión genérica de información mecánica conocida por el Narrador pero
oculta al jugador queda reservada a una SPEC futura de secretos y visibilidad.

## Propósito

Definir un modo de creación y evolución progresiva en el que un personaje pueda
comenzar como humano, participar en una o varias sesiones, sufrir el Abrazo y
convertirse gradualmente en vampiro sin sustituir la entidad `Character` ni
crear una segunda ficha.

El sistema deberá conservar la identidad persistente del personaje durante todo
el proceso y permitir que los elementos vampíricos se incorporen de forma
progresiva, validada y trazable.

## Objetivos

- Permitir crear personajes humanos jugables mediante un flujo de Sesión 0.
- Mantener un único `Character.id` durante toda la evolución.
- Separar la naturaleza del personaje de su estado de ciclo de vida.
- Permitir que un humano esté `ACTIVE`.
- Representar el Abrazo como una transición explícita de dominio.
- Permitir un vampiro recién Abrazado con información vampírica todavía
  incompleta.
- Incorporar Clan, Generación, Sangre, Disciplinas, Tipo de Depredador y otros
  elementos de forma progresiva.
- Reutilizar íntegramente las reglas existentes de creación, Sangre,
  Disciplinas, Ventajas, Tipo de Depredador y evolución.
- Diferenciar concesiones iniciales diferidas de compras posteriores mediante
  Experiencia.
- Adaptar ficha, creador y dados al estado real del personaje.
- Registrar los hitos narrativos principales mediante el Historial ya existente.
- Mantener compatibilidad total con todos los personajes creados antes de esta
  SPEC.

## No objetivo

Esta SPEC no crea un sistema genérico de personajes mortales para otros juegos
o líneas sobrenaturales.

No pretende modelar por sí sola:

- Ghouls.
- Revenants.
- Hunters.
- Hombres lobo.
- Magos.
- Otros tipos sobrenaturales.
- Curación del vampirismo.
- Reversión de vampiro a humano.
- Diablerie.
- Cambios de Clan posteriores.
- Un sistema de conocimiento secreto Narrador/jugador por campo.
- Una cronología mecánica reconstruible mediante event sourcing.

Cualquier ampliación de esos conceptos requerirá una SPEC posterior.

## Dependencias

Esta SPEC reutiliza y no sustituye:

- SPEC-017 — Roles.
- SPEC-018 — Permisos.
- SPEC-019 — Módulo de Personajes.
- SPEC-020 — Ficha de Personaje.
- SPEC-021 — Creación de Personajes.
- SPEC-022 — Modelo de Datos de Personajes.
- SPEC-023 — Atributos, Habilidades y Especialidades.
- SPEC-024 — Salud, Fuerza de Voluntad y Humanidad.
- SPEC-025 — Disciplinas y Poderes.
- SPEC-026 — Ventajas, Trasfondos y Defectos.
- SPEC-027 — Hambre y Estados.
- SPEC-028 — Inventario, Notas e Historial.
- SPEC-029 — Validación y Ciclo de Vida.
- SPEC-031 — Participantes y Personajes de Crónica.
- SPEC-036 a SPEC-039 — Dados e historial de tiradas.
- SPEC-056 — Experiencia y Evolución.

La implementación deberá reutilizar catálogos, validadores, reglas y casos de uso
existentes. No se crearán sistemas paralelos para reglas ya resueltas.

## Fuentes normativas de reglas V5

Esta SPEC define el contrato funcional y arquitectónico de la transición
humano → vampiro.

Los valores mecánicos concretos asociados al Abrazo —por ejemplo Hambre,
Potencia de Sangre u otras consecuencias— no se inventarán ni se deducirán por
analogía.

La Humanidad queda resuelta por esta SPEC: el humano comienza con Humanidad 7 y
el Abrazo conserva el valor actual sin aplicar una pérdida automática.

Antes de implementar cualquier valor automático deberá verificarse en los
manuales V5 disponibles en el proyecto.

Si una consecuencia no es inequívocamente determinista o depende de una
decisión narrativa, deberá permanecer pendiente hasta que el Narrador o el
usuario autorizado la resuelva mediante una operación explícita.

## Terminología

### Creación estándar

Flujo actual de creación de un vampiro completo.

Un personaje finalizado por este flujo deberá seguir comportándose exactamente
como antes de SPEC-057.

### Sesión 0

Modo alternativo de creación que permite comenzar con un humano.

No representa una entidad `ChronicleSession` concreta. Es un modo de creación y
evolución del personaje.

El personaje puede permanecer humano durante una o varias sesiones reales.

### Humano

Personaje cuya naturaleza actual es humana y para el que los sistemas
vampíricos todavía no son aplicables.

### Abrazo

Transición irreversible dentro del alcance inicial:

```text
HUMAN → VAMPIRE
```

No crea un nuevo personaje.

### Vampiro en transición

Vampiro procedente de Sesión 0 que todavía no cumple todos los requisitos de una
ficha vampírica completa.

### Vampiro establecido

Vampiro que ya cumple el contrato normal de ficha vampírica completa definido
por las SPEC existentes.

Este estado deberá derivarse mediante validación y no requiere necesariamente
un enum persistido adicional.

## Decisión arquitectónica principal

El ciclo de vida existente:

```text
DRAFT
ACTIVE
ARCHIVED
```

no representa si el personaje es humano o vampiro.

Se mantendrá intacto.

Se añadirá una dimensión independiente de naturaleza:

```text
CharacterNature
- HUMAN
- VAMPIRE
```

Por tanto serán estados válidos:

```text
DRAFT + HUMAN
ACTIVE + HUMAN
DRAFT + VAMPIRE
ACTIVE + VAMPIRE
ARCHIVED + HUMAN
ARCHIVED + VAMPIRE
```

El archivado seguirá significando retirada del uso habitual, no cambio de
naturaleza.

## Modelo persistente

### CharacterNature

Se añadirá un enum estable:

```text
HUMAN
VAMPIRE
```

`Character` deberá disponer de:

```text
nature
```

Los personajes existentes se migrarán a:

```text
VAMPIRE
```

sin alterar ninguna otra información.

La migración deberá ser aditiva y compatible con los datos actuales.

### CharacterCreationMode

El modo de creación será explícito:

```text
STANDARD
SESSION_ZERO
```

Se almacenará en el estado de creación o estructura equivalente ya existente.

Los personajes y borradores existentes deberán quedar en:

```text
STANDARD
```

### Fase derivada

La aplicación podrá derivar una fase de presentación:

```text
HUMAN
TRANSITIONAL_VAMPIRE
ESTABLISHED_VAMPIRE
```

La fase no deberá duplicar estado mecánico si puede obtenerse de:

- `nature`;
- `creationMode`;
- validación del perfil vampírico.

Como regla:

```text
nature == HUMAN
→ HUMAN

nature == VAMPIRE
y validación vampírica completa falla de forma permitida por SESSION_ZERO
→ TRANSITIONAL_VAMPIRE

nature == VAMPIRE
y validación vampírica completa es válida
→ ESTABLISHED_VAMPIRE
```

No se persistirá un segundo estado redundante salvo que durante la auditoría de
implementación aparezca una necesidad real.

## Invariantes

Se cumplirán siempre:

1. El Abrazo conserva `Character.id`.
2. El Abrazo conserva propietario.
3. El Abrazo conserva asociación a Crónica.
4. El Abrazo conserva Atributos.
5. El Abrazo conserva Habilidades y Especialidades.
6. El Abrazo conserva Salud/Fuerza de Voluntad y daño compatible.
7. El Abrazo conserva Inventario.
8. El Abrazo conserva Notas.
9. El Abrazo conserva Historial.
10. El Abrazo conserva tiradas e historial de Experiencia existentes.
11. Un humano no tendrá estados vampíricos falsos para satisfacer el esquema.
12. Ausencia de información no se representará con valores mecánicos inventados.
13. Un personaje `STANDARD` no podrá utilizar la validación permisiva de Sesión 0.
14. Un segundo Abrazo será rechazado.
15. No existirá transición VAMPIRE → HUMAN en esta versión.
16. Los personajes existentes mantendrán su comportamiento actual.
17. El Abrazo conserva la Humanidad actual.
18. El Abrazo no aplica automáticamente `Humanidad -1`.
19. Sesión 0 no concede un segundo presupuesto completo de Ventajas al convertirse
    en vampiro.
20. Mientras `clan == null`, no se resolverán decisiones mecánicas que requieran
    conocer el Clan.

## Creación de un personaje humano

El punto de entrada de creación ofrecerá dos rutas diferenciadas:

```text
Crear personaje
├── Creación vampírica estándar
└── Sesión 0 — comenzar como humano
```

La selección será explícita antes de comenzar el asistente.

No se inferirá el modo por campos incompletos.

## Flujo humano de Sesión 0

La primera versión reutilizará los pasos actuales compatibles:

1. Identidad.
2. Atributos.
3. Habilidades.
4. Ventajas.
5. Humanidad, Convicciones y Piedras de Toque.
6. Revisión.

Salud y Fuerza de Voluntad se derivarán de las reglas existentes y no requerirán
un flujo paralelo.

El modo Sesión 0 reutilizará componentes y validadores existentes. No se
duplicará el creador estándar.

El diseño deberá permitir incorporar en el futuro pasos humanos adicionales sin
romper este contrato.

## Identidad humana

Para activar un humano de Sesión 0 se exigirá una identidad jugable compatible
con el contrato actual de BloodKeeper.

Como mínimo:

- Nombre.
- Concepto.
- Propietario.
- Crónica cuando el usuario decida asociarlo y tenga permiso.

Ambición y Deseo conservarán las reglas generales ya existentes cuando sean
aplicables al personaje humano.

No serán obligatorios durante la fase humana:

- Tipo de Depredador.
- Clan.
- Sire.
- Generación.
- Categoría vampírica cuando no proceda.
- Datos exclusivos de Sangre.

## Atributos, Habilidades y Especialidades humanas

La creación humana reutilizará la distribución de Atributos ya consolidada en
el proyecto:

```text
1 Atributo a ●●●●
3 Atributos a ●●●
4 Atributos a ●●
1 Atributo a ●
```

Las Habilidades permitirán los repartos ya reconocidos por V5 y por el creador
actual:

### Polifacético

```text
1 Habilidad a ●●●
8 Habilidades a ●●
10 Habilidades a ●
```

### Equilibrado

```text
3 Habilidades a ●●●
5 Habilidades a ●●
7 Habilidades a ●
```

### Especialista

```text
1 Habilidad a ●●●●
3 Habilidades a ●●●
3 Habilidades a ●●
3 Habilidades a ●
```

Las Especialidades conservarán las reglas ya consolidadas del proyecto:

- Sólo pueden asignarse a Habilidades con al menos 1 punto.
- Existe 1 Especialidad libre de creación.
- Al adquirir el primer punto en Academicismo, Artesanía, Ciencias o
  Interpretación se obtiene la Especialidad gratuita correspondiente.
- Las concesiones posteriores de Tipo de Depredador seguirán sus reglas propias
  y no consumirán indebidamente el cupo humano inicial.

El objetivo es que Atributos, Habilidades y Especialidades formen una base
válida que se conserve después del Abrazo sin redistribuciones destructivas.

## Elementos no aplicables al humano

Mientras:

```text
nature == HUMAN
```

no se exigirán ni se crearán automáticamente:

- `CharacterBloodState`.
- Hambre.
- Potencia de Sangre.
- Clan.
- Generación.
- Tipo de Depredador.
- Disciplinas vampíricas.
- Poderes vampíricos.
- Rituales de Hechicería de Sangre.
- Ceremonias de Olvido.
- Alquimia de Sangre Débil.
- Rasgos de Sangre Débil.

No se persistirá:

```text
hunger = 0
bloodPotency = 0
clan = "none"
generation = 0
```

como sustituto de “no aplicable”.

El humano sí dispone de Humanidad y de los elementos humanos definidos por esta
SPEC.

## Ventajas y Defectos durante la fase humana

El humano de Sesión 0 completará el presupuesto normal de creación mortal:

```text
7 puntos de Ventajas
2 puntos de Defectos
```

Sólo podrán seleccionarse opciones válidas para un mortal.

Quedan fuera mientras `nature == HUMAN` las categorías o selecciones que
dependan expresamente de la condición vampírica, incluyendo cuando corresponda:

- Alimentación.
- Arcaico.
- Dominio.
- Estatus vampírico.
- Míticos.
- Rebaño.
- Sangre Débil.

La implementación filtrará el catálogo canónico mediante reglas de dominio. No
mantendrá una lista duplicada en React.

El paso humano deberá conservar el presupuesto gastado para que el Abrazo no
otorgue un segundo presupuesto completo de Ventajas.

Si una Ventaja o Defecto humano deja de ser válido tras el Abrazo, deberá
resolverse mediante una sustitución o redistribución controlada que conserve el
valor de creación y no otorgue puntos adicionales.

Los beneficios o penalizaciones concedidos posteriormente por Tipo de
Depredador son contribuciones separadas y se regirán por sus reglas canónicas.

## Humanidad, Convicciones y Piedras de Toque humanas

Todo humano de Sesión 0 comienza con:

```text
Humanidad 7
```

Durante su etapa humana la Humanidad podrá cambiar únicamente cuando las reglas
y acontecimientos reales de juego produzcan ese cambio.

El personaje humano dispondrá de:

- entre 1 y 3 Convicciones;
- el mismo número de Piedras de Toque.

La estructura persistente y validación reutilizarán SPEC-024.

El Abrazo conservará el valor actual de Humanidad. No aplicará una pérdida
automática y no restablecerá el valor artificialmente a 7.

Ejemplos:

```text
Humano Humanidad 7
→ Abrazo
→ Vampiro Humanidad 7
```

```text
Humano Humanidad 6 por consecuencias reales de juego
→ Abrazo
→ Vampiro Humanidad 6
```

Las modificaciones posteriores de Humanidad asociadas a Tipo de Depredador u
otras reglas se aplicarán en el momento en que esas reglas entren realmente en
juego.

## Activación de un humano

SPEC-029 seguirá gobernando:

```text
DRAFT → ACTIVE
```

pero la validación dependerá del perfil.

### STANDARD + VAMPIRE

Usará la validación completa actual.

### SESSION_ZERO + HUMAN

Usará un perfil de activación humano.

El perfil humano validará:

- Identidad mínima.
- Atributos.
- Habilidades.
- Especialidades.
- 7 puntos de Ventajas válidas para humano.
- 2 puntos de Defectos válidos para humano.
- Humanidad 7 en la primera activación del humano.
- En reactivaciones posteriores, Humanidad válida aunque haya cambiado
  legítimamente durante el juego.
- entre 1 y 3 Convicciones;
- igual número de Piedras de Toque;
- Valores derivados necesarios.
- Integridad de datos.
- Ausencia de estados vampíricos incompatibles.

Y no bloqueará por ausencia de elementos vampíricos.

La UI no decidirá qué requisitos son opcionales.

El backend/dominio devolverá validación estructurada.

## Uso de un humano activo

Un personaje:

```text
ACTIVE + HUMAN
```

será una ficha jugable.

Podrá:

- participar en una Crónica cuando tenga permisos;
- tener Inventario;
- tener Notas;
- tener Historial;
- recibir daño de Salud y Fuerza de Voluntad;
- realizar tiradas compatibles;
- participar en sesiones;
- conservar relaciones normales de personaje.

No podrá utilizar operaciones que requieran mecánicas vampíricas no existentes.

## Integración con dados para humanos

El módulo de dados no exigirá un `CharacterBloodState` a un humano.

Cuando una tirada de un humano utilice un personaje:

- la reserva normal se calculará con las reglas existentes;
- no se añadirán Dados de Hambre;
- no se persistirá Hambre ficticia para conseguir ese comportamiento.

La ausencia de Hambre se resolverá en dominio/adaptadores, no mediante
condicionales visuales duplicados.

## Operación de Abrazo

El Abrazo será una operación explícita de dominio.

Conceptualmente:

```text
EmbraceCharacter
```

No se implementará como edición genérica de `nature`.

### Precondiciones mínimas

- Personaje existente.
- Personaje no archivado.
- `nature == HUMAN`.
- `creationMode == SESSION_ZERO`.
- Revisión/concurrencia válida.
- Actor autorizado.
- Estado de datos coherente.

### Efectos mínimos

En una única transacción:

1. Cambiar `nature` de `HUMAN` a `VAMPIRE`.
2. Conservar exactamente la Humanidad actual.
3. Incrementar la revisión del personaje.
4. Crear o actualizar únicamente estados vampíricos que sean deterministas y
   estén respaldados por reglas verificadas.
5. Conservar todos los componentes humanos compatibles.
6. Crear un hito narrativo de Historial para el Abrazo.
7. Devolver el snapshot resultante y las decisiones vampíricas todavía
   pendientes.

Si una consecuencia del Abrazo depende de una decisión narrativa o no dispone
de una regla inequívoca, quedará pendiente.

El Abrazo no reducirá Humanidad automáticamente.

No asignará un valor de Hambre, Potencia de Sangre, Clan, Generación o
Disciplinas únicamente para completar campos obligatorios históricos. Cada dato
se resolverá cuando exista una regla o decisión válida para hacerlo.

## Atomicidad del Abrazo

No podrá existir:

- naturaleza cambiada sin el resto de cambios obligatorios;
- hito de Historial creado si la transición falla;
- datos vampíricos aplicados parcialmente.

Cualquier fallo revertirá toda la operación.

## Concurrencia

La operación usará la revisión optimista ya existente.

Si el personaje cambia entre la lectura y la confirmación:

- se rechazará la transición;
- no se sobrescribirán cambios;
- el cliente deberá recargar.

## Permisos del Abrazo

La autorización se resolverá siempre en backend.

### Personaje dentro de una Crónica

El Abrazo será una decisión narrativa y requerirá un Narrador contextual
autorizado.

El rol técnico de Administrador no sustituirá automáticamente al Narrador.

### Personaje sin Crónica

Podrá permitirse al propietario ejecutar el Abrazo sobre su propio personaje,
si la política actual de permisos lo autoriza explícitamente.

No se inferirá ese permiso desde la UI.

## Vampiro en transición

Después del Abrazo será válido mantener:

```text
ACTIVE + VAMPIRE
```

aunque todavía falten partes de una ficha vampírica completa, exclusivamente si
el personaje procede de `SESSION_ZERO`.

Esto no convierte las reglas vampíricas en opcionales permanentemente.

Representa un período transitorio.

## Información vampírica pendiente

Podrán permanecer pendientes mientras el personaje esté en transición:

- Clan.
- Generación.
- Sire.
- Potencia de Sangre cuando aún no pueda resolverse correctamente.
- Tipo de Depredador.
- Disciplinas iniciales.
- Poderes iniciales.
- Sustituciones o redistribuciones necesarias de Ventajas/Defectos que hayan dejado de ser válidos tras el Abrazo.
- Otros elementos de creación vampírica que las reglas existentes exijan para
  una ficha completa.

Cada funcionalidad deberá comprobar sus propios prerrequisitos.

Un dato pendiente no autoriza a inventar un valor por defecto.

## Verdad mecánica, Clan desconocido y conocimiento narrativo

La primera versión no mantendrá dos valores paralelos del mismo dato.

No existirán campos equivalentes a:

```text
realClan
visibleClan
```

Mientras el Clan no se haya incorporado al estado canónico:

```text
clan = null
```

La ficha podrá representar ese estado como:

```text
Clan: Desconocido
```

Esto no pretende afirmar que el personaje carezca de Clan en la ficción. Indica
que BloodKeeper todavía no ha incorporado el Clan a su estado mecánico canónico
compartido.

Mientras `clan == null`:

- no se asumirán Disciplinas de Clan;
- no se aplicarán Prohibiciones, Compulsiones u otras reglas dependientes del
  Clan;
- no se ofrecerán decisiones que requieran conocerlo.

Cuando se incorpore el Clan, pasará a ser el valor canónico del personaje y se
revalidarán las dependencias correspondientes.

La gestión genérica de información real conocida por el Narrador pero oculta al
jugador queda fuera de SPEC-057 y deberá diseñarse mediante una futura SPEC de
secretos y visibilidad.

## Resolución progresiva del perfil vampírico

La UI ofrecerá acciones contextuales según las decisiones pendientes y los
permisos.

No se impondrá un orden artificial único si las reglas no lo exigen.

Podrán existir operaciones equivalentes a:

- Resolver Generación.
- Establecer estado de Sangre.
- Descubrir o asignar Clan.
- Manifestar Disciplinas iniciales.
- Seleccionar Poderes iniciales.
- Resolver Ventajas/Defectos vampíricos pendientes.
- Adoptar Tipo de Depredador.

Los nombres concretos de casos de uso y endpoints podrán ajustarse durante la
implementación, manteniendo estas responsabilidades separadas.

## Clan

La asignación de Clan reutilizará:

- catálogo canónico;
- validadores;
- afinidades;
- restricciones ya existentes.

No se duplicarán reglas en Sesión 0.

Si Clan sigue pendiente:

- no se ofrecerán decisiones que requieran conocerlo;
- no se asumirán Disciplinas de Clan;
- no se aplicarán condicionales de Clan de forma ficticia.

## Generación

La Generación reutilizará las reglas existentes.

Mientras siga pendiente no se realizarán operaciones que necesiten una
Generación conocida para validarse correctamente.

Cuando se establezca:

- se revalidarán dependencias;
- se impedirán combinaciones imposibles;
- no se borrarán silenciosamente selecciones previas.

## Estado de Sangre

Un humano no tendrá `CharacterBloodState`.

El estado de Sangre se creará durante la transición vampírica cuando exista
información suficiente para hacerlo válidamente.

Los valores se derivarán de reglas V5 verificadas o de decisiones explícitas
permitidas por esas reglas.

No se utilizará `bloodPotency = 1` o `hunger = 1` automáticamente sólo porque
sean los defaults históricos del modelo actual.

## Humanidad después del Abrazo

La Humanidad ya existe durante la fase humana y no se crea de nuevo al recibir
el Abrazo.

La transición conservará el valor actual:

```text
humanityAfterEmbrace = humanityBeforeEmbrace
```

No se aplicará automáticamente una pérdida de 1 punto.

No se restablecerá automáticamente a 7 si durante la etapa humana el personaje
cambió legítimamente de Humanidad.

Después del Abrazo, cualquier modificación derivada de Tipo de Depredador,
acontecimientos de juego u otras reglas se aplicará únicamente mediante el
sistema canónico de SPEC-024 y las reglas que correspondan.

## Disciplinas iniciales progresivas

Las Disciplinas que formen parte de la dotación inicial del personaje podrán
manifestarse de forma progresiva durante Sesión 0.

Estas adquisiciones:

- consumirán la misma dotación inicial que la creación estándar;
- respetarán Clan, Sangre Débil, Caitiff y demás reglas aplicables;
- respetarán límites de puntos y Poderes;
- no otorgarán más recursos que la creación estándar;
- no costarán Experiencia;
- no se registrarán como compras `EVOLUTION`.

La implementación deberá reutilizar el motor de contribuciones/orígenes actual.

Las concesiones diferidas que sean parte de creación seguirán considerándose
recursos de creación, aunque se materialicen narrativamente después de activar
al humano.

## Poderes iniciales

Un punto de Disciplina no permitirá ignorar las reglas de Poderes existentes.

Cada manifestación deberá:

- comprobar puntuación;
- comprobar Poderes permitidos;
- comprobar prerrequisitos;
- evitar duplicados;
- respetar el máximo inicial aplicable.

## Tipo de Depredador

El Tipo de Depredador no será obligatorio inmediatamente después del Abrazo.

Podrá asignarse más adelante cuando narrativamente el personaje haya
desarrollado un patrón estable de alimentación.

La operación reutilizará íntegramente las reglas actuales.

Se mantendrán, entre otras, las restricciones ya implementadas para:

- Sangre Débil.
- Disciplinas concedidas.
- Especialidades/puntos de Habilidad.
- Humanidad.
- Potencia de Sangre.
- Méritos y Defectos.
- Dependencias e incompatibilidades.

No se aplicará dos veces un mismo beneficio por repetir la operación.

## Ventajas y Defectos tras el Abrazo

El personaje humano ya llega al Abrazo con:

```text
7 puntos de Ventajas
2 puntos de Defectos
```

El Abrazo no concede un segundo presupuesto completo.

Las selecciones que continúen siendo válidas se conservarán.

Cuando una Ventaja o Defecto deje de ser válido por la nueva naturaleza:

- se identificará explícitamente;
- no se eliminará silenciosamente;
- deberá sustituirse o redistribuirse de forma controlada;
- se conservará el valor de creación correspondiente;
- no se generará gasto de Experiencia por la sustitución requerida por la
  transición.

Las nuevas opciones vampíricas disponibles después del Abrazo podrán utilizarse
para dicha sustitución si las reglas lo permiten.

Las concesiones adicionales propias de Tipo de Depredador u otras reglas siguen
siendo contribuciones independientes y no consumen ni duplican indebidamente el
presupuesto humano inicial.

No se permitirá utilizar Sesión 0 para obtener recursos iniciales adicionales.

## Sangre Débil

La transición deberá respetar todas las decisiones ya consolidadas del proyecto
sobre Sangre Débil.

Como mínimo no podrá:

- asignar Tipo de Depredador cuando esté prohibido;
- crear Potencia de Sangre incompatible;
- forzar Disciplinas normales donde no correspondan;
- saltarse requisitos de Alquimia o rasgos.

No se duplicarán estas reglas dentro de SPEC-057.

## Consolidación del perfil vampírico

El sistema deberá permitir comprobar cuándo el personaje ya satisface la
validación completa de un vampiro.

Cuando la validación completa sea correcta:

```text
TRANSITIONAL_VAMPIRE → ESTABLISHED_VAMPIRE
```

será una consecuencia derivada del estado.

No se creará una segunda ficha.

No se reasignará el identificador.

No se reprocesará la creación estándar desde cero.

## Relación con Experiencia

SPEC-056 seguirá siendo la única autoridad para compras posteriores mediante
Experiencia.

Regla crítica:

```text
recursos iniciales diferidos de Sesión 0
!=
evolución mediante Experiencia
```

Mientras se estén resolviendo recursos que pertenecen a la creación inicial:

- no se descontará XP;
- no se registrarán como movimientos de gasto;
- no se usará `EVOLUTION` como sustituto genérico.

Una vez completado el perfil inicial, toda mejora posterior que requiera XP
pasará por SPEC-056.

No se permitirá utilizar recursos de Sesión 0 para evitar un coste de
Experiencia que ya corresponda a evolución normal.

## Historial narrativo

Se reutilizará `CharacterHistoryEntry` de SPEC-028.

No se creará inicialmente otra tabla de eventos de evolución.

El estado mecánico de `Character` será la fuente de verdad.

El Historial será la representación narrativa de hitos.

### Hitos mínimos automáticos

La aplicación registrará al menos:

- El Abrazo.
- Consolidación del perfil vampírico cuando se complete.

Podrán registrarse también, cuando aporten valor:

- Descubrimiento/asignación de Clan.
- Primera manifestación de una Disciplina.
- Adopción del Tipo de Depredador.
- Otros hitos relevantes aprobados durante la implementación.

El historial narrativo no sustituirá una auditoría técnica.

## Integración con ChronicleEvent

No se creará automáticamente un `ChronicleEvent` por cada cambio del personaje.

El Historial pertenece al personaje.

El Narrador podrá crear manualmente un evento general de Crónica cuando desee
reflejar el mismo acontecimiento en la línea temporal.

Una relación automática entre ambos sistemas queda fuera del alcance inicial.

## Ficha adaptativa

La ficha deberá adaptarse a la naturaleza y fase derivada.

### Ficha humana

Mostrará de forma prioritaria:

- Identidad.
- Indicador `Humano`.
- Atributos.
- Habilidades.
- Especialidades.
- Salud.
- Fuerza de Voluntad.
- Inventario.
- Notas.
- Historial.
- Información narrativa compatible.

No mostrará bloques vampíricos vacíos como si fueran puntuaciones cero.

### Vampiro en transición

Mostrará:

- Identidad.
- Indicador de vampiro recién Abrazado/en transición.
- Componentes humanos conservados.
- Componentes vampíricos ya resueltos.
- Decisiones pendientes relevantes.

Los datos pendientes se mostrarán como:

```text
Pendiente
Desconocido
Aún no establecido
```

según corresponda semánticamente.

Nunca como puntuación ficticia.

### Vampiro establecido

Utilizará la ficha completa actual.

La apariencia y comportamiento de personajes existentes no deberá degradarse.

## Creador adaptativo

No se duplicará el asistente completo.

El mismo módulo reutilizará:

- componentes;
- catálogos;
- validadores;
- navegación;
- revisión.

El conjunto de pasos se derivará del modo.

### STANDARD

Mantendrá el flujo actual.

### SESSION_ZERO

Utilizará únicamente los pasos humanos habilitados.

Después del Abrazo, las decisiones vampíricas pendientes se gestionarán mediante
acciones específicas de evolución inicial, no obligando al usuario a reiniciar
el wizard estándar completo.

## Listado de personajes

El listado deberá permitir distinguir de forma compacta:

- Humano.
- Vampiro en transición.
- Vampiro establecido.

No se introducirá ruido visual excesivo.

Los personajes humanos seguirán siendo personajes normales del usuario.

## Dashboard y Crónicas

Un humano podrá aparecer en los mismos consumidores de personajes cuando las
reglas de esos consumidores no exijan ser vampiro.

Las pantallas no deberán filtrar implícitamente por presencia de Clan o Sangre.

Las funcionalidades exclusivamente vampíricas deberán validar naturaleza antes
de ejecutarse.

## Edición

No se permitirá transformar un humano en vampiro mediante una edición libre del
formulario.

No se permitirá borrar campos esenciales de un vampiro establecido para
devolverlo artificialmente a un estado de transición.

Las transiciones y cambios mecánicos relevantes usarán operaciones específicas.

## Errores estructurados

El dominio/backend distinguirá, como mínimo:

- Modo de creación incompatible.
- Naturaleza incompatible.
- Personaje ya Abrazado.
- Personaje archivado.
- Perfil humano incompleto.
- Campo vampírico no aplicable a humano.
- Decisión vampírica todavía pendiente.
- Prerrequisito vampírico pendiente.
- Falta de permiso.
- Conflicto de revisión.
- Selección inicial agotada.
- Selección inicial inválida.
- Estado resultante incompatible con reglas V5.

La UI consumirá códigos estructurados.

## Migración de datos

La migración deberá garantizar:

- Todos los personajes existentes reciben `nature = VAMPIRE`.
- Todos los flujos existentes reciben `creationMode = STANDARD`.
- No se recrean filas.
- No cambian IDs.
- No cambian revisiones por la simple migración salvo necesidad técnica
  justificada.
- No cambian Clan, Generación, Sangre, Humanidad, Disciplinas ni Ventajas.
- No se generan entradas de Historial retroactivas.
- Los personajes existentes continúan pasando las mismas validaciones.

La migración deberá probarse sobre datos representativos existentes.

## Compatibilidad hacia atrás

Después de introducir SPEC-057:

- Crear un vampiro estándar deberá producir el mismo resultado que antes.
- Editar un vampiro existente deberá comportarse igual.
- La ficha actual de vampiros establecidos deberá mantenerse.
- Experiencia deberá conservar sus costes y reglas.
- Dados con Hambre deberán mantenerse.
- Crónicas no deberán cambiar de semántica.
- Historial no deberá perder entradas.
- APIs existentes no deberán romperse innecesariamente.

Cualquier cambio contractual inevitable deberá documentarse y probarse.

## Seguridad y permisos

Toda autorización sensible se realizará en backend.

La UI nunca será la única barrera para:

- Abrazo.
- Asignación de identidad vampírica.
- Concesión de recursos iniciales diferidos.
- Cambios de Tipo de Depredador.
- Consolidación de decisiones narrativas.

El sistema no mostrará información secreta que no exista en el modelo de
permisos actual.

## Accesibilidad y responsive

Los nuevos flujos deberán respetar SPEC-054.

Se validará:

- teclado;
- móvil;
- tablet;
- escritorio;
- estados no dependientes sólo de color;
- controles táctiles;
- ausencia de overflow horizontal;
- mensajes de validación comprensibles.

## Rendimiento

SPEC-057 no requiere nueva infraestructura.

No se añadirá:

- event sourcing;
- colas;
- microservicios;
- WebSockets;
- caché específica;
- un motor de workflows genérico.

La transición se resolverá con el patrón modular actual.

## Bloques de implementación

La implementación será incremental.

### SPEC-057-A — Modelo y compatibilidad

Objetivo:

- introducir `CharacterNature`;
- introducir `CharacterCreationMode`;
- migración aditiva;
- defaults compatibles;
- snapshots/API capaces de representar humano/vampiro;
- pruebas de migración y regresión.

No incluirá todavía UI de Sesión 0 ni Abrazo operativo.

### SPEC-057-B — Validación humana y activación

Objetivo:

- perfil de validación `SESSION_ZERO + HUMAN`;
- permitir `ACTIVE + HUMAN`;
- impedir datos vampíricos incompatibles;
- mantener intacta validación estándar;
- integrar Salud/Fuerza de Voluntad derivadas;
- validar Humanidad 7 inicial, Convicciones y Piedras de Toque;
- validar 7 puntos de Ventajas y 2 de Defectos humanos;
- pruebas de lifecycle y permisos.

### SPEC-057-C — Creación Web Sesión 0

Objetivo:

- selector de modo;
- flujo humano Identidad/Atributos/Habilidades/Ventajas/Humanidad/Revisión;
- persistencia/reanudación;
- revisión humana;
- listado adaptado;
- tests Web y validación responsive.

No implementará todavía el Abrazo si el backend no está cerrado.

### SPEC-057-D — Operación de Abrazo

Objetivo:

- caso de uso explícito;
- permisos;
- concurrencia;
- atomicidad;
- `HUMAN → VAMPIRE`;
- creación de hito de Historial;
- snapshot de decisiones pendientes;
- rechazo de segundo Abrazo.

No completará automáticamente todo el perfil vampírico.

### SPEC-057-E — Evolución vampírica inicial progresiva

Objetivo:

- resolver datos vampíricos pendientes;
- Sangre;
- conservar y aplicar correctamente Humanidad durante la transición;
- Clan;
- Generación;
- Disciplinas/Poderes iniciales;
- adaptación/sustitución de Ventajas y Defectos que hayan dejado de ser válidos;
- Tipo de Depredador;
- reutilizar todos los validadores existentes;
- diferenciar dotación inicial de Experiencia.

Se subdividirá si la auditoría demuestra que el alcance es demasiado grande para
un único incremento.

### SPEC-057-F — Ficha y dados adaptativos

Objetivo:

- ficha humana;
- ficha de vampiro en transición;
- ficha completa sin regresiones;
- tiradas humanas sin Dados de Hambre;
- tiradas vampíricas sólo cuando exista estado necesario;
- consumidores de Crónica adaptados cuando corresponda.

### SPEC-057-G — Cierre integral

Objetivo:

- regresión completa API/Web;
- migraciones;
- `scripts/check.sh`;
- build;
- pruebas Docker;
- validación visual escritorio/móvil;
- documentación;
- actualización del índice de SPEC;
- auditoría final.

## Pruebas mínimas de dominio y API

Se cubrirá al menos:

### Compatibilidad

- Personaje existente migra a VAMPIRE.
- Creación existente migra a STANDARD.
- Personaje estándar sigue activándose igual.
- Validadores actuales siguen verdes.

### Humano

- Crear borrador humano.
- Guardar borrador humano incompleto.
- Completar Atributos/Habilidades.
- Completar Especialidades.
- Completar 7 puntos de Ventajas y 2 de Defectos válidos para humano.
- Crear Humanidad 7.
- Crear 1–3 Convicciones con igual número de Piedras de Toque.
- Activar humano válido.
- Rechazar humano sin identidad mínima.
- Rechazar humano con estado de Sangre incompatible.
- Rechazar humano con Disciplina vampírica incompatible.
- Archivar y reactivar humano.
- Preservar revisión.

### Abrazo

- Narrador contextual autorizado.
- Usuario sin permiso rechazado.
- Propietario sin Crónica según política aprobada.
- Mismo `Character.id`.
- Datos humanos preservados.
- Humanidad preservada sin penalización automática.
- Historial creado.
- Segundo Abrazo rechazado.
- Abrazo de archivado rechazado.
- Conflicto de revisión rechazado.
- Fallo intermedio no deja estado parcial.

### Transición

- Clan pendiente permitido.
- Generación pendiente permitida cuando ninguna operación dependiente se
  ejecuta.
- Operación dependiente rechazada si falta prerequisito.
- Disciplina inicial no consume XP.
- Disciplina inicial no excede dotación estándar.
- Poder inválido rechazado.
- Tipo de Depredador no se aplica dos veces.
- Sangre Débil mantiene sus restricciones.
- Perfil completo pasa validación vampírica estándar.

### Experiencia

- Recursos iniciales diferidos no crean gasto XP.
- Compra posterior sí utiliza SPEC-056.
- No se puede usar dotación inicial después de agotarla.

## Pruebas mínimas Web

- Selector Creación estándar / Sesión 0.
- Flujo estándar sin cambios.
- Flujo humano con seis fases.
- Revisión humana con Ventajas, Humanidad, Convicciones y Piedras de Toque.
- Revisión humana sin errores vampíricos falsos.
- Ficha humana sin bloques vampíricos de puntuación cero.
- Acción de Abrazo sólo cuando corresponde.
- Estados pendientes comprensibles.
- Ficha transitoria.
- Ficha establecida.
- Listado distingue naturaleza/fase.
- Errores backend representados correctamente.
- Responsive 390 × 844 y escritorio.
- Navegación por teclado.
- Sin lógica de reglas duplicada en componentes.

## Regresión obligatoria

Cada bloque deberá preservar las pruebas existentes relacionadas con:

- creación estándar;
- activación;
- archivado;
- Atributos/Habilidades;
- Salud/Voluntad/Humanidad;
- Sangre/Hambre;
- Disciplinas;
- Ventajas;
- Tipo de Depredador;
- Sangre Débil;
- ficha;
- Crónicas;
- Dados;
- Experiencia;
- permisos;
- migraciones.

No se aceptará una corrección de Sesión 0 que debilite un contrato estándar.

## Validación visual

Antes del cierre:

### Escritorio

Verificar:

- elección de modo;
- creación humana;
- ficha humana;
- Abrazo;
- transición progresiva;
- ficha completa.

### Móvil

Validar al menos:

```text
390 × 844
```

Comprobar:

- ausencia de overflow horizontal;
- acciones alcanzables;
- formularios utilizables;
- modales/confirmaciones accesibles;
- estados pendientes legibles.

## Documentación

Al cerrar SPEC-057 se actualizará:

- índice `docs/specs/README.md`;
- manual de usuario cuando corresponda;
- documentación de creación;
- documentación de ficha;
- documentación de migraciones si se altera persistencia.

No se documentarán comportamientos antes de validarlos.

## Fuera de alcance inicial detallado

Queda fuera:

- ficha humana con un catálogo de reglas mortales independiente.
- secretos de Narrador por campo de personaje.
- Clan real oculto distinto de Clan revelado.
- Generación real oculta distinta de conocida.
- cualquier capa genérica de `valor real` frente a `valor visible`; se reservará
  a una SPEC futura de secretos y visibilidad.
- asociación automática de hitos a ChronicleEvent.
- conversión automática de PNJ a Personaje.
- conversión de Personaje a PNJ.
- múltiples Abrazo.
- reversión a humano.
- plantillas de prólogo automatizadas.
- IA que decida Clan, Sire, Predator Type o Disciplinas.
- temporizadores para “descubrir” habilidades.
- otorgar XP automáticamente por completar hitos de Sesión 0.
- reescribir retrospectivamente tiradas realizadas como humano.

## Criterios de aceptación

SPEC-057 se considerará completa cuando:

- Existe una ruta explícita de creación Sesión 0.
- Un humano puede pasar de DRAFT a ACTIVE sin campos vampíricos ficticios.
- La creación humana incluye 7 puntos de Ventajas, 2 puntos de Defectos,
  Humanidad 7 y 1–3 Convicciones con igual número de Piedras de Toque.
- Un humano activo puede utilizar ficha, Crónica, Historial y dados compatibles.
- El Abrazo modifica el mismo Character de forma atómica.
- El Abrazo conserva la Humanidad actual y no aplica una pérdida automática.
- El Abrazo no crea una segunda ficha ni un segundo ID.
- El personaje puede continuar activo con perfil vampírico todavía incompleto.
- Las decisiones vampíricas pueden resolverse progresivamente.
- El Abrazo no concede un segundo presupuesto de Ventajas/Defectos.
- Las dotaciones iniciales diferidas no se confunden con XP.
- Clan, Sangre, Disciplinas, Ventajas y Tipo de Depredador reutilizan reglas
  existentes.
- La ficha se adapta a humano, transición y vampiro establecido.
- Los humanos no utilizan Dados de Hambre.
- Los vampiros existentes conservan exactamente el comportamiento previo.
- La migración preserva todos los personajes actuales.
- Permisos y concurrencia se validan en backend.
- Los hitos principales quedan reflejados en Historial.
- No se crean sistemas paralelos de reglas.
- No se adelantan funcionalidades fuera de alcance.
- API, Web, migraciones y pruebas globales quedan verdes.
- La validación visual de escritorio y móvil queda superada.
