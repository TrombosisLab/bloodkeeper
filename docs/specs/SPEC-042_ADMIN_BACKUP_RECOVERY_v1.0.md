# SPEC-042 – ADMIN_BACKUP_RECOVERY

## Información
| Campo | Valor |
|---|---|
| Código | SPEC-042 |
| Proyecto | Vampiro V5 Revolution |
| Versión | 1.0 |
| Estado | Aprobado |

## Propósito
Integrar la estrategia de backup y recuperación con la administración del sistema.

## Funciones
El sistema deberá permitir consultar:
- Estado de la última copia.
- Fecha.
- Resultado.
- Errores relevantes.
- Copias disponibles cuando sea seguro mostrarlas.

## Creación
La creación manual de una copia podrá iniciarse mediante una operación administrativa controlada o script.

## Restauración
La restauración será una operación de alto riesgo.

Deberá:
1. Identificar claramente la copia.
2. Advertir del impacto.
3. Requerir confirmación explícita.
4. Ejecutar un procedimiento reproducible.
5. Verificar el resultado.

La recuperación completa deberá seguir siendo posible desde SSH en un servidor limpio.

## Criterios de aceptación
- Estado de backups visible.
- Creación controlada.
- Restauración documentada y segura.
- Procedimiento independiente de que la interfaz web funcione.
