# SPEC-071 — Cuaderno físico animado y optimizado

**Versión:** 1.0 DRAFT  
**Fecha:** 2026-09-14  
**Proyecto:** BloodKeeper  
**Estado:** propuesta lista para auditoría e implementación  
**Alcance principal:** frontend `apps/web`  
**Backend / Prisma:** sin cambios previstos

---

## 1. Objetivo

Evolucionar el Cuaderno actual de BloodKeeper para que se perciba como un cuaderno de periodista usado, físico y coherente con la estética de Vampiro V5, manteniendo intactas todas sus capacidades funcionales actuales.

El resultado debe ser una interfaz real construida con React 19, TypeScript y CSS propio:

- doble página en escritorio;
- página única en móvil;
- papel envejecido y desgaste visual mediante CSS y recursos existentes;
- lomo, tapa, apilado y pestañas con profundidad;
- cambio de página mediante CSS 3D;
- transición rápida, estable y accesible;
- contenido procedente de los datos reales de BloodKeeper;
- sin imágenes generadas que pretendan representar el resultado final;
- sin introducir Tailwind, Bootstrap, Framer Motion, GSAP ni una librería de flipbook.

La mejora es principalmente de presentación y navegación. No debe degradar, sustituir ni simular la lógica de negocio que ya existe.

---

## 2. Baseline y referencias verificadas

### 2.1 Repositorio

- Repositorio: `TrombosisLab/bloodkeeper`
- Rama funcional de partida: `main`
- HEAD observado al redactar esta SPEC:
  `0c35ef72d5ff450c71689125a41c01f27e68f324`
- Mensaje:
  `feat: consolidate BloodKeeper interface and workflow improvements`

El implementador debe repetir el preflight. Si `main` ha avanzado, debe documentar el nuevo HEAD y trabajar sobre el estado actual, sin forzar la rama al SHA anterior.

### 2.2 Prototipo ejecutable

- Rama de referencia:
  `prototype/journal-real-demo-20260914`
- Commit de referencia:
  `e1eecd968ccff10bb5fec0f0fac8fa11d64f38a8`
- Archivo:
  `prototypes/journal-real-demo/index.html`
- Vista del código:
  https://github.com/TrombosisLab/bloodkeeper/blob/e1eecd968ccff10bb5fec0f0fac8fa11d64f38a8/prototypes/journal-real-demo/index.html

El prototipo contiene una demostración autónoma de:

- libro de dos páginas;
- superficies de papel mediante gradientes CSS;
- tapa y lomo;
- pestañas laterales;
- navegación anterior/siguiente;
- transición de avance y retroceso;
- panel de detalle;
- modo de edición y arrastre demostrativo;
- presentación adaptable a móvil.

### 2.3 Regla de uso del prototipo

El prototipo **no se debe fusionar ni copiar íntegramente** sobre la aplicación.

Debe inspeccionarse como referencia de composición, capas y movimiento. Su contenido es ficticio y su JavaScript imperativo sólo existe para demostrar el efecto.

La implementación productiva debe:

1. partir de una rama nueva creada desde `main`;
2. consultar el prototipo con `git show`, una comparación entre ramas o el archivo remoto;
3. trasladar las decisiones útiles a componentes React y CSS aislado;
4. conservar las API, tipos, permisos y estados existentes;
5. no desarrollar directamente sobre la rama de prototipo.

---

## 3. Estado funcional que debe preservarse

El Cuaderno actual ya contiene lógica que no forma parte de esta reimplementación visual:

- selección y recuerdo de crónica activa;
- carga de notas, contexto y sesiones;
- paginación completa de sesiones;
- secciones:
  - Resumen;
  - Notas;
  - Sesiones;
  - Etiquetas;
  - PNJ;
  - Localizaciones;
  - Organizaciones;
  - Artefactos;
  - Documentos;
- filtros de notas:
  - todas;
  - propias;
  - compartidas;
  - fijadas;
- búsqueda;
- filtro por sesión;
- etiquetas;
- notas privadas, de crónica y para jugadores seleccionados;
- creación y edición de notas;
- fijado y archivado;
- menciones y referencias a recursos;
- apertura de vistas rápidas y fichas completas;
- control de peticiones de previsualización;
- estados de carga, error y advertencia;
- permisos del narrador y de los jugadores.

