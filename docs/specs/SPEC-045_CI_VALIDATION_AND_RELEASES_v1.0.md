# SPEC-045 – CI_VALIDATION_AND_RELEASES

## Información
| Campo | Valor |
|---|---|
| Código | SPEC-045 |
| Proyecto | Vampiro V5 Revolution |
| Versión | 1.0 |
| Estado | Aprobado |

## Propósito
Definir las comprobaciones automáticas y el proceso básico de versiones.

## Validación automática
Antes de integrar cambios deberán ejecutarse, según el stack definitivo:
- Formato.
- Lint.
- Comprobación de tipos.
- Pruebas.
- Build.
- Validaciones de migraciones cuando corresponda.

## Regla
Gemini no deberá continuar acumulando cambios si la validación actual falla.

Primero deberá corregir o explicar claramente el bloqueo.

## Versiones
Las entregas estables deberán identificarse mediante versiones o etiquetas Git coherentes.

## Migraciones
Una release con cambios de base de datos deberá incluir:
- Migraciones versionadas.
- Backup previo cuando corresponda.
- Validación posterior.
- Estrategia de reversión razonable.

## Criterios de aceptación
- Validación automatizable con comandos claros.
- Builds reproducibles.
- Versiones identificables.
- Migraciones controladas.
