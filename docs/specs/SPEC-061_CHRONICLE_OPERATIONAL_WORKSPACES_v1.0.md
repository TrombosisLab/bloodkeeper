# SPEC-061 – CHRONICLE_OPERATIONAL_WORKSPACES

## Información

| Campo | Valor |
|---|---|
| Código | SPEC-061 |
| Documento | SPEC-061_CHRONICLE_OPERATIONAL_WORKSPACES_v1.0.md |
| Proyecto | BloodKeeper / Vampiro V5 Revolution |
| Versión | 1.0 |
| Estado | **Aprobada para implementación tras el cierre operativo de SPEC-060** |
| Baseline auditado | `main` @ `f8212bc88fca6ccf2f4e465999d1a530a4c0c2a9`, con SPEC-060 todavía sin commit |
| Dependencias | SPEC-030–035, SPEC-053, SPEC-054, SPEC-056 y SPEC-060 |
| Entorno obligatorio | Docker Compose; ninguna dependencia Node, npm o Prisma en el host |

---

# 1. Propósito

Transformar las pestañas **Resumen**, **Participantes**, **Sesiones**,
**Cronología** y **Recursos** de una Crónica en espacios operativos con la misma
claridad visual, profundidad de gestión y relación entre datos que el espacio de
**Historias** aprobado e implementado por SPEC-060.

La Crónica debe convertirse en el centro cotidiano de trabajo del Narrador:

- comprender su situación de un vistazo;
- gestionar participantes y personajes sin perder contexto;
- preparar, jugar y cerrar Sesiones;
- leer y ordenar la Cronología;
- consultar PNJ y Localizaciones junto con sus apariciones y relaciones;
- navegar entre todos esos recursos sin duplicar información;
- proteger siempre los datos privados del Narrador.

SPEC-061 no crea una segunda aplicación dentro de BloodKeeper. Extiende los
componentes, contratos, permisos y estilos del módulo de Crónicas existente.

---

# 2. Estado real confirmado por la auditoría

La auditoría de entrada, ejecutada el 26 de agosto de 2026 en modo de solo
lectura, confirma:

- 17 Crónicas, 20 participantes, 10 Sesiones, 8 Eventos, 3 PNJ, 5
  Localizaciones y 3 Historias persistidas;
- la Crónica de validación `fdsf` contiene 3 participantes, 3 personajes, 6
  Sesiones, 1 Evento, 1 PNJ, 2 Localizaciones y 3 Historias;
- existen agregados, API, persistencia y pruebas independientes para
  participantes, Sesiones, asistencia, contexto de Sesión, Eventos, PNJ,
  Localizaciones e Historias;
- existen relaciones Sesión–Evento, Sesión–PNJ y Sesión–Localización;
- SPEC-060 incorpora relaciones Historia–Sesión, Historia–Evento,
  Historia–Personaje, Historia–PNJ e Historia–Localización;
- los listados están paginados y acotados conforme a SPEC-053;
- el módulo ya dispone de permisos contextuales de Narrador y participante;
- las pestañas actuales son funcionales, pero no comparten un contrato de
  distribución equivalente al de Historias;
- Resumen es una ficha estática con recuentos básicos;
- Participantes separa Narradores, Jugadores y personajes, sin un espacio de
  detalle seleccionado;
- Sesiones dispone de listado, detalle, preparación básica, contexto,
  asistencia, tiradas y cierre con Experiencia;
- Cronología dispone de CRUD, orden estable y archivado de Eventos, pero no de
  lectura temporal rica ni relaciones directas completas;
- Recursos agrupa PNJ y Localizaciones, aunque todavía funciona como dos
  paneles internos y no como un catálogo relacional unificado;
- el esquema no contiene escenas de Sesión, elementos de preparación, notas de
  participante ni enlaces directos Evento–Personaje/PNJ/Localización;
- no existe un registro de actividad general y no se debe inventar uno a partir
  de eventos de interfaz;
- el runtime API, web y PostgreSQL estaba saludable;
- la auditoría no modificó el repositorio.

Conclusión:

