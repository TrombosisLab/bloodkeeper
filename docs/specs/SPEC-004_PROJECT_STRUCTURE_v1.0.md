# SPEC-004 -- PROJECT_STRUCTURE

## Información

  Campo       Valor
  ----------- -----------------------
  Código      SPEC-004
  Documento   PROJECT_STRUCTURE.md
  Proyecto    Vampiro V5 Revolution
  Versión     1.0
  Estado      Aprobado

## Propósito

Definir la estructura oficial de directorios y organización del
repositorio para garantizar un proyecto modular, mantenible y escalable.

## Objetivos

-   Organización coherente.
-   Separación clara de responsabilidades.
-   Facilidad de mantenimiento.
-   Escalabilidad mediante módulos independientes.

## Estructura base

``` text
vampiro-v5-revolution/
├── app/
├── backups/
├── docker/
├── docs/
│   ├── foundation/
│   ├── specifications/
│   ├── sprints/
│   └── decisions/
├── logs/
├── modules/
├── prompts/
├── scripts/
├── tests/
└── .env
```

## Reglas

-   Cada módulo será autocontenido.
-   No se duplicará código.
-   La documentación residirá únicamente en `docs/`.
-   Los scripts de automatización residirán en `scripts/`.
-   Las pruebas estarán en `tests/`.

## Convenciones

-   Nombres de archivos en inglés.
-   Formato `kebab-case` para directorios y `UPPER_SNAKE_CASE` para
    documentos de especificación cuando proceda.
-   Estructura consistente en todos los módulos.

## Criterios de aceptación

-   La estructura puede crearse automáticamente.
-   Todos los componentes tienen una ubicación definida.
-   No existen directorios ambiguos ni redundantes.
