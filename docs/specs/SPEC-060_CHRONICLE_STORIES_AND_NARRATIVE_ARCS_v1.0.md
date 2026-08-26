# SPEC-060 – CHRONICLE_STORIES_AND_NARRATIVE_ARCS

## Información

| Campo | Valor |
|---|---|
| Código | SPEC-060 |
| Documento | SPEC-060_CHRONICLE_STORIES_AND_NARRATIVE_ARCS_v1.0.md |
| Proyecto | BloodKeeper / Vampiro V5 Revolution |
| Versión | 1.0 |
| Estado | **Aprobada para implementación** |
| Baseline auditado | `main` @ `f8212bc88fca6ccf2f4e465999d1a530a4c0c2a9` |
| Dependencias | SPEC-030–035, SPEC-053, SPEC-054 y SPEC-056 |
| Fuente normativa de Experiencia | Libro Básico V5, pág. impresa 130 |

---

# 1. Propósito

Crear un sistema profundo de **Historias y Arcos Narrativos** dentro de cada
Crónica, capaz de convertirse en el centro de preparación, seguimiento y
memoria de juego de BloodKeeper.

El sistema deberá permitir que:

- una Crónica contenga una o varias Historias;
- una Historia abarque una o varias Sesiones;
- una Sesión participe en una o varias Historias simultáneas;
- las Historias organicen Eventos, Personajes, PNJ y Localizaciones sin
  duplicar sus datos;
- el cierre de una Historia sea una operación narrativa explícita, trazable e
  idempotente;
- el cierre conceda automáticamente la Experiencia canónica de final de
  Historia;
- el Narrador no disponga de una herramienta libre para introducir cantidades
  arbitrarias de Experiencia.

SPEC-060 no convierte las Historias en simples notas ni reutiliza de forma
ambigua los Eventos existentes. Introduce un agregado narrativo propio y lo
integra con los módulos actuales mediante fronteras explícitas.

---

# 2. Estado real confirmado por la auditoría

La auditoría de entrada sobre el baseline indicado confirma:

- existen 17 Crónicas, 9 Sesiones y 8 Eventos en los datos actuales;
- el módulo de Sesiones ya dispone de estados `PREPARATION`, `COMPLETED` y
  `ARCHIVED`;
- el módulo de Eventos dispone de orden temporal, datos narrativos y estados
  `ACTIVE` y `ARCHIVED`;
- existe una relación muchos-a-muchos entre Eventos y Sesiones mediante
  `chronicle_session_event_links`;
- esa relación apenas tiene uso real: un único enlace Evento–Sesión;
- no existen enlaces que crucen Crónicas;
- no existe una entidad, tabla, agregado, ruta ni interfaz de Historia o Arco
  Narrativo;
- la pestaña web denominada actualmente **Historia** representa en realidad la
  cronología de Eventos;
- completar una Sesión concede automáticamente 1 punto de Experiencia a cada
  personaje presente;
- el dominio de Experiencia ya reconoce `session_played`, `story_end` y
  `fast_session`;
- existe una ruta HTTP genérica de concesiones autorizada para Narradores;
- existen tres movimientos `story_end` reales para el mismo personaje, cada
  uno identificado únicamente mediante un `operationId` diferente;
- esos movimientos no están asociados a una Historia ni permiten demostrar
  qué arco terminó;
- no existen actualmente movimientos `fast_session`;
- la base de datos, los contenedores y el árbol Git estaban sanos y no fueron
  modificados por la auditoría.

Conclusión de arquitectura:

1. Evento, Sesión e Historia son conceptos diferentes.
2. La relación Evento–Sesión existente es un patrón reutilizable, no un
   sustituto de Historia.
3. `story_end` necesita una identidad de Historia estable.
4. La idempotencia debe basarse en `historia + personaje`, no en un
   identificador libre aportado por el cliente.
5. `session_played` y `fast_session` deben ser alternativas mutuamente
   excluyentes para una misma finalización de Sesión.

---

# 3. Terminología canónica del producto

## 3.1 Crónica

Campaña completa de juego. Contiene participantes, personajes, recursos,
Sesiones, Eventos e Historias.

## 3.2 Sesión

Encuentro real de juego. Registra preparación, asistencia, actividad y resumen.

## 3.3 Historia

Arco narrativo con planteamiento, desarrollo y resolución. Puede durar una o
varias Sesiones y puede coexistir con otras Historias de la misma Crónica.

En interfaz podrá presentarse como **Historia** con la aclaración **Arco
narrativo**.

## 3.4 Evento

Acontecimiento concreto situado en la cronología. Un Evento puede formar parte
de una o varias Historias y puede estar relacionado con una o varias Sesiones.

## 3.5 Cronología

Vista ordenada de acontecimientos y transiciones narrativas. La pestaña web
actual **Historia** deberá renombrarse a **Cronología** para evitar ambigüedad.

## 3.6 Cierre de Historia

Transición explícita de una Historia activa a completada. Registra resolución,
actor, fecha y resultado de Experiencia. No equivale a archivar.

---

# 4. Invariantes obligatorios