1. La mayor parte del trabajo es composición web y proyecciones de lectura.
2. No se sustituirán los agregados existentes.
3. Las ampliaciones persistentes se limitarán a capacidades operativas reales.
4. Las cifras y relaciones visibles procederán del backend, nunca de datos de
   demostración incrustados.

---

# 3. Principios obligatorios

1. Historias mantiene su contrato y comportamiento de SPEC-060.
2. Cada pestaña utiliza una distribución de tres zonas en escritorio.
3. La columna izquierda sirve para buscar, filtrar, crear y seleccionar.
4. La columna central contiene el trabajo principal del elemento seleccionado.
5. La columna derecha contiene contexto, relaciones, privacidad y acciones
   terminales.
6. La misma información no se persiste en dos agregados distintos.
7. Los resúmenes y contadores se derivan mediante proyecciones acotadas.
8. Una relación se guarda mediante identidad estable, no copiando títulos.
9. Las notas privadas nunca se exponen a jugadores.
10. Toda mutación se autoriza en backend.
11. Las acciones destructivas o terminales quedan visualmente separadas.
12. Los estados no se comunican solo mediante color.
13. No se instalará nada en el host.
14. Migraciones, generación Prisma, pruebas y builds se ejecutarán en Docker.
15. La aplicación debe seguir siendo instalable desde GitHub en otra máquina.

---

# 4. Contrato visual común

## 4.1 Escritorio

Cada pestaña operativa utilizará una cuadrícula equivalente a:

```text
┌────────────────────────┬──────────────────────────────────┬────────────────────────┐
│ Navegador / catálogo   │ Espacio principal de trabajo     │ Contexto y operaciones │
│ 280–360 px             │ minmax(0, 1fr)                   │ 300–380 px             │
└────────────────────────┴──────────────────────────────────┴────────────────────────┘
```

Las tres columnas estarán visibles simultáneamente cuando el ancho útil lo
permita. Tendrán divisores independientes y no se simularán mediante una única
tarjeta genérica.

## 4.2 Cabecera y navegación

Se conserva la cabecera actual de Crónica y este orden exacto:

1. Resumen;
2. Participantes;
3. Historias;
4. Sesiones;
5. Cronología;
6. Recursos.

La pestaña activa debe ser inequívoca, navegable por teclado y asociada a su
tabpanel accesible.

## 4.3 Componentes compartidos

La implementación podrá extraer primitivas locales del feature de Crónicas
para:

- cabecera de columna;
- buscador y filtros;
- contador;
- tarjeta seleccionable;
- estado vacío;
- bloque de métricas;
- sección con etiqueta, título y acción;
- panel de notas privadas;
- bloque de relaciones;
- confirmación terminal;
- aviso y error de operación.

No se creará una biblioteca UI global nueva ni una dependencia externa.

## 4.4 Datos ilustrativos

Los nombres, porcentajes y cantidades utilizados en las maquetas son ejemplos
de composición, no datos canónicos. La interfaz real mostrará exclusivamente
datos devueltos o derivados por el backend.

No se implementarán indicadores subjetivos automáticos como “oscuridad”,
“tensión” o “protagonismo” mientras no exista una regla explícita y datos
persistentes definidos por otra SPEC.

---

# 5. Resumen operativo

## 5.1 Objetivo

Resumen será el cuadro de mando de la Crónica. Debe permitir decidir el
siguiente paso sin recorrer todas las pestañas.

## 5.2 Columna izquierda

Contendrá:

- título **Resumen** y estado de la Crónica;
- bloque **Estado de la crónica**;
- recuentos reales de Historias activas, Sesiones, participantes y personajes;
- bloque **Atajos**;
- acciones **Preparar sesión**, **Nueva historia** y **Añadir suceso**, visibles
  solo con permisos;
- bloque **Actividad reciente** derivado de `updatedAt` de recursos reales,
  acotado y sin almacenar eventos ficticios.

## 5.3 Columna central

Contendrá:

- **Visión general**;
- descripción o premisa de Crónica;
- **Situación actual**, incorporada como campo narrativo explícito de Crónica;
- **Progreso narrativo**, derivado de Historias y sus hitos, sin porcentaje
  persistido independiente;
