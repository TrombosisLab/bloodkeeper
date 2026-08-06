# Layout principal

## SPEC-012 — primer bloque estructural

Este incremento materializa un layout común reutilizable sin rediseñar la
interfaz existente.

### Implementado

- `AppLayout` concentra la estructura común de aplicación;
- conserva la cabecera existente mediante un slot contextual;
- conserva `AppNavigation` como navegación principal persistente;
- conserva las migas de creación ya implementadas por SPEC-011;
- define un único landmark `<main>` para cada vista autenticada;
- mantiene `application-content` en la raíz de Personajes;
- convierte el creador de personaje y Crónicas en secciones internas;
- conserva el comportamiento responsive y los estilos existentes sin
  modificarlos.

Los landmarks `<main>` de `AuthenticationGate` permanecen porque representan
estados alternativos de nivel superior. No se renderizan simultáneamente con
`AppLayout`: cuando la sesión está lista, el gate entrega la aplicación; en
carga, error o acceso no autenticado, muestra su propia vista principal.

## Frontera del incremento

Este bloque no:

- crea nuevas áreas, rutas o destinos;
- duplica o reemplaza la navegación de SPEC-011;
- rediseña Personajes, creación o Crónicas;
- modifica dominio, catálogos, API, Prisma o persistencia;
- inicia SPEC-013;
- crea la biblioteca genérica de componentes prevista por SPEC-014.

El sistema uniforme de mensajes y estados permanece pendiente dentro de
SPEC-012. Se abordará en un incremento posterior con el contrato estructural
mínimo y sin adelantar los componentes genéricos de SPEC-014.

## Estado

SPEC-012 permanece activa.

La validación visual manual fue confirmada por el usuario el 6 de agosto de
2026. Se comprobaron:

- Personajes en escritorio;
- creación de personaje en escritorio;
- Crónicas en escritorio;
- navegación compacta a 900 px o menos;
- navegación móvil a 600 px o menos;
- ausencia de desplazamiento horizontal nuevo;
- conservación de cabecera, menú, migas y espacios visuales.

## SPEC-012 — segundo bloque semántico

Este incremento normaliza los estados alcanzables de las vistas reales sin
crear componentes visuales genéricos:

- `loading` usa `role="status"`, `aria-live="polite"` y `aria-busy` cuando
  existe una operación en curso;
- `error` usa `role="alert"` y `aria-live="assertive"`;
- `permission` representa una sesión requerida, un recurso inaccesible o un
  acceso no autorizado ya contemplado por la vista;
- `empty` se anuncia de forma no intrusiva mediante `role="status"`;
- `content` identifica contenido disponible donde la vista mantiene ramas
  explícitas.

Aplicación por vista:

- Autenticación: loading, error, permission y contenido autenticado;
- Creación: loading, error, permission y content según persistencia;
- Crónicas: loading, empty, error, permission y content;
- Ficha persistida: loading, error, permission y content;
- Personajes: no añade estados propios porque orquesta la ficha demo, la ficha
  persistida y el creador; sus estados pertenecen a esos consumidores reales.

No se inventan ramas vacías o de permisos donde no existe una transición real.
No se crean `LoadingState`, `EmptyState`, `ErrorState` ni `PermissionState`.
Los estilos existentes permanecen intactos.

## Estado tras el segundo bloque

La validación visual manual fue confirmada por el usuario el 6 de agosto de
2026. Se verificaron:

- inicio y cierre de sesión;
- creación de personaje y persistencia del borrador;
- carga de ficha persistida;
- carga, vacío y listado de Crónicas;
- ausencia de cambios visuales, saltos de layout y mensajes duplicados.

SPEC-012 permanece activa únicamente hasta completar su auditoría de cierre.

SPEC-014 no se inicia. SPEC-016.A continúa suspendida.