No se permite reemplazar datos reales por plantillas estáticas, introducir entidades ficticias en producción ni reducir esta funcionalidad.

---

## 4. Archivos principales a auditar

Como mínimo:

- `apps/web/src/features/notebook/components/NotebookPhaseTwo.tsx`
- `apps/web/src/features/notebook/components/notebook-phase2.css`
- `apps/web/src/features/notebook/components/NotebookResourceDetails.tsx`
- `apps/web/src/features/notebook/components/NotebookSessionTimeline.tsx`
- `apps/web/src/features/notebook/components/notebook-model.ts`
- `apps/web/src/features/notebook/infrastructure/notebook.api.ts`
- `apps/web/src/features/notebook/types/notebook.types.ts`
- `apps/web/src/styles.css`
- `apps/web/src/main.tsx`
- `apps/web/public/assets/notebook-summary-diary-background.png`
- tests de contrato visual o funcional que afecten al Cuaderno.

También deben revisarse reglas locales de `AGENTS.md`, documentos de continuidad y decisiones arquitectónicas vigentes antes de editar.

---

## 5. Principios de implementación

### 5.1 Arquitectura

La animación se implementará como una capa de presentación. El estado funcional del Cuaderno seguirá siendo propiedad de `NotebookWorkspace` y de sus servicios actuales.

Se recomienda extraer:

- `NotebookBookShell.tsx`: tapa, lomo, páginas y pestañas;
- `NotebookPageSurface.tsx`: superficie común de una página;
- `NotebookPageTurn.tsx`: cara frontal, cara posterior y transición;
- `useNotebookPageTransition.ts`: máquina de estados de navegación;
- `notebook-page-transition.ts`: funciones puras o reducer comprobable;
- `notebook-motion.css`: movimiento y optimizaciones;
- `notebook-paper.css`: papel, desgaste, bordes y profundidad.

Los nombres definitivos pueden adaptarse a la convención existente. No se obliga a fragmentar componentes si la auditoría demuestra que aumenta complejidad sin aportar aislamiento.

### 5.2 Máquina de estados

La transición no debe depender de múltiples booleanos inconexos.

Estados mínimos sugeridos:

- `idle`;
- `preparing`;
- `turning-forward`;
- `turning-backward`;
- `settling`;
- `reduced-motion`.

Debe existir una única sección activa y, durante el giro, una sección destino.

Comportamiento requerido:

1. el usuario solicita otra sección;
2. se determina dirección según el orden estable de secciones;
3. contenido actual y destino permanecen montados durante el giro;
4. se inicia la transformación en el siguiente frame;
5. `transitionend` finaliza la transición;
6. se actualiza sección activa y foco;
7. se desmontan capas temporales.

Debe incluirse un temporizador de seguridad ligeramente superior a la animación, pero `transitionend` será la vía normal.

Durante una transición:

- no se iniciará otra animación simultánea;
- una petición posterior podrá descartarse o conservarse como único destino pendiente;
- no se crearán colas ilimitadas;
- no se harán llamadas HTTP por el mero hecho de girar una página;
- no se usarán `innerHTML`, clonaciones manuales del DOM ni contenido duplicado fuera de React.

---

## 6. Diseño visual requerido

### 6.1 Escritorio

A partir del ancho que determine la auditoría, preferentemente alrededor de 900 px:

- dos páginas visibles;
- lomo central claramente perceptible;
- tapa trasera visible alrededor del papel;
- ligero apilado de hojas;
- profundidad mediante sombras estáticas;
- pestañas laterales para las categorías principales;
- navegación anterior/siguiente;
- contador sólo cuando represente páginas reales; si son secciones, usar el nombre de sección y no un total ficticio.

### 6.2 Papel y desgaste

El papel se construirá principalmente con:

- gradientes lineales y radiales;
- ruido o fibra ligera sólo si ya existe un activo local apropiado;
- sombras internas;
- pequeñas variaciones entre página izquierda y derecha;
- bordes imperfectos mediante máscara o pseudo-elementos;
- pliegues y manchas muy sutiles.

Restricciones:

- no descargar texturas en tiempo de ejecución;
- no depender de CDN;
- no generar una imagen completa de la interfaz;
- no usar fotografías ficticias;
- cualquier foto real debe proceder del recurso de BloodKeeper correspondiente;
- cuando no exista imagen, mostrar una tarjeta tipográfica honesta, no una falsa fotografía.

### 6.3 Elementos de contenido

