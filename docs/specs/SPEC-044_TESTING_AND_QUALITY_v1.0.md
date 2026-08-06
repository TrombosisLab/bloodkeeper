# SPEC-044 – TESTING_AND_QUALITY

## Información
| Campo | Valor |
|---|---|
| Código | SPEC-044 |
| Proyecto | Vampiro V5 Revolution |
| Versión | 1.0 |
| Estado | Aprobado |

## Propósito
Definir la estrategia mínima obligatoria de calidad para cada incremento.

## Regla principal
Ninguna función se considerará terminada únicamente porque compile o se vea correctamente.

Cada cambio deberá seguir:
1. Implementar.
2. Ejecutar pruebas.
3. Validar comportamiento.
4. Comprobar regresiones.
5. Documentar lo necesario.
6. Continuar.

## Tipos de pruebas
Según el cambio:
- Unitarias para dominio y reglas.
- Integración para persistencia y servicios.
- API para contratos relevantes.
- Interfaz para flujos críticos.
- Smoke tests para despliegue.

## Reglas V5
Las reglas mecánicas tendrán pruebas deterministas y casos límite.

## Corrección de errores
Todo error relevante corregido deberá incorporar una prueba de regresión cuando sea razonable.

## Criterios de aceptación
- Pruebas automatizadas útiles.
- Fallos bloquean integración.
- Reglas críticas cubiertas.
- Validación reproducible.
