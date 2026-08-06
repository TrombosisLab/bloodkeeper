# SPEC-048 – DOCUMENTATION_AND_MANUALS

## Información
| Campo | Valor |
|---|---|
| Código | SPEC-048 |
| Proyecto | Vampiro V5 Revolution |
| Versión | 1.0 |
| Estado | Aprobado |

## Propósito
Definir la documentación viva que deberá acompañar al código y evitar que manuales y procedimientos queden para el final.

## Documentación mínima
A medida que exista funcionalidad real se mantendrán:
- README principal.
- Instalación desde Ubuntu LTS limpio.
- Despliegue y actualización.
- Backup y recuperación.
- Operación y diagnóstico.
- Arquitectura y decisiones relevantes.
- Manual de administrador.
- Manual de usuario cuando las funciones estén suficientemente estables.

## Regla de sincronización
La documentación deberá actualizarse en el mismo incremento que cambie un procedimiento, contrato o comportamiento relevante.

No se documentarán como terminadas funciones todavía inexistentes.

## Formato
La documentación fuente se mantendrá preferentemente en Markdown dentro del repositorio.

## Manuales
Los manuales se generarán progresivamente a partir del producto real. No se crearán capturas, rutas o instrucciones ficticias antes de disponer de la interfaz correspondiente.

## Criterios de aceptación
- Procedimientos reproducibles.
- Documentación alineada con el código.
- Sin instrucciones obsoletas conocidas.
- Manuales construidos sobre funcionalidad real.