1. Toda Historia pertenece exactamente a una Crónica.
2. Una Historia no puede enlazar recursos de otra Crónica.
3. Una Sesión puede enlazarse a varias Historias.
4. Una Historia puede enlazarse a varias Sesiones.
5. Un Evento puede enlazarse a varias Historias.
6. Una Historia puede enlazarse a varios Eventos.
7. Las relaciones no duplican títulos, resúmenes ni fichas de los recursos.
8. Completar y archivar son operaciones diferentes.
9. Archivar nunca concede Experiencia.
10. Una Historia completada queda en modo de solo lectura.
11. Un personaje recibe como máximo una concesión `story_end` por Historia.
12. La concesión de final de Historia siempre vale exactamente 1 punto.
13. El cliente no introduce la cantidad concedida.
14. La Experiencia de Sesión estándar y rápida no pueden coexistir para el
    mismo personaje y la misma Sesión.
15. Los saldos se derivan del ledger de Experiencia existente.
16. Toda autorización se valida en backend.
17. Toda mutación sensible usa concurrencia optimista.
18. Todo reintento de cierre es idempotente.
19. No se infieren Historias retroactivamente a partir de títulos o notas.
20. No se borra ni reescribe historial mecánico existente.

---

# 5. Agregado ChronicleStory

Se incorporará un agregado propio `ChronicleStory`, separado de
`ChronicleEvent` y `ChronicleSession`.

Como mínimo contendrá:

- `id` estable UUID;
- `chronicleId`;
- `title` obligatorio y no vacío;
- `type` obligatorio: arco principal, arco secundario o arco personal;
- `premise` opcional;
- `stakes` opcional;
- `resolution` opcional durante planificación y obligatorio para completar;
- `narratorNotes` privadas;
- `sharedSummary` opcional para participantes;
- `visibility`;
- `status`;
- `sortOrder` estable dentro de la Crónica;
- `revision` para concurrencia optimista;
- `startedAt` opcional;
- `completedAt` opcional;
- `archivedAt` opcional;
- `createdAt` y `updatedAt`.

No se utilizará un único campo de texto como sustituto de relaciones
estructuradas.

## 5.1 Visibilidad

La primera versión distinguirá:

- `NARRATOR_ONLY`: solo Narradores activos de la Crónica;
- `CHRONICLE_PARTICIPANTS`: permite una proyección compartida de solo lectura a
  participantes activos.

`narratorNotes` nunca formará parte de la proyección compartida.

Compartir una Historia no comparte automáticamente los detalles privados de
Eventos, PNJ, Localizaciones, Sesiones o Personajes enlazados. Cada recurso
conserva sus propias reglas de acceso.

## 5.2 Hitos canónicos de progreso

Cada Historia dispondrá exactamente de estos cinco hitos ordenados:

1. `HOOK`: **Gancho**;
2. `FIRST_TURN`: **Primer giro**;
3. `REVELATION`: **Revelación**;
4. `CLIMAX`: **Clímax**;
5. `RESOLUTION`: **Resolución**.

Los hitos son datos persistentes, no decoración. Cada uno conservará:

- identidad estable;
- Historia y Crónica de pertenencia;
- clave canónica y orden fijo;
- estado pendiente o completado;
- nota narrativa opcional;
- fecha y actor de finalización;
- revisión para concurrencia.

Al crear una Historia se crearán sus cinco hitos en la misma transacción. El
Narrador podrá completar o reabrir hitos mientras la Historia esté `PLANNED` o
`ACTIVE`. Una Historia `COMPLETED` o `ARCHIVED` mantendrá los hitos en solo
lectura.

El progreso mostrado se derivará siempre del número real de hitos completados:
`completados / 5`. El porcentaje será, por tanto, 0, 20, 40, 60, 80 o 100. No
se persistirá un porcentaje independiente que pueda quedar desincronizado.

Completar el hito **Resolución** no cierra por sí mismo la Historia. El cierre
continúa siendo una operación explícita con resolución narrativa, elegibilidad
e integración de Experiencia.

## 5.3 Recordatorios del Narrador

El bloque **Notas del Narrador** contendrá un texto privado y una lista
ordenada de recordatorios privados. Cada recordatorio tendrá identidad, texto,
orden y estado pendiente o resuelto. Ninguno se incluirá en respuestas para
jugadores ni en registros técnicos con contenido completo.

---

# 6. Estados y ciclo de vida

Los estados canónicos serán:

- `PLANNED`;
- `ACTIVE`;
- `COMPLETED`;
- `ARCHIVED`.

## 6.1 Transiciones válidas

- `PLANNED -> ACTIVE` mediante activación explícita.
- `PLANNED -> ARCHIVED` para una Historia descartada antes de jugarse.
- `ACTIVE -> COMPLETED` mediante cierre de Historia.
- `ACTIVE -> ARCHIVED` para una Historia abandonada, sin Experiencia.
- `COMPLETED -> ARCHIVED` para retirarla de las vistas operativas sin perder
  memoria.

No se permitirá completar una Historia directamente desde `PLANNED`.

No se reabrirá una Historia completada en la primera versión. Una reparación
de datos utilizará operaciones administrativas auditables y no una transición
ordinaria de Narrador.

## 6.2 Activación

Activar una Historia:

- exige rol de Narrador activo en la Crónica;
- exige Crónica activa;
- registra `startedAt`;
- incrementa `revision`;
- no concede Experiencia.

## 6.3 Archivado

Archivar:

- requiere confirmación visible;
- registra actor, fecha y motivo cuando se archive desde `ACTIVE`;
- conserva todas las relaciones;
- no elimina Eventos, Sesiones ni recursos;
- no concede Experiencia.