Los componentes reales podrán presentarse como:

- nota escrita;
- recorte;
- ficha breve de PNJ;
- referencia a localización;
- registro de sesión;
- etiqueta;
- sello de visibilidad;
- documento o artefacto vinculado.

Estos estilos son representaciones visuales de entidades ya existentes. No crean nuevos tipos de datos.

### 6.4 Identidad BloodKeeper

Mantener:

- shell, navegación y cabecera globales;
- paleta oscura exterior;
- vino/rojo como acento;
- tipografía clara y legible en controles;
- jerarquía visual existente;
- prefijo de clases `nb2-` o el prefijo vigente del módulo;
- aislamiento de estilos para evitar regresiones globales.

No aplicar el aspecto de papel a modales globales, menús o controles que deban seguir pareciendo parte de la aplicación.

---

## 7. Movimiento y rendimiento

### 7.1 Duración

El prototipo usa 720 ms y una finalización a 740 ms. Se ha comprobado que esa duración se percibe lenta.

Valores requeridos para producción:

- giro normal: entre **400 y 480 ms**;
- valor inicial recomendado: **440 ms**;
- asentamiento opcional: máximo **80 ms**;
- respuesta visual al clic: dentro del siguiente frame.

### 7.2 Propiedades animables

Durante el giro se animarán preferentemente:

- `transform`;
- `opacity` de sombras auxiliares.

No animar:

- `filter`;
- `box-shadow` complejo;
- grandes gradientes;
- dimensiones;
- posición mediante `top` o `left`;
- propiedades que provoquen relayout continuo.

El sombreado móvil debe vivir en una capa separada cuya opacidad pueda animarse.

### 7.3 Capas y ciclo de vida

- `will-change: transform` sólo mientras la hoja esté preparando o ejecutando el giro.
- Retirarlo al volver a `idle`.
- Usar `backface-visibility: hidden`.
- Mantener `transform-style: preserve-3d`.
- Evaluar `contain: layout paint` en la escena sin romper menús ni overlays.
- No aplicar `backdrop-filter` al árbol que gira.
- Evitar un `filter: drop-shadow()` grande sobre todo el libro durante la animación.
- Los recursos pesados no se recargarán al cambiar de página.
- No añadir dependencias nuevas salvo justificación y autorización expresa.

### 7.4 Criterios verificables

Con el contenido ya cargado:

- cambiar de página no genera peticiones de red;
- ningún bloqueo JavaScript superior a 50 ms atribuible al giro;
- la interfaz responde inmediatamente aunque la animación tarde 440 ms;
- no existe espera artificial de 720/740 ms;
- navegación repetida no deja el Cuaderno bloqueado;
- no aparecen destellos, caras invertidas o contenido vacío;
- CPU throttling moderado puede reducir fluidez, pero nunca romper el estado final;
- el resultado debe probarse en Chrome/Edge actual y Firefox actual.

No se exigirá una cifra de FPS absoluta sin especificar hardware. La revisión de rendimiento deberá adjuntar una traza o explicación breve de cualquier cuello de botella encontrado.

---

## 8. Navegación funcional

Debe definirse un orden estable de secciones para determinar avance y retroceso. Ese orden puede basarse en el actual:

1. Resumen
2. Notas
3. Sesiones
4. Etiquetas
5. PNJ
6. Localizaciones
7. Organizaciones
8. Artefactos
9. Documentos

Las pestañas superiores actuales seguirán siendo accesibles y fuente de navegación directa.

Reglas:

- cambiar filtros dentro de una misma sección no debe girar la página;
- seleccionar otra nota dentro de Notas no requiere un giro completo;
- abrir un PNJ, localización o recurso usa la vista rápida existente;
- abrir una ficha completa conserva el flujo existente;
- no animar la llegada de respuestas de API como si fuese un giro;
- si la sección de destino aún carga datos, finalizar el giro hacia su estado de carga real;
- si falla la carga, mostrar el error real dentro de la página destino;
- el botón Actualizar no debe reiniciar visualmente el libro completo.

---

## 9. Responsive

### 9.1 Escritorio

- dos páginas;
- navegación lateral y pestañas visibles;
- contenido sin recortes;
- altura adaptada al viewport sin fijar un mínimo que fuerce scroll innecesario.

### 9.2 Tableta

