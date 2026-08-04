# Estructura del proyecto

## Alcance

Este documento materializa SPEC-004 sobre la arquitectura real y ya
consolidada de BloodKeeper.

La estructura histórica proponía directorios raíz `app/`, `modules/` y
`tests/`. El código, las pruebas y los contratos vigentes evolucionaron
a un monorepo con aplicaciones separadas y un paquete compartido. No se
crean directorios paralelos que dupliquen esa arquitectura.

## Estructura oficial

```text
vampiro-v5-revolution/
├── apps/
│   ├── api/
│   │   ├── prisma/
│   │   ├── src/
│   │   └── tests/
│   └── web/
│       ├── src/
│       └── tests/
├── backups/
├── docker/
├── docs/
├── packages/
│   └── character-rules/
├── scripts/
│   └── dev/
├── compose.yaml
├── .env
└── README.md
```

## Responsabilidades

### `apps/api`

Backend NestJS, persistencia Prisma, API HTTP y casos de uso.

Los módulos funcionales separan, cuando corresponde:

- `domain`;
- `application`;
- `infrastructure`;
- `presentation`.

Las migraciones pertenecen exclusivamente a `apps/api/prisma`.

### `apps/web`

Frontend React y Vite.

La organización principal es por funcionalidad bajo `src/features`.
Los componentes visuales reutilizables permanecen en `src/components`.

### `packages`

Código y datos compartidos por más de una aplicación.

`packages/character-rules` es la fuente compartida de los catálogos que
ya fueron extraídos formalmente. No deben crearse copias paralelas en API
o web.

### `scripts`

Automatización reproducible para instalación, desarrollo, operación,
validación, backup y recuperación.

No se mantienen scripts de operación fuera de este directorio.

### `docs`

Documentación técnica y funcional del proyecto.

Se permiten únicamente estas excepciones:

- `README.md` en la raíz como entrada principal;
- `README.md` dentro de `backups`, `docker` y `scripts` para documentar
  el propósito inmediato de esos directorios.

### `backups`

Punto de salida documentado para copias locales. Los archivos de backup
reales no se versionan.

### `docker`

Documentación o recursos Docker adicionales. La orquestación oficial
permanece en `compose.yaml`.

## Pruebas

Las pruebas pertenecen a la aplicación que validan:

- `apps/api/tests`;
- `apps/web/tests`.

No se crea un directorio `tests/` raíz porque duplicaría la estructura
vigente y rompería los comandos de prueba actuales.

## Convenciones

- Nombres técnicos y archivos fuente en inglés.
- Directorios funcionales en `kebab-case`.
- Componentes React en `PascalCase`.
- Archivos de dominio y utilidades en `kebab-case`.
- Migraciones Prisma conservan el formato generado:
  `YYYYMMDDHHMMSS_descripcion`.
- Las especificaciones históricas pueden usar
  `UPPER_SNAKE_CASE` cuando corresponda.

## Reglas estructurales

1. Cada archivo debe tener una responsabilidad y ubicación inequívocas.
2. No se crean módulos, catálogos ni contratos duplicados.
3. El código compartido se extrae a `packages` solo cuando más de una
   aplicación lo consume.
4. API y web no mezclan infraestructura ni presentación entre sí.
5. Los datos de ejecución, secretos, logs y backups no se versionan.
6. Cualquier nueva carpeta raíz requiere una SPEC aprobada.
7. La estructura debe validarse mediante:

```bash
./scripts/check-project-structure.sh
```

## Reconstrucción

La combinación de Git, `bootstrap-server.sh` y `compose.yaml` reconstruye
la estructura y el entorno operativo. Los datos persistentes se
recuperan mediante los procedimientos de `docs/RECOVERY.md`.
