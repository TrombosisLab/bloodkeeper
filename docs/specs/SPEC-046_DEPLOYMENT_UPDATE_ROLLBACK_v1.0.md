# SPEC-046 – DEPLOYMENT_UPDATE_ROLLBACK

## Información
| Campo | Valor |
|---|---|
| Código | SPEC-046 |
| Proyecto | Vampiro V5 Revolution |
| Versión | 1.0 |
| Estado | Aprobado |

## Propósito
Definir despliegue, actualización y reversión en Ubuntu LTS mediante Docker.

## Despliegue
La aplicación deberá poder desplegarse desde un servidor Ubuntu LTS limpio mediante procedimientos documentados y comandos ejecutables por SSH.

Docker será la unidad principal de portabilidad.

## Actualización
El procedimiento deberá contemplar:
1. Verificación previa.
2. Backup cuando exista riesgo para datos.
3. Obtención de la versión.
4. Build o descarga de imágenes.
5. Migraciones.
6. Arranque.
7. Health checks.
8. Validación funcional mínima.

## Rollback
Los cambios de alto riesgo deberán disponer de una estrategia razonable de reversión.

Podrá incluir:
- Versión Docker anterior.
- Restauración de backup.
- Reversión de migraciones cuando sea segura.
- Snapshot de VirtualBox en operaciones excepcionales de infraestructura.

## Criterios de aceptación
- Despliegue reproducible.
- Actualización por SSH.
- Datos protegidos.
- Verificación posterior.
- Rollback definido para cambios de riesgo.
