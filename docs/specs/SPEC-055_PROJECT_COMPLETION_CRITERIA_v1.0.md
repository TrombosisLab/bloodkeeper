# SPEC-055 – PROJECT_COMPLETION_CRITERIA

## Información
| Campo | Valor |
|---|---|
| Código | SPEC-055 |
| Proyecto | Vampiro V5 Revolution |
| Versión | 1.0 |
| Estado | Aprobado |

## Propósito
Definir cuándo un incremento, módulo o versión puede considerarse terminado.

## Definition of Done de un incremento
Un incremento estará terminado cuando:
- Cumpla el alcance acordado.
- Compile y arranque.
- Supere lint, tipos y pruebas aplicables.
- Disponga de validación funcional reproducible.
- No rompa funciones existentes conocidas.
- Incluya migraciones si son necesarias.
- Actualice documentación afectada.
- No deje secretos ni código temporal inseguro.

## Módulo
Un módulo estará terminado cuando sus casos de uso previstos para esa versión sean utilizables de extremo a extremo y estén integrados sin romper la arquitectura modular.

## Release
Una versión candidata deberá:
- Construirse desde el repositorio.
- Desplegarse mediante el procedimiento documentado.
- Superar health checks.
- Superar smoke tests.
- Tener backup/rollback definido cuando proceda.

## Regla
No se considerará progreso real acumular código no validado.

## Criterios de aceptación
Este documento constituye el criterio común de cierre para Gemini y para la revisión del usuario.
