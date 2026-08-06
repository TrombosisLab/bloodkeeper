# SPEC-043 – ADMIN_LOGS_AUDIT

## Información
| Campo | Valor |
|---|---|
| Código | SPEC-043 |
| Proyecto | Vampiro V5 Revolution |
| Versión | 1.0 |
| Estado | Aprobado |

## Propósito
Definir registros técnicos y auditoría mínima necesaria.

## Logs técnicos
Deberán permitir diagnosticar:
- Errores de aplicación.
- Fallos de servicios.
- Problemas de base de datos.
- Operaciones de mantenimiento.

## Auditoría funcional
Solo se registrarán acciones sensibles cuando aporten valor, como:
- Cambios administrativos relevantes.
- Operaciones de backup o restauración.
- Cambios críticos de cuentas o permisos.

## Restricciones
- No registrar contraseñas.
- No registrar tokens o secretos.
- Evitar datos personales innecesarios.
- No convertir la auditoría en un registro exhaustivo de cada clic.

## Retención
La política deberá evitar crecimiento ilimitado y permitir rotación cuando corresponda.

## Criterios de aceptación
- Diagnóstico posible.
- Acciones sensibles trazables.
- Secretos excluidos.
- Logs gestionables y rotables.
