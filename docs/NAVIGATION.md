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