- **Próxima sesión**, seleccionada por estado y fecha real;
- **Historias en curso**, con progreso real;
- **Últimos sucesos**, ordenados según Cronología.

## 5.4 Columna derecha

Contendrá:

- **Pulso de la crónica** mediante métricas objetivas: Historias activas,
  Sesiones en preparación, tareas pendientes y recursos activos;
- **Pendientes del Narrador**, agregando elementos de preparación de Sesión y
  recordatorios pendientes de Historias;
- **Acciones de la Crónica**;
- edición de nombre, descripción, situación actual y ritmo de Experiencia;
- archivado separado y confirmado.

## 5.5 Proyección de lectura

Se expondrá una proyección agregada acotada, evitando múltiples cascadas HTTP.
La proyección incluirá solo recursos autorizados y no mezclará notas privadas
en respuestas de jugador.

---

# 6. Participantes operativo

## 6.1 Objetivo

Unificar participante, rol contextual, personaje asociado, asistencia e
impacto narrativo en un único flujo de selección y detalle.

## 6.2 Columna izquierda

Contendrá:

- título **Participantes** y contador;
- búsqueda por nombre visible y usuario;
- filtro por rol y estado;
- acción **Incorporar participante**;
- tarjetas de Narradores y Jugadores;
- estado, rol y personaje asociado cuando exista;
- selección persistente mientras la lista siga visible.

## 6.3 Columna central

Para el participante seleccionado mostrará:

- identidad visible y rol contextual;
- estado activo o retirado;
- personaje asociado y acceso a su ficha;
- métricas derivadas: Sesiones elegibles, asistencias activas, Historias
  implicadas y Experiencia obtenida dentro de la Crónica;
- historial de asistencia por personaje;
- Historias en las que participa el personaje;
- acciones de asociación o desasociación permitidas.

La Experiencia se consulta desde el ledger; nunca se replica en participante.

## 6.4 Columna derecha

Contendrá:

- **Permisos en la crónica** como explicación derivada del rol, no como
  interruptores ficticios en v1.0;
- **Estado del personaje** y acceso a ficha;
- **Notas del Narrador sobre el participante**;
- acciones separadas para desasociar y retirar.

## 6.5 Ampliaciones de dominio

`ChronicleParticipant` incorporará notas privadas opcionales del Narrador y
revisión optimista.

El cambio de rol, si se habilita, será una operación explícita que:

- impide retirar o degradar al último Narrador activo;
- no modifica roles globales de usuario;
- registra revisión;
- conserva historial.

No se implementará una matriz arbitraria de permisos por usuario en esta
versión. Los permisos continúan derivados de rol, estado y pertenencia.

---

# 7. Sesiones operativo

## 7.1 Objetivo

Convertir Sesiones en una herramienta rápida para preparar, dirigir y cerrar
una noche de juego.

## 7.2 Columna izquierda

Contendrá:

- título **Sesiones** y contador;
- búsqueda;
- filtro por preparación, completada y archivada;
- acción **Nueva sesión**;
- tarjetas con número, fecha, título, estado e Historias vinculadas;
- carga paginada determinista.

## 7.3 Columna central

Mantendrá las áreas internas:

- Resumen;
- Preparación;
- Asistencia;
- Tiradas.

La vista **Preparación** contendrá:

- objetivo de la Sesión;
- resumen previsto;
- **Escenas y ritmo**;
- **Lista de preparación** con progreso derivado;
- Historias vinculadas;
- PNJ y Localizaciones preparados;
- Eventos de contexto.

## 7.4 Escenas de Sesión

Se incorporará `ChronicleSessionScene` con:

- UUID estable;
- `chronicleId` y `sessionId`;
- título obligatorio;
- propósito o descripción opcional;
- tipo o fase narrativa opcional;
- intensidad opcional y acotada;
- orden estable;
- estado pendiente o completado;
- revisión;
- timestamps.

Las escenas solo podrán mutarse mientras la Sesión esté en `PREPARATION`.
Completar o archivar la Sesión las deja en solo lectura.

## 7.5 Lista de preparación

Se incorporará `ChronicleSessionPreparationItem` con:

- UUID estable;
- Sesión y Crónica;
- texto obligatorio;
- orden estable;
- estado pendiente o completado;
- revisión y timestamps.

El porcentaje se deriva de elementos completados/total. Una lista vacía muestra
0 tareas y no bloquea el cierre.

## 7.6 Asistencia

La asistencia existente continúa siendo la fuente canónica. Durante
`PREPARATION` representa asistencia prevista; al completar la Sesión se
convierte en el conjunto efectivo usado para Experiencia.

No se crea un segundo sistema de asistencia ni una tabla de ausencias.

## 7.7 Columna derecha

Contendrá:

- resumen de Historias, escenas y recursos;
- asistencia prevista/efectiva;
- notas privadas del Narrador;
- requisitos reales de cierre;
- resultado canónico de Experiencia;
- acción **Completar sesión** separada de **Archivar sesión**.

El cliente no introduce cantidades de Experiencia.

---

# 8. Cronología operativa

## 8.1 Objetivo

Presentar Eventos como una línea temporal legible y relacionable, conservando
el orden estable existente.

## 8.2 Columna izquierda

Contendrá:

- título **Cronología** y contador;
- búsqueda;
- filtro por estado;
- filtros por Historia, Sesión, Personaje, PNJ y Localización;
- acción **Nuevo suceso**;
- lista compacta ordenada y paginada;
- elemento seleccionado claramente marcado.

## 8.3 Columna central

Contendrá:

- alternancia **Narrativa / Fecha real**;
- agrupación por etiqueta temporal sin alterar el orden persistido;
- línea vertical y nodos accesibles;
- tarjetas de Evento con relaciones principales;
- expansión del Evento seleccionado;
- controles explícitos de reordenación.

La vista por fecha real solo incluye y ordena Eventos con `realDate`. Los que no
tengan fecha se muestran en un grupo **Sin fecha real**, sin perder su orden
narrativo.

## 8.4 Relaciones directas de Evento

Además de las relaciones ya existentes, se incorporarán enlaces explícitos:

- Evento–Personaje;
- Evento–PNJ;
- Evento–Localización.

Los enlaces:

- exigen pertenencia a la misma Crónica;
- no duplican datos;
- son únicos por pareja;
- se gestionan por reemplazo o adición/eliminación estructurada;
- respetan archivado y permisos.

Historia–Evento y Sesión–Evento continúan usando sus tablas actuales.

## 8.5 Columna derecha

Contendrá:

- detalle editable del Evento;
- posición y referencia temporal;
- fecha real;
- descripción;
- relaciones con Historias, Sesiones, Personajes, PNJ y Localizaciones;
- notas privadas;
- controles Subir/Bajar;
- archivado separado.

---

# 9. Recursos operativo

## 9.1 Objetivo

Unificar la consulta de PNJ y Localizaciones sin fusionar sus agregados.

## 9.2 Columna izquierda

Contendrá:

- título **Recursos** y contador combinado;
- selector **PNJ / Localizaciones**;
- búsqueda y estado;
- acción de creación contextual;
- tarjetas con nombre, categoría, función o jerarquía y estado;
- selección estable y paginada.

## 9.3 Columna central

Para PNJ mostrará:

- nombre, categoría, rol narrativo, nivel de detalle y estado;
- descripción compartible;
- información privada;
- relaciones con Historias, Sesiones, Eventos, Personajes y Localizaciones;
- apariciones derivadas;
- acciones de edición y archivado.

Para Localizaciones mostrará:

- nombre, categoría, estado y jerarquía padre/hijas;
- descripción compartible;
- notas privadas;
- relaciones con Historias, Sesiones, Eventos, PNJ y Personajes;
- apariciones derivadas;
- edición y archivado.

## 9.4 Columna derecha

Contendrá:

- resumen de vínculos reales;
- acciones rápidas para relacionar;
- notas del Narrador;
- navegación a Historia, Sesión, Evento o personaje relacionado;
- archivado separado.

## 9.5 Etiquetas e imágenes

Las etiquetas libres y retratos mostrados en la maqueta no forman parte de
v1.0. Evitarán añadir almacenamiento y taxonomías sin reglas de dominio.

