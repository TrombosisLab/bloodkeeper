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
reglas, API, Prisma ni persistencia. SPEC-011 permanece abierta hasta cubrir
sus áreas y criterios completos. SPEC-016.A continúa suspendida.

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

SPEC-011 permanece abierta hasta que las áreas pendientes dispongan de sus
consumidores y de la SPEC que autorice su integración. SPEC-016.A continúa
suspendida.