---

# 7. Relación Historia–Sesión

La relación será muchos-a-muchos mediante una entidad de enlace explícita.

Como mínimo conservará:

- `storyId`;
- `sessionId`;
- `chronicleId` para reforzar pertenencia;
- `progressNotes` opcionales y específicas de lo que esa Sesión aportó a esa
  Historia;
- `createdAt` y actor cuando el patrón vigente lo permita.

`progressNotes` no sustituye al resumen general de la Sesión. Existe porque una
misma Sesión puede hacer avanzar Historias distintas de maneras diferentes.

## 7.1 Reglas

- Historia y Sesión deben pertenecer a la misma Crónica.
- No puede existir el mismo enlace dos veces.
- Una Sesión `PREPARATION` puede vincularse para preparar contenido.
- Las relaciones pueden editarse mientras la Historia esté `PLANNED` o
  `ACTIVE`.
- Al completar la Historia, sus relaciones quedan congeladas.
- Una Historia no puede completarse si conserva Sesiones enlazadas en
  `PREPARATION`.
- Completar exige al menos una Sesión enlazada en estado `COMPLETED` o
  `ARCHIVED`.

---

# 8. Relación Historia–Evento

La relación será muchos-a-muchos y no sustituirá el enlace Evento–Sesión
existente.

Permitirá:

- organizar acontecimientos de una Historia;
- reutilizar un Evento en varias Historias relacionadas;
- consultar la cronología de un arco;
- mantener el Evento como fuente canónica de sus propios datos.

Las reglas de pertenencia, unicidad, permisos y congelación tras completar
serán equivalentes a las de Historia–Sesión.

La finalización de una Historia no creará automáticamente un
`ChronicleEvent` duplicado. La Cronología podrá representar el cierre a partir
de la operación estructurada de Historia.

---

# 9. Reparto narrativo y recursos relacionados

La Historia podrá enlazarse explícitamente con:

- Personajes asociados a la Crónica;
- PNJ de la Crónica;
- Localizaciones de la Crónica.

Estas relaciones sirven para preparación, consulta y navegación. No determinan
por sí solas quién recibe Experiencia.

El sistema no copiará nombres, fichas ni descripciones completas en las tablas
de enlace.

Las relaciones de reparto y recursos serán privadas del Narrador en la primera
proyección compartida, salvo que una SPEC posterior defina su exposición.

---

# 10. Cierre de Historia

El cierre será un caso de uso de primera clase, no un `PATCH status` genérico.

La solicitud incluirá únicamente:

- `expectedRevision`;
- `operationId` idempotente;
- `resolution` cuando aún no esté persistida;
- confirmación explícita de cierre.

El cliente no enviará:

- cantidad de Experiencia;
- lista libre de destinatarios;
- movimientos de ledger;
- claves de deduplicación;
- fecha de cierre arbitraria.

## 10.1 Precondiciones

Para completar una Historia:

1. la Crónica debe existir y estar activa;
2. el actor debe ser Narrador activo de esa Crónica;
3. la Historia debe pertenecer a la Crónica;
4. la Historia debe estar `ACTIVE`;
5. la revisión debe coincidir;
6. la resolución debe ser no vacía;
7. debe existir al menos una Sesión enlazada completada o archivada;
8. no puede quedar ninguna Sesión enlazada en preparación;
9. no debe existir un cierre previo para la Historia.

## 10.2 Transacción atómica

En una única transacción se deberá:

1. bloquear o validar la revisión vigente de la Historia;
2. resolver los personajes elegibles;
3. registrar la operación de cierre;
4. conceder 1 XP `story_end` a cada personaje elegible que todavía no lo tenga;
5. marcar la Historia `COMPLETED`;
6. persistir `resolution` y `completedAt`;
7. incrementar `revision`;
8. devolver un resultado estructurado.

Si falla cualquier paso, no se aplicará ninguno.

## 10.3 Resultado estructurado

La respuesta deberá informar como mínimo:

- Historia y revisión final;
- número de personajes elegibles;
- número de concesiones creadas;
- personajes ya cubiertos por un reintento idempotente;
- personajes descartados y motivo;
- fecha efectiva de cierre.

---

# 11. Elegibilidad para Experiencia de Historia

La elegibilidad se derivará de la asistencia real, no de una selección manual
en el formulario de cierre.

Será elegible cada personaje que:

- pertenezca a la misma Crónica;
- tenga al menos una asistencia activa —`removedAt IS NULL`—;
- esa asistencia corresponda a una Sesión enlazada a la Historia;
- la Sesión esté `COMPLETED` o `ARCHIVED`.

Reglas adicionales:

- varias asistencias del mismo personaje producen una sola concesión;
- un personaje enlazado al reparto pero sin asistencia no recibe XP;
- un personaje con asistencia que no figure en el reparto sí recibe XP;
- el estado archivado del personaje no borra su participación histórica;
- un personaje archivado puede recibir el movimiento, aunque no podrá gastar
  Experiencia mientras siga archivado según SPEC-056;
- cerrar una Historia sin personajes elegibles es válido, pero exige una
  advertencia visible y registra cero concesiones;
- si dos Historias distintas terminan en la misma Sesión, cada una puede
  conceder su punto de final de Historia.

---

# 12. Idempotencia y trazabilidad de story_end

La clave normativa será:

```text
story_end:<storyId>:<characterId>
```