La interfaz usará iconos, iniciales y recursos visuales ya incluidos en la
aplicación. Una futura SPEC podrá definir medios subidos y etiquetas
estructuradas de forma portable.

---

# 10. Navegación transversal

Toda tarjeta relacional ofrecerá navegación contextual cuando el actor tenga
permiso:

- Historia → pestaña Historias y selección correspondiente;
- Sesión → pestaña Sesiones y selección correspondiente;
- Evento → Cronología y selección correspondiente;
- PNJ/Localización → Recursos, tipo y selección correspondiente;
- Personaje → ficha persistida.

La navegación se expresará mediante estado de ruta o parámetros estables; no
dependerá únicamente de estado efímero del componente.

Los identificadores no se mostrarán como texto técnico en la interfaz normal.

---

# 11. Privacidad y proyecciones de jugador

## 11.1 Narrador

El Narrador activo puede gestionar los espacios conforme a las reglas de cada
agregado.

## 11.2 Jugador

El jugador solo recibe:

- datos generales de Crónica autorizados;
- su participación y personaje;
- Historias compartidas según SPEC-060;
- resúmenes de Sesiones que ya sean visibles por los contratos existentes;
- descripciones compartibles de recursos cuando estén definidas.

Nunca recibe:

- notas del Narrador;
- recordatorios privados;
- preparación privada;
- relaciones reservadas;
- datos de otros personajes no autorizados;
- candidatos administrativos.

La ocultación CSS no es una barrera de seguridad. La API emitirá DTO distintos
o proyecciones filtradas.

---

# 12. Persistencia propuesta

La migración aditiva incorporará equivalentes a:

- `chronicles.currentSituation` opcional;
- `chronicle_participants.narratorNotes` opcional;
- `chronicle_participants.revision`;
- `chronicle_sessions.objective` opcional;
- `chronicle_sessions.plannedSummary` opcional;
- `chronicle_sessions.revision` cuando no exista una barrera equivalente;
- `chronicle_session_scenes`;
- `chronicle_session_preparation_items`;
- `chronicle_event_character_links`;
- `chronicle_event_npc_links`;
- `chronicle_event_location_links`.

Las relaciones Historia y Sesión existentes se reutilizarán.

No se crearán:

- saldos duplicados de Experiencia;
- una tabla genérica de “recursos” que sustituya PNJ y Localizaciones;
- un registro de actividad ficticio;
- porcentajes persistidos derivables;
- permisos arbitrarios por interruptor;
- imágenes o archivos binarios en PostgreSQL.

Todas las tablas nuevas tendrán FKs restrictivas, índices por consulta real y
restricciones de pertenencia cuando el patrón Prisma/PostgreSQL lo permita.

---

# 13. API y proyecciones

## 13.1 Proyección de Resumen

Se incorporará una consulta agregada para una Crónica, con variante Narrador y
participante.

## 13.2 Detalle operativo de participante

La consulta incluirá identidad autorizada, personaje asociado, asistencia,
Historias y movimientos de Experiencia relacionados con la Crónica.

## 13.3 Preparación de Sesión

Se expondrán operaciones para:

- listar, crear, editar, completar/reabrir y ordenar escenas;
- listar, crear, editar, completar/reabrir y ordenar elementos de preparación;
- actualizar objetivo y resumen previsto;
- cargar contexto operativo en una respuesta acotada.

## 13.4 Relaciones de Evento

Se expondrá consulta y mutación estructurada de relaciones directas, validando
pertenencia y estado.

## 13.5 Recursos

Se podrán añadir proyecciones de detalle con relaciones, sin convertir una
consulta de lista en un grafo completo.

Todos los listados respetarán el límite global de SPEC-053.

---

# 14. Concurrencia, idempotencia y errores

- Las nuevas mutaciones usarán `expectedRevision`.
- Creaciones y operaciones terminales usarán `operationId` cuando corresponda.
- Reordenar validará la colección esperada completa dentro de su ámbito.
- Dos Narradores editando simultáneamente recibirán un conflicto estructurado.
- El frontend conservará la selección y permitirá recargar el elemento.
- Los mensajes distinguirán validación, permiso, conflicto, no encontrado y
  fallo inesperado.
