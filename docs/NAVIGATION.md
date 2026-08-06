# Navegación

## SPEC-011 — primer bloque incremental

Este bloque establece la base de navegación para los consumidores que existen
realmente en la aplicación: **Personajes** y **Crónicas**.

Incluye:

- menú principal persistente;
- sección activa mediante `aria-current="page"`;
- menú lateral en escritorio;
- menú colapsable en tablet;
- disposición móvil de una columna;
- ubicaciones nativas `#/characters`, `#/characters/create` y
  `#/chronicles`;
- sincronización con el historial del navegador;
- mantenimiento de la creación dentro de la sección Personajes;
- visibilidad de Crónicas limitada al permiso de narrador ya existente.

La solución no incorpora una dependencia de router porque las ubicaciones
actuales son reducidas y pueden resolverse con la API nativa del navegador.

## Frontera de alcance

No se crean pantallas vacías ni destinos ficticios para Inicio, Dados,
Administración, Configuración o Ayuda. Esas áreas se incorporarán a la
navegación únicamente cuando exista un consumidor real y la SPEC que autorice
su funcionalidad.

Este bloque no modifica formularios, tablas, diálogos, dominio, catálogos,
reglas, API, Prisma ni persistencia. En este punto intermedio, SPEC-011
permanecía abierta hasta completar su siguiente bloque autorizado.
SPEC-016.A continuaba suspendida.

## SPEC-011 — segundo bloque incremental

El segundo bloque incorpora migas de pan únicamente en la vista anidada real
de creación de personaje:

- cadena **Personajes → Crear personaje**;
- `Personajes` actúa como regreso a `#/characters`;
- `Crear personaje` identifica la ubicación actual;
- la miga aparece antes del contenido del creador;
- no se muestra en las raíces de Personajes o Crónicas;
- el botón existente `Ver ficha` permanece disponible;
- no se añaden rutas, dependencias ni pantallas nuevas.

Inicio, Dados, Administración, Configuración y Ayuda continúan bloqueados como
entradas del menú porque no existe un consumidor real de nivel de aplicación.
Una palabra coincidente en formularios, tipos, comentarios o pruebas no
autoriza una sección navegable.

## Cierre incremental autorizado de SPEC-011

Por decisión expresa del proyecto del **6 de agosto de 2026**, SPEC-011 queda
cerrada de forma incremental con el alcance real implementado y validado:

- navegación principal entre **Personajes** y **Crónicas**;
- sección activa y ubicaciones nativas mediante hash;
- sincronización con el historial del navegador;
- conservación del contexto de creación de personaje;
- permiso existente de narrador para Crónicas;
- menú lateral en escritorio y menú colapsable en tablet y móvil;
- miga **Personajes → Crear personaje** en la única vista anidada real;
- accesibilidad mediante estructura semántica, `aria-current` y foco visible.

Las áreas **Inicio**, **Dados**, **Administración**, **Configuración** y
**Ayuda** quedan aplazadas hasta que sus SPEC correspondientes creen un
consumidor real y autoricen su integración. Este aplazamiento forma parte del
cierre aprobado y no constituye un requisito técnico pendiente de SPEC-011.

No se crean botones, rutas ni pantallas ficticias para representar esas áreas.
Su futura incorporación se realizará dentro de la SPEC correspondiente y no
invalida este cierre incremental.

SPEC-016.A continúa suspendida y su trabajo guardado no se modifica.