El `operationId` protege el reintento del comando completo, pero no sustituye
la unicidad de `storyId + characterId`.

La persistencia deberá impedir en base de datos:

- dos operaciones de cierre para la misma Historia;
- dos movimientos `story_end` para el mismo personaje y la misma Historia;
- asociar un movimiento a una Historia de otra Crónica.

El movimiento deberá conservar una referencia estructurada a la Historia,
preferiblemente mediante `storyId` y/o mediante los campos de adquisición
canónicos del ledger.

El historial visible mostrará:

- **Final de historia**;
- título de la Historia cuando el actor tenga permiso;
- fecha;
- cantidad `+1 XP`.

---

# 13. Ritmo de Experiencia por Sesión

La Crónica incorporará una política explícita:

- `STANDARD`: 1 XP por Sesión jugada;
- `FAST`: 2 XP por Sesión jugada.

El valor por defecto será `STANDARD`.

Al completar una Sesión se aplicará exactamente una política:

- `STANDARD` crea `session_played` por importe 1;
- `FAST` crea `fast_session` por importe 2.

Nunca se crearán ambas para el mismo personaje y la misma Sesión.

La concesión de final de Historia es independiente. Por tanto, una Sesión que
cierra una Historia puede producir:

- ritmo estándar: 1 XP de Sesión + 1 XP de Historia;
- ritmo rápido: 2 XP de Sesión + 1 XP de Historia.

## 13.1 Cambios de ritmo

El ritmo no reescribe movimientos anteriores.

La Sesión deberá conservar la política aplicada como snapshot al completarse,
de forma que un cambio posterior de configuración no altere su significado.

Un cambio de ritmo será prospectivo, autorizado, confirmado y auditable.

La deduplicación de Sesión se basará en una única adquisición
`session_completion:<sessionId>` por personaje, con independencia del motivo
visible estándar o rápido.

---

# 14. Cierre de la concesión libre de Experiencia

La interfaz normal no ofrecerá:

- un campo de cantidad de XP;
- un botón genérico **Dar Experiencia**;
- selección manual de personajes para una concesión narrativa;
- correcciones de saldo a Narradores.

Las rutas HTTP genéricas actuales de concesión deberán revisarse para que las
concesiones normativas solo puedan originarse desde:

- finalización de Sesión;
- finalización de Historia;
- migraciones o reparación técnica controlada.

Las correcciones permanecerán separadas del flujo narrativo y restringidas a
operaciones administrativas o de mantenimiento expresamente autorizadas. No
son una forma de conseguir Experiencia.

Los tres movimientos `story_end` históricos sin Historia se preservarán como
legado. No se asignarán automáticamente a Historias inventadas y no se
reescribirá su saldo.

---

# 15. Persistencia propuesta

La implementación deberá incorporar, como mínimo, equivalentes a:

- `chronicle_stories`;
- `chronicle_story_session_links`;
- `chronicle_story_event_links`;
- `chronicle_story_character_links`;
- `chronicle_story_npc_links`;
- `chronicle_story_location_links`;
- `chronicle_story_milestones`;
- `chronicle_story_reminders`;
- `chronicle_story_completion_operations`.

También deberá ampliar de forma compatible:

- `chronicles` con la política de Experiencia de Sesión;
- `chronicle_sessions` con el snapshot aplicado al completarse;
- `character_experience_movements` con trazabilidad estructurada de Historia
  cuando sea necesario.

## 15.1 Integridad de pertenencia

Las relaciones deberán impedir cruces entre Crónicas tanto en aplicación como,
cuando Prisma/PostgreSQL lo permitan de forma mantenible, mediante claves y
restricciones de base de datos.

Se crearán índices para:

- listar Historias por Crónica, estado y orden;
- resolver relaciones por Historia y por recurso;
- obtener los cinco hitos en orden canónico;
- listar recordatorios por Historia y orden;
- obtener Historias de una Sesión;
- resolver asistencia elegible;
- comprobar idempotencia de cierres y concesiones.

## 15.2 Migración

La migración será aditiva y reproducible:

- no elimina tablas existentes;
- no transforma Eventos en Historias;
- no crea Historias ficticias;
- no altera concesiones históricas;
- usa valores por defecto compatibles para Crónicas actuales;
- puede ejecutarse en una instalación nueva y en una existente;
- se valida íntegramente dentro de Docker.

---

# 16. Fronteras modulares

El sistema respetará las siguientes responsabilidades:

## 16.1 Módulo de Crónicas / Historias

Responsable de:

- agregado Historia;
- ciclo de vida;
- relaciones narrativas;
- permisos contextuales;
- resolución de participantes elegibles;
- operación de cierre.

## 16.2 Módulo de Sesiones

Responsable de:

- preparación, asistencia y finalización;
- snapshot de ritmo de Experiencia;
- publicar el resultado de finalización necesario para la concesión.

## 16.3 Módulo de Experiencia

Responsable de:

- políticas de cantidad canónica;
- ledger;
- deduplicación;
- saldo;
- historial;
- compra y evolución.

## 16.4 Orquestación

La finalización de Historia será una orquestación de aplicación. Historias no
escribirá directamente tablas privadas de Experiencia y Experiencia no decidirá
cuándo termina una Historia.

No se introducirán importaciones hacia implementaciones internas de otro
módulo. Se reutilizarán puertos públicos, casos de uso o servicios de aplicación
con contratos explícitos.