- Una respuesta correcta nunca se transformará en error por una excepción
  posterior de interfaz.

---

# 15. Accesibilidad y responsive

## 15.1 Escritorio

Se mantienen las tres columnas simultáneas y separadas.

## 15.2 Tableta

- navegador lateral replegable;
- contenido principal completo;
- columna derecha situada debajo del contenido central;
- orden semántico preservado.

## 15.3 Móvil

Orden obligatorio:

1. buscador, filtros y selección;
2. contenido principal;
3. relaciones y resumen;
4. notas privadas;
5. acciones terminales.

## 15.4 Requisitos comunes

- navegación completa por teclado;
- roles y nombres accesibles;
- foco visible;
- `aria-live` para resultado de operaciones;
- controles táctiles adecuados;
- sin acciones dependientes de hover;
- estados acompañados por texto o icono accesible;
- compatibilidad moderna conforme a SPEC-054.

---

# 16. Rendimiento

- No se cargarán los cinco espacios operativos al abrir Resumen.
- Cada pestaña cargará su proyección al activarse.
- Los catálogos serán paginados y deterministas.
- El detalle se cargará por selección.
- Los recuentos usarán agregaciones y no productos cartesianos.
- Las relaciones se cargarán por área, no como un grafo ilimitado.
- Se evitará una llamada HTTP por tarjeta.
- La actividad reciente estará acotada.
- Las consultas principales deberán disponer de índices compatibles.

---

# 17. Estrategia de pruebas

## 17.1 Dominio

- escenas y elementos de preparación;
- orden estable;
- mutabilidad según estado de Sesión;
- pertenencia de relaciones de Evento;
- último Narrador y cambio de rol;
- progreso derivado;
- privacidad.

## 17.2 Aplicación y API

- proyecciones Narrador/jugador;
- cero, uno y muchos elementos;
- paginación;
- filtros;
- concurrencia;
- permisos;
- errores estructurados;
- navegación por relaciones;
- cierre de Sesión y Experiencia sin regresiones.

## 17.3 Persistencia

- migración sobre base vacía y existente;
- restricciones e índices;
- cruces entre Crónicas rechazados;
- rollback transaccional;
- datos actuales preservados.

## 17.4 Web

- contrato literal de tres columnas por pestaña;
- paneles y acciones enumerados en esta SPEC;
- selección, búsqueda y filtros;
- estados loading/empty/error/permission/content;
- teclado, foco y responsive;
- datos reales y ausencia de contenido incrustado;
- notas privadas ausentes en proyección de jugador.

## 17.5 Regresión

- SPEC-030–035;
- SPEC-053 y SPEC-054;
- Experiencia SPEC-056;
- Historias y cierre SPEC-060;
- typecheck, tests, build y runtime en Docker.

---

# 18. Implementación incremental obligatoria

## SPEC-061-A — Contrato, persistencia y proyecciones base

- documento aprobado e índice;
- modelos aditivos;
- migración;
- contratos de repositorio;
- DTO base;
- pruebas de esquema y privacidad.

## SPEC-061-B — Marco visual compartido y Resumen

- primitivas locales del workspace;
- proyección agregada;
- tres columnas de Resumen;
- atajos y navegación;
- actividad derivada y métricas objetivas;
- responsive y accesibilidad.

## SPEC-061-C — Participantes operativo

- lista, filtros y selección;
- detalle operativo;
- notas privadas y revisión;
- rol y permisos derivados;
- personaje, asistencia, Historias y Experiencia;
- acciones seguras.

## SPEC-061-D — Preparación profunda de Sesiones

- objetivo y resumen previsto;
- escenas;
- lista de preparación;
- API, persistencia y pruebas;
- pertenencia, orden y concurrencia.

## SPEC-061-E — Workspace visual de Sesiones

- navegador de Sesiones;
- áreas Resumen/Preparación/Asistencia/Tiradas;
- Historias y recursos vinculados;
- columna derecha;
- cierre y Experiencia sin regresión.

## SPEC-061-F — Cronología relacional

- relaciones directas de Evento;
- filtros;
- línea temporal narrativa/real;
- reordenación;
- detalle y navegación transversal;
- privacidad.