La auditoría decidirá entre doble página compacta o página única. Se priorizará legibilidad sobre conservar el efecto abierto.

### 9.3 Móvil

- una sola página;
- sin mostrar una página izquierda oculta pero accesible al foco;
- navegación mediante botones;
- swipe sólo si puede implementarse sin interferir con scroll, selección de texto o formularios;
- sin scroll horizontal;
- controles con área táctil suficiente;
- modales y formularios existentes completamente utilizables.

No se debe ocultar funcionalidad para conseguir la composición visual.

---

## 10. Accesibilidad

- Respetar `prefers-reduced-motion: reduce`.
- Con movimiento reducido, el cambio será inmediato o mediante un fundido muy corto.
- Mantener foco visible.
- Al terminar el giro, mover el foco únicamente si la acción lo requiere; no secuestrar el foco de formularios.
- Anunciar el nuevo nombre de sección en una región `aria-live="polite"`.
- Flechas izquierda/derecha sólo navegarán cuando el foco no esté en:
  - `input`;
  - `textarea`;
  - `select`;
  - elemento `contenteditable`;
  - diálogo abierto.
- Botones anterior/siguiente deben expresar su destino en `aria-label`.
- La cara posterior no visible tendrá `aria-hidden` o quedará fuera del árbol accesible.
- No duplicar IDs al mantener dos caras montadas.
- El contenido debe seguir siendo legible con zoom de texto al 200 %.
- Contraste de texto y controles debe conservarse sobre papel envejecido.

---

## 11. Persistencia y backend

Esta SPEC no requiere inicialmente:

- migraciones Prisma;
- endpoints nuevos;
- tablas de páginas;
- almacenamiento de coordenadas;
- reordenación persistente;
- sincronización en tiempo real adicional.

Las notas y referencias seguirán usando el modelo existente.

El arrastre de notas mostrado por el prototipo **no debe incorporarse como persistencia productiva** dentro de esta SPEC, porque requeriría modelo de posición, permisos, resolución responsive y estrategia de conflictos.

Si se desea edición libre de elementos, debe abrirse una SPEC independiente con:

- modelo de página y elemento;
- coordenadas normalizadas;
- orden Z;
- rotación y tamaño;
- permisos;
- validación;
- adaptación móvil;
- concurrencia;
- migraciones;
- endpoints y pruebas.

---

## 12. Seguridad y permisos

La capa visual no debe alterar:

- visibilidad `PRIVATE`, `CHRONICLE` o `SELECTED_PLAYERS`;
- destinatarios;
- capacidad de gestión;
- permisos de archivado;
- restricciones de acceso a documentos o recursos;
- filtrado realizado por backend.

No incluir datos restringidos en una cara oculta de la página si el usuario no está autorizado. Ocultar con CSS no es control de acceso.

---

## 13. Pruebas obligatorias

### 13.1 Tests automatizados

Añadir pruebas focales para:

- reducer o funciones puras de dirección y estado;
- transición hacia delante;
- transición hacia atrás;
- rechazo o consolidación de clics repetidos;
- finalización por `transitionend`;
- finalización por temporizador de seguridad;
- modo reduced motion;
- orden estable de secciones;
- teclado ignorado dentro de campos editables;
- ausencia de regresiones en los contratos actuales del Cuaderno;
- existencia de estilos y marcadores estructurales críticos.

Si el proyecto continúa usando Node Test Runner y tests de contrato textual, respetar ese sistema. No introducir un runner adicional sólo para esta SPEC.

### 13.2 Verificación visual manual

Comprobar al menos:

- 1440 × 900;
- 1280 × 720;
- 1024 × 768;
- 390 × 844;
- zoom del navegador al 125 %;
- texto al 200 %;
- `prefers-reduced-motion`;
- notas vacías;
- muchas notas;
- títulos largos;
- error de API;
- carga lenta simulada;
- apertura de modal;
- editor de nota;
- menú de menciones;
- cambio rápido de secciones;
- navegación con teclado.

### 13.3 Validación del proyecto

Ejecutar desde Docker, siguiendo las reglas del repositorio:

- tests focales web;
- suite web completa;
- typecheck;
- build;
- tests de integración afectados, si procede;
- `git diff --check`;
- comprobación de working tree y staging.

No usar el Node del host si la continuidad vigente exige Docker.

---

## 14. Entregables