---

# 17. API propuesta

Las rutas exactas se adaptarán al patrón real del repositorio, manteniendo como
contrato funcional operaciones equivalentes a:

```text
GET    /chronicles/:chronicleId/stories
POST   /chronicles/:chronicleId/stories
GET    /chronicles/:chronicleId/stories/:storyId
PATCH  /chronicles/:chronicleId/stories/:storyId
POST   /chronicles/:chronicleId/stories/:storyId/activate
POST   /chronicles/:chronicleId/stories/:storyId/complete
POST   /chronicles/:chronicleId/stories/:storyId/archive

PATCH  /chronicles/:chronicleId/stories/:storyId/milestones/:milestoneKey
POST   /chronicles/:chronicleId/stories/:storyId/reminders
PATCH  /chronicles/:chronicleId/stories/:storyId/reminders/:reminderId
DELETE /chronicles/:chronicleId/stories/:storyId/reminders/:reminderId

PUT    /chronicles/:chronicleId/stories/:storyId/sessions/:sessionId
DELETE /chronicles/:chronicleId/stories/:storyId/sessions/:sessionId
PUT    /chronicles/:chronicleId/stories/:storyId/events/:eventId
DELETE /chronicles/:chronicleId/stories/:storyId/events/:eventId
```

Las relaciones con reparto y recursos seguirán el mismo patrón o un comando
atómico equivalente.

## 17.1 Listado

El listado soportará paginación determinista según SPEC-053 y filtros por:

- estado;
- texto de título;
- Sesión relacionada cuando aporte navegación real.

No se cargará toda la Crónica en una única respuesta creciente.

## 17.2 Errores estables

Se distinguirán como mínimo:

- Historia no encontrada;
- acceso no autorizado;
- pertenencia a Crónica inválida;
- estado o transición inválidos;
- revisión obsoleta;
- título o resolución inválidos;
- Sesión pendiente vinculada;
- ausencia de Sesiones jugadas;
- relación duplicada;
- recurso de otra Crónica;
- operación ya aplicada;
- conflicto de integridad o concurrencia.

---

# 18. Experiencia web

La maqueta aprobada por el usuario constituye el contrato visual y funcional
de escritorio de esta SPEC. La vista de Crónica mantendrá, en este orden, las
pestañas **Resumen**, **Participantes**, **Historias**, **Sesiones**,
**Cronología** y **Recursos**. La pestaña actual **Historia**, que representa
Eventos ordenados, se renombrará a **Cronología**.

La pestaña **Historias** no será una sucesión vertical de formularios. En
escritorio se distribuirá exactamente en tres columnas coordinadas:

1. navegador de Historias a la izquierda;
2. espacio de trabajo de la Historia seleccionada en el centro;
3. resumen, notas privadas y cierre a la derecha.

Las columnas compartirán la misma selección y se actualizarán con los datos
reales devueltos por backend. No se permitirán contadores de ejemplo,
porcentajes locales ni destinatarios ficticios.

## 18.1 Espacio de trabajo de Historia

### 18.1.1 Columna izquierda — navegador

Contendrá, de arriba abajo:

- título **Historias**;
- búsqueda por título;
- filtro por estado;
- botón **Nueva historia**;
- tarjetas seleccionables con título, estado y número real de Sesiones;
- indicación de `+1 XP` y bloqueo de edición en Historias completadas;
- paginación o carga incremental y recuento de resultados.

La Historia seleccionada se distinguirá por borde y estado accesible, no solo
por color. Crear una Historia la seleccionará y llevará el foco a su título.

### 18.1.2 Columna central — contenido y relaciones

La cabecera mostrará emblema visual, título, estado, fecha de creación, actor
creador, tipo de arco y menú de acciones. A continuación aparecerán:

- **Premisa**;
- **En juego**, etiqueta de interfaz para `stakes`;
- **Progreso del arco**, con porcentaje derivado, barra, contador `n de 5` y
  los cinco hitos Gancho, Primer giro, Revelación, Clímax y Resolución;
- **Sesiones vinculadas**, con número o título, fecha y navegación;
- **Eventos**, con título, función breve y navegación;
- **Reparto**, separado visualmente entre Personajes jugadores y PNJ
  relevantes;
- **Localizaciones**, con nombre, categoría y navegación.

Cada área de relación tendrá su acción contextual **Vincular** o **Añadir**.
Estas acciones abrirán selectores acotados a la Crónica, permitirán selección
múltiple cuando corresponda, impedirán duplicados y conservarán la selección
de Historia al terminar. Las tarjetas enlazadas navegarán al recurso real sin
perder la posibilidad de volver a la Historia.

Los Personajes y PNJ usarán sus nombres y señales visuales existentes. Los
emblemas, iconos o dibujos podrán resolverse con el sistema gráfico ya presente
o con CSS; nunca serán requisito para que una función sea comprensible.

### 18.1.3 Columna derecha — resumen, privacidad y cierre

Contendrá exactamente tres bloques:

1. **Resumen del arco**, con contadores reales de Sesiones vinculadas,
   Personajes involucrados y Eventos registrados;
2. **Notas del Narrador**, marcado de forma inequívoca como **Solo Narrador**,
   con el texto privado y los recordatorios ordenados;