## SPEC-061-G — Recursos relacional

- catálogo unificado PNJ/Localizaciones;
- detalle central;
- relaciones y apariciones;
- notas privadas;
- navegación transversal;
- responsive.

## SPEC-061-H — Integración y cierre operativo

- documentación de usuario;
- suites focalizadas;
- auditoría de privacidad;
- preflight global Docker;
- revisión visual real con Narrador y jugador;
- commit local;
- push solo con autorización explícita.

Cada fase debe quedar validada antes de comenzar la siguiente. No se acumulará
toda la implementación en un parche único.

---

# 19. Fuera de alcance

No forman parte de SPEC-061 v1.0:

- inteligencia artificial narrativa;
- análisis automático subjetivo de tensión u oscuridad;
- chat o edición colaborativa en tiempo real;
- mapas gráficos de nodos editables;
- subida de retratos, mapas o archivos;
- etiquetas libres de recursos;
- permisos arbitrarios por participante;
- calendario externo;
- notificaciones push;
- audio o vídeo de Sesiones;
- generador automático de escenas;
- eliminación destructiva de recursos históricos;
- reescritura de Experiencia;
- sustitución del ledger;
- dependencias instaladas en el host.

La arquitectura no impedirá futuras SPEC para estas capacidades.

---

# 20. Criterios de aceptación

SPEC-061 podrá cerrarse únicamente cuando:

1. Resumen, Participantes, Sesiones, Cronología y Recursos usan tres zonas
   funcionales en escritorio;
2. cada zona contiene los bloques definidos para su pestaña;
3. los datos mostrados proceden del backend;
4. no existen métricas subjetivas simuladas;
5. Resumen permite entender estado, próxima Sesión, Historias y sucesos;
6. Participantes permite seleccionar y consultar rol, personaje, asistencia,
   Historias y Experiencia;
7. las notas de participante son privadas y concurrentes;
8. Sesiones dispone de escenas ordenadas y persistentes;
9. Sesiones dispone de lista de preparación persistente;
10. escenas y preparación quedan en solo lectura tras completar/archivar;
11. la asistencia existente sigue siendo canónica;
12. completar Sesión conserva la concesión automática correcta;
13. Cronología ofrece vista narrativa y por fecha real;
14. Cronología conserva el orden estable existente;
15. Eventos se relacionan directamente con Personajes, PNJ y Localizaciones;
16. Recursos conserva PNJ y Localizaciones como agregados distintos;
17. Recursos muestra vínculos y apariciones reales;
18. la navegación transversal selecciona el recurso de destino;
19. no se revelan notas privadas a jugadores;
20. los listados son paginados y deterministas;
21. toda mutación se autoriza en backend;
22. concurrencia y errores son estructurados;
23. responsive móvil y tableta conserva todos los apartados;
24. navegación por teclado y foco cumplen SPEC-054;
25. migraciones y pruebas se ejecutan dentro de Docker;
26. una instalación nueva puede reproducir el esquema;
27. los datos existentes se preservan;
28. SPEC-060 continúa pasando completa;
29. preflight global Docker queda verde;
30. API, web y PostgreSQL quedan saludables;
31. el manual describe los cinco espacios;
32. el repositorio queda limpio tras el commit local de cierre;
33. no se realiza push sin autorización explícita.

---

# 21. Decisiones fijadas

- Historias es el patrón visual de referencia, no un componente que deba
  contener toda la Crónica.
- Las cinco pestañas conservarán su responsabilidad propia.
- La distribución de tres zonas será común.
- Resumen utilizará datos objetivos y derivados.
- Los permisos de participante seguirán derivados de rol y estado.
- La Experiencia seguirá derivándose del ledger.
- La asistencia seguirá siendo única.
- Sesiones incorporará escenas y preparación persistentes.
- Cronología incorporará relaciones directas de Evento.
- PNJ y Localizaciones no se fusionarán en persistencia.
- Imágenes y etiquetas se posponen.
- Las notas privadas se filtran en backend.
- La implementación será modular y exclusivamente Docker.
- SPEC-061 no comenzará a modificar código hasta cerrar y consolidar SPEC-060.