1. Implementación React/CSS integrada.
2. Tests focales.
3. Resultado de auditoría previa.
4. Resultado de pruebas.
5. Comparación visual antes/después en escritorio y móvil.
6. Auditoría breve de rendimiento del giro.
7. Documento de cierre o continuidad.
8. Commit sólo tras preflight final y autorización del usuario.
9. Push sólo cuando el usuario lo autorice.

---

## 15. División recomendada por bloques

### SPEC-071-A — Auditoría y contrato de integración

- preflight;
- lectura de continuidad;
- inspección de la rama de prototipo;
- inventario de estados y flujos existentes;
- decisión documentada sobre qué zonas reciben animación;
- plan de archivos y tests.

No implementar todavía si aparecen contradicciones con continuidad o código vigente.

### SPEC-071-B — Motor de transición

- reducer/hook;
- dirección;
- caras React;
- `transitionend`;
- fallback;
- bloqueo o consolidación de entradas;
- reduced motion;
- tests focales.

Sin aplicar aún todo el acabado visual.

### SPEC-071-C — Libro y superficies

- tapa trasera;
- lomo;
- páginas;
- apilado;
- papel;
- desgaste;
- pestañas;
- sombras optimizadas;
- aislamiento CSS.

Sin contenido ficticio.

### SPEC-071-D — Integración del contenido real

- Resumen;
- Notas;
- Sesiones;
- Etiquetas;
- recursos;
- vistas rápidas;
- formularios;
- estados de carga y error;
- permisos.

### SPEC-071-E — Responsive y accesibilidad

- escritorio;
- tableta;
- móvil;
- teclado;
- foco;
- lector de pantalla;
- 200 %;
- reduced motion.

### SPEC-071-F — Rendimiento y regresión

- reducir giro a 400–480 ms;
- eliminar filtros o sombras animadas costosas;
- medir interacción;
- suite completa;
- build;
- revisión visual.

### SPEC-071-G — Cierre

- preflight;
- diff;
- resultados;
- capturas reales;
- autorización;
- commit;
- verificación posterior;
- continuidad.

---

## 16. Criterios de aceptación

La SPEC se considera terminada cuando:

- el Cuaderno parece un objeto físico usado sin dejar de ser una interfaz legible;
- la composición usa datos reales;
- la transición tarda entre 400 y 480 ms;
- el cambio de página no depende del servidor;
- no se generan peticiones HTTP por la animación;
- todas las secciones y acciones actuales siguen funcionando;
- no se filtran recursos restringidos;
- móvil usa una página sin pérdida funcional;
- reduced motion funciona;
- no se han añadido dependencias innecesarias;
- no existen imágenes generadas que suplanten una captura real;
- tests, typecheck y build pasan;
- el usuario ha validado capturas reales;
- no se ha tocado `main` ni realizado commit/push final sin autorización.

---

## 17. Fuera de alcance

- editor libre tipo muro de investigación;
- líneas SVG entre elementos;
- almacenamiento de coordenadas;
- multiusuario en tiempo real para mover elementos;
- WebGL o deformación física de malla;
- sonido de páginas;
- fotografías generadas;
- rediseño completo de BloodKeeper;
- cambios de API o base de datos no justificados por una regresión.

---

## 18. Prompt de arranque para otra conversación

```text
Continúa BloodKeeper con la SPEC-071 — Cuaderno físico animado y optimizado.

Repositorio:
TrombosisLab/bloodkeeper

Lee primero:
1. las instrucciones AGENTS.md aplicables;
2. la continuidad y decisiones arquitectónicas vigentes;
3. docs/specs/SPEC-071_PHYSICAL_ANIMATED_NOTEBOOK_UI_v1.0_DRAFT.md;
4. el Cuaderno real en apps/web/src/features/notebook/components/;
5. la referencia visual de la rama prototype/journal-real-demo-20260914,
   commit e1eecd968ccff10bb5fec0f0fac8fa11d64f38a8,
   archivo prototypes/journal-real-demo/index.html.

La rama de prototipo es sólo una referencia. No la fusiones ni implementes sobre ella.
Haz preflight y crea una rama de trabajo desde el main actual.
Empieza únicamente por SPEC-071-A: auditoría y contrato de integración.
No cambies código funcional todavía.
No hagas commit ni push sin mi autorización.
Usa Docker y scripts autocontenidos según las reglas del proyecto.
Devuélveme un resultado verificable y el siguiente paso exacto.
```