3. **Cierre de historia**, con número y lista accesible de personajes
   elegibles, explicación de `+1 XP` por personaje, bloqueos y botón **Cerrar
   historia**.

**Personajes involucrados** contará Personajes jugadores vinculados a reparto.
**Personajes elegibles** se calculará por asistencia real a Sesiones jugadas.
Ambas cifras pueden ser distintas y la interfaz lo explicará sin tratarlas como
un error.

### 18.1.4 Contrato visual literal de escritorio

La composición aprobada no es una referencia conceptual: es el contrato de
maquetación. En escritorio deberán verse simultáneamente y sin mezclar:

- la navegación lateral global de BloodKeeper;
- la cabecera de la Crónica con nombre y estado;
- la barra horizontal completa de seis pestañas;
- el panel delimitado de Historias a la izquierda;
- el panel delimitado de detalle en el centro;
- tres tarjetas delimitadas e independientes a la derecha.

En el viewport de referencia de 1920 × 1080, el espacio de Historias usará una
cuadrícula de tres columnas `22fr 52fr 26fr`, con un hueco de 12 px entre
columnas. El navegador tendrá un mínimo de 18 rem y la columna derecha un
mínimo de 21 rem; el centro absorberá el espacio flexible. Ninguna columna
quedará visualmente fundida con otra.

Los paneles y tarjetas usarán el fondo oscuro escalonado del diseño existente,
borde visible de 1 px y esquinas suavizadas. Los separadores internos serán
líneas de 1 px. El ritmo vertical entre grupos será constante y cada bloque
conservará su propio relleno; no se simularán separaciones solo aumentando el
espacio en blanco.

Dentro de cada columna se conservarán literalmente las siguientes divisiones:

1. **Navegador izquierdo**
   - cabecera propia;
   - buscador en su propio control delimitado;
   - selector de filtro delimitado;
   - botón rojo de anchura completa;
   - una tarjeta independiente por Historia;
   - tarjeta seleccionada con borde y acento rojo lateral;
   - pie con recuento de resultados.
2. **Detalle central**
   - cabecera de Historia separada por una línea horizontal;
   - Premisa y En juego en dos mitades separadas por divisor vertical;
   - bloque de progreso separado por líneas horizontales;
   - barra de progreso y línea de cinco hitos;
   - bloque independiente de Sesiones vinculadas;
   - bloque independiente de Eventos;
   - bloque independiente de Reparto;
   - bloque independiente de Localizaciones;
   - cada bloque con título, tarjetas en línea y tarjeta de acción discontinua.
3. **Columna derecha**
   - tarjeta Resumen del arco;
   - dentro del resumen, tres métricas en celdas separadas verticalmente;
   - tarjeta Notas del Narrador con distintivo Solo Narrador;
   - separación interna entre texto y Recordatorios;
   - tarjeta Cierre de historia con tratamiento visual rojo diferenciado;
   - resumen de elegibilidad, explicación, botón rojo completo y advertencia.

Las tarjetas relacionadas tendrán borde, fondo, espaciado interno, icono o
señal equivalente, texto principal, texto secundario y navegación cuando la
maqueta la muestra. Los botones **Vincular sesión**, **Añadir evento**,
**Añadir**, **Añadir localización** y **Cerrar historia** ocuparán exactamente
su posición contextual. No se sustituirán por un único menú general.

Los divisores, bordes, fondos escalonados, estados seleccionados y espacios
entre grupos son parte del criterio de aceptación. No será válido entregar los
mismos datos en una tabla única, acordeones genéricos, pestañas internas o una
columna continua sin las separaciones de la maqueta.

Los textos visibles de la maqueta serán los nombres canónicos de interfaz:
**Historias**, **Nueva historia**, **Premisa**, **En juego**, **Progreso del
arco**, **Sesiones vinculadas**, **Eventos**, **Reparto**, **Personajes
jugadores**, **PNJ relevantes**, **Localizaciones**, **Resumen del arco**,
**Notas del Narrador**, **Solo Narrador**, **Recordatorios**, **Cierre de
historia**, **personajes elegibles** y **Cerrar historia**.

La iconografía o los dibujos podrán adaptarse al sistema visual existente,
pero no se omitirá el espacio, la etiqueta, la acción o la separación que
acompañan. La legibilidad y la función nunca dependerán exclusivamente del
dibujo.

La interfaz reutilizará componentes, tokens y patrones existentes de Crónicas.
No creará una segunda aplicación visual dentro de la aplicación.

## 18.2 Comportamiento responsive

- En escritorio ancho se conservarán simultáneamente las tres columnas.
- En tableta, el navegador será una columna lateral replegable y el resumen
  derecho pasará debajo del contenido central sin cambiar el orden interno.
- En móvil, la selección de Historia precederá al detalle; contenido, resumen,
  notas y cierre se apilarán en ese orden.
- Ninguna relación, hito o acción de cierre dependerá de hover.
- La densidad visual podrá reducirse, pero no se eliminarán apartados.

## 18.3 Preparación

El Narrador podrá:

- editar premisa, riesgos y notas;
- seleccionar el tipo de arco;
- completar, reabrir y anotar los cinco hitos;
- crear, ordenar y resolver recordatorios privados;
- enlazar varias Sesiones;
- enlazar varios Eventos;
- organizar reparto y recursos;
- activar la Historia.

## 18.4 Cierre

La interfaz de cierre deberá:

