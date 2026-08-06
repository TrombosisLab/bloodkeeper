# SPEC-041 – ADMIN_SYSTEM_OPERATIONS

## Información
| Campo | Valor |
|---|---|
| Código | SPEC-041 |
| Proyecto | Vampiro V5 Revolution |
| Versión | 1.0 |
| Estado | Aprobado |

## Propósito
Definir las operaciones técnicas disponibles desde administración y SSH.

## Operaciones
La administración podrá integrar progresivamente:
- Estado de servicios.
- Estado de contenedores.
- Salud de base de datos.
- Uso básico de recursos.
- Consulta de logs relevantes.
- Versión instalada.
- Reinicios controlados cuando sean seguros.

## SSH
Las operaciones de mantenimiento deberán seguir siendo posibles mediante scripts `.sh` ejecutables directamente por SSH.

La interfaz web no sustituirá los procedimientos de recuperación por consola.

## Seguridad
- No ejecutar comandos arbitrarios desde la interfaz.
- Utilizar operaciones predefinidas.
- Confirmar acciones de impacto.
- Registrar errores de forma comprensible.
- No mostrar secretos.

## Criterios de aceptación
- Diagnóstico básico accesible.
- Scripts y panel coherentes.
- Sin terminal web arbitraria.
- Operaciones protegidas por permisos.
