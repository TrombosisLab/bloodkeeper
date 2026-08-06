# SPEC-008 – SYSTEM_MONITORING

## Información

| Campo | Valor |
|---|---|
| Código | SPEC-008 |
| Documento | SYSTEM_MONITORING.md |
| Proyecto | Vampiro V5 Revolution |
| Versión | 1.0 |
| Estado | Aprobado |

## Propósito

Definir las capacidades mínimas de supervisión del sistema para conocer de forma sencilla si la plataforma funciona correctamente.

## Objetivos

- Detectar fallos con rapidez.
- Simplificar el diagnóstico.
- Evitar la necesidad de revisar código para conocer el estado del sistema.
- Proporcionar información comprensible al administrador.

## Estado del sistema

La plataforma deberá poder mostrar o consultar:

- Estado general de la aplicación.
- Estado de los contenedores.
- Estado de la base de datos.
- Uso de CPU.
- Uso de memoria.
- Espacio libre en disco.
- Estado de las copias de seguridad.
- Versión instalada.

## Comprobaciones

Deberán existir scripts `.sh` simples para:

- Consultar estado.
- Ejecutar una comprobación general.
- Consultar logs relevantes.
- Detectar servicios detenidos.

## Presentación visual

Cuando exista el panel de administración, el estado deberá poder consultarse visualmente mediante indicadores claros.

## Criterios de aceptación

- Estado consultable sin revisar código.
- Scripts de diagnóstico disponibles.
- Errores relevantes identificables.
- Información comprensible para un usuario no experto.