- explicar la diferencia entre completar y archivar;
- mostrar las Sesiones vinculadas;
- bloquear si alguna sigue en preparación;
- previsualizar los personajes elegibles derivados de asistencia;
- advertir si no hay personajes elegibles;
- solicitar la resolución narrativa;
- mostrar que se concederá exactamente +1 XP por personaje;
- requerir confirmación explícita;
- presentar el resultado real devuelto por backend;
- pasar a solo lectura tras completarse.

No habrá controles para cambiar cantidades ni añadir destinatarios manuales.

## 18.5 Vista compartida

Un participante activo podrá consultar una Historia compartida, pero solo su
proyección autorizada. No verá notas privadas ni relaciones reservadas.

---

# 19. Concurrencia e idempotencia

Todas las mutaciones de Historia usarán `expectedRevision`.

Las operaciones terminales usarán además `operationId`.

Se probarán expresamente:

- doble clic de cierre;
- reintento tras pérdida de respuesta;
- dos Narradores cerrando simultáneamente;
- edición concurrente de relaciones;
- cierre concurrente con finalización de Sesión;
- cambio de asistencia después de completar una Sesión;
- intento de mezclar XP estándar y rápida.

La base de datos será la última barrera de unicidad.

---

# 20. Permisos y seguridad

- Solo Narradores activos de la Crónica gestionan Historias.
- Un Administrador técnico no sustituye automáticamente al Narrador.
- Los jugadores no mutan Historias.
- Los participantes retirados pierden acceso compartido.
- Los identificadores de otra Crónica no revelan contenido.
- El backend valida cada recurso enlazado.
- La UI nunca se considera barrera de autorización.
- Los textos narrativos se renderizan de forma segura.
- No se registran notas privadas completas en logs técnicos.

---

# 21. Auditoría y observabilidad

Se registrarán de forma estructurada, sin contenido sensible innecesario:

- creación;
- activación;
- archivado;
- cierre;
- actor;
- Crónica e Historia;
- recuentos de elegibles, concedidos y omitidos;
- conflictos e idempotencia.

Los logs no sustituirán la persistencia de dominio.

---

# 22. Rendimiento y escalabilidad

- Todos los listados serán acotados.
- Las relaciones se consultarán por área, no como grafo completo obligatorio.
- Los recuentos evitarán productos cartesianos.
- La elegibilidad se resolverá mediante consulta eficiente y deduplicada.
- La finalización no hará una llamada HTTP por personaje.
- Las concesiones múltiples se ejecutarán en una única transacción de backend.
- Los índices se verificarán contra los patrones reales de consulta.

---

# 23. Accesibilidad y compatibilidad

La implementación deberá cumplir SPEC-054:

- navegación completa por teclado;
- pestañas y paneles con roles y nombres accesibles;
- foco controlado tras crear, enlazar o cerrar;
- estados no comunicados únicamente por color;
- objetivos táctiles adecuados;
- diseño responsive móvil, tableta y escritorio;
- confirmaciones y errores asociados al control correspondiente.

---

# 24. Estrategia de pruebas

## 24.1 Dominio

- validación de campos;
- estados y transiciones;
- inmutabilidad después de completar;
- pertenencia a Crónica;
- política estándar y rápida;
- elegibilidad por asistencia;
- idempotencia por Historia y personaje.
- creación automática de los cinco hitos;
- progreso derivado y orden canónico;
- reapertura de hitos solo antes del cierre;
- orden y estado de recordatorios privados.

## 24.2 Aplicación

- CRUD y listado paginado;
- activación y archivado;
- relaciones muchos-a-muchos;
- cierre atómico;
- cero, uno y varios elegibles;
- un personaje con varias asistencias;
- varias Historias en una Sesión;
- una Historia en varias Sesiones;
- reintentos y concurrencia;
- permisos Narrador/jugador/administrador.

## 24.3 Persistencia e integración

- migración sobre base vacía y base existente;
- restricciones e índices;
- rollback transaccional;
- unicidad de cierre;
- unicidad de XP por Historia;
- prohibición de relaciones entre Crónicas;
- conservación del historial legado;
- integración real con PostgreSQL en Docker.

## 24.4 Web

- navegación Historias/Cronología;
- formularios y errores;
- filtros y paginación;
- relaciones múltiples;
- previsualización de cierre;
- confirmación y resultado;
- solo lectura completada;
- proyección compartida sin notas privadas;
- accesibilidad y responsive;
- distribución simultánea en tres columnas en escritorio;
- presencia individual de todos los paneles, bloques, divisores, tarjetas y
  acciones enumerados en 18.1.4;
- contrato de clases o estructura DOM que impida fusionar las tres columnas;
- revisión visual a resolución de escritorio equivalente a la maqueta;
- coherencia entre contadores, tarjetas y relaciones reales;
- separación visible entre involucrados y elegibles;
- hitos editables que actualizan barra, porcentaje y contador;
- navegación desde tarjetas de Sesión, Evento y Localización.

## 24.5 Regresión

- SPEC-030–035 completas;
- Experiencia y evolución SPEC-056;
- asistencia y finalización de Sesión;
- cronología de Eventos;
- permisos contextuales;
- migraciones, typechecks, builds y runtime.

---

# 25. Implementación incremental obligatoria

## SPEC-060-A — Contrato, esquema y migración

