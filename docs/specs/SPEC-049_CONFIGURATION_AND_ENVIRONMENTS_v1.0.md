# SPEC-049 – CONFIGURATION_AND_ENVIRONMENTS

## Información
| Campo | Valor |
|---|---|
| Código | SPEC-049 |
| Proyecto | Vampiro V5 Revolution |
| Versión | 1.0 |
| Estado | Aprobado |

## Propósito
Definir la configuración de entornos sin introducir complejidad innecesaria.

## Entornos
Inicialmente se contemplarán únicamente los entornos que realmente se utilicen, como:
- Desarrollo.
- Producción local o servidor estable.

No se crearán múltiples entornos artificiales sin necesidad.

## Variables
La configuración variable se proporcionará mediante variables de entorno o mecanismos equivalentes compatibles con Docker.

## Secretos
- No se incluirán secretos reales en Git.
- Se proporcionarán archivos de ejemplo sin credenciales.
- Las claves deberán poder cambiarse sin modificar código.

## Validación
La aplicación deberá detectar configuraciones obligatorias ausentes y mostrar errores claros al arrancar.

## Docker
La configuración deberá permitir mover el despliegue a otra máquina sin depender de rutas o parámetros específicos del servidor original.

## Criterios de aceptación
- Configuración externa al código.
- Secretos fuera del repositorio.
- Arranque con validación.
- Portabilidad entre servidores.