- documento aprobado;
- modelos y enums;
- cinco hitos canónicos y recordatorios privados;
- restricciones e índices;
- migración aditiva;
- contratos de persistencia.

## SPEC-060-B — Agregado y lifecycle API

- crear, listar y consultar;
- editar;
- activar;
- archivar;
- permisos, revisión y paginación.

## SPEC-060-C — Relaciones narrativas

- Sesiones;
- Eventos;
- Personajes;
- PNJ;
- Localizaciones;
- pertenencia e integridad.

## SPEC-060-D — Espacio de trabajo web

- pestaña Historias;
- renombrado a Cronología;
- listado y detalle;
- distribución exacta en navegador izquierdo, contenido central y columna
  derecha;
- edición, hitos, recordatorios y relaciones;
- contadores y progreso derivados del backend;
- responsive y accesibilidad.

## SPEC-060-E — Cierre e integración de Experiencia

- previsualización de elegibles;
- operación atómica;
- `story_end` estructurado;
- política estándar/rápida de Sesión;
- cierre de concesiones genéricas normales;
- historial visible.

## SPEC-060-F — Proyección compartida y cronología integrada

- resumen compartido;
- aislamiento de notas privadas;
- representación de activación/cierre en Cronología sin duplicar Eventos.

## SPEC-060-G — Cierre operativo

- documentación de usuario;
- trazabilidad;
- suites focalizadas;
- preflight global Docker;
- revisión manual web;
- commit local;
- push solo con autorización explícita.

Cada fase deberá quedar validada antes de comenzar la siguiente. No se
acumulará toda la implementación en un único parche opaco.

---

# 26. Fuera de alcance

No forman parte de SPEC-060 v1.0:

- generación de tramas mediante IA;
- decisiones narrativas automáticas;
- cantidades libres de Experiencia;
- Experiencia por objetivos, PNJ, combate o Eventos aislados;
- edición colaborativa en tiempo real;
- chat o mensajería;
- mapas gráficos de nodos;
- árboles de decisiones ejecutables;
- automatización de escenas;
- calendarios externos;
- borrado destructivo de Historia completada;
- inferencia retroactiva de Historias desde datos existentes;
- reescritura de concesiones `story_end` históricas.

La arquitectura no impedirá futuras SPEC de escenas, secretos, pistas,
objetivos o grafos narrativos, pero no inventará esos sistemas en este alcance.

---

# 27. Criterios de aceptación

SPEC-060 podrá cerrarse únicamente cuando:

1. existe un agregado Historia independiente de Evento y Sesión;
2. una Crónica contiene múltiples Historias;
3. una Historia contiene múltiples Sesiones;
4. una Sesión puede participar en múltiples Historias;
5. Eventos y recursos se relacionan sin duplicación;
6. se impiden relaciones entre Crónicas;
7. el lifecycle es explícito y probado;
8. completar y archivar tienen semánticas distintas;
9. completar exige Historia activa, resolución y Sesiones jugadas;
10. la elegibilidad procede exclusivamente de asistencia real;
11. cada personaje recibe como máximo +1 XP por Historia;
12. el cierre completo es atómico e idempotente;
13. el ritmo estándar y rápido de Sesión es mutuamente excluyente;
14. no existe una superficie normal de concesión libre de XP;
15. los tres movimientos históricos `story_end` se preservan sin invención;
16. la pestaña Historias es funcional;
17. la cronología existente deja de confundirse con el agregado Historia;
18. una Historia completada es de solo lectura;
19. la proyección compartida no expone notas privadas;
20. cada Historia contiene exactamente los cinco hitos canónicos y el progreso
    visible se deriva de ellos;
21. las notas y recordatorios del Narrador nunca aparecen en la proyección del
    jugador;
22. en escritorio la pestaña Historias reproduce la distribución aprobada en
    tres columnas, con todas las tarjetas, divisores, bloques, acciones y
    separaciones enumerados en 18.1.4, sin sustituciones simplificadas;
23. las cifras de Sesiones, Personajes, Eventos, progreso y elegibilidad son
    coherentes con las relaciones reales;
24. los listados son paginados y deterministas;
25. permisos, concurrencia e idempotencia se validan en backend;
26. migración, typecheck, tests y builds pasan dentro de Docker;
27. el runtime queda healthy;
28. el manual explica Sesión, Historia, Crónica y las dos fuentes canónicas de
    Experiencia;
29. el repositorio queda limpio tras el commit local de cierre.

---

# 28. Decisiones que esta SPEC fija

- Historia será una entidad propia.
- La maqueta aprobada será el contrato de distribución de la pestaña Historias.
- Los cinco hitos serán persistentes y el progreso se derivará de ellos.
- Las notas y recordatorios del Narrador serán privados y estructurados.
- La relación Historia–Sesión será muchos-a-muchos.
- Evento y Historia seguirán siendo conceptos separados.
- El cierre de Historia será el único origen narrativo normal de `story_end`.
- El destinatario de XP se derivará de asistencia.
- El importe de `story_end` será fijo e inmutable.
- El ritmo rápido sustituirá al punto estándar de Sesión, no se sumará a él.
- La Experiencia de final de Historia podrá sumarse a la de Sesión cuando ambas
  causas ocurran legítimamente.
- Archivar no completará ni concederá XP.
- Los datos existentes no se reinterpretarán retroactivamente.
- La implementación se realizará de forma modular y exclusivamente mediante el
  entorno Docker del proyecto.
