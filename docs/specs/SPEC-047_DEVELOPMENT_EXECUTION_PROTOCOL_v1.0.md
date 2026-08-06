# SPEC-047 – DEVELOPMENT_EXECUTION_PROTOCOL

## Información
| Campo | Valor |
|---|---|
| Código | SPEC-047 |
| Proyecto | Vampiro V5 Revolution |
| Versión | 1.0 |
| Estado | Aprobado |

## Propósito
Definir cómo Gemini, actuando como equipo de desarrollo, deberá ejecutar el proyecto.

## Principio fundamental
El proyecto avanzará mediante incrementos pequeños, funcionales, comprobables y documentados.

## Ciclo obligatorio
Para cada incremento:
1. Revisar documentación aplicable.
2. Definir un objetivo pequeño.
3. Implementar únicamente ese alcance.
4. Ejecutar validaciones automáticas.
5. Levantar o actualizar el entorno.
6. Proporcionar una comprobación funcional clara.
7. Corregir cualquier fallo antes de continuar.
8. Actualizar documentación técnica necesaria.
9. Realizar commit coherente cuando corresponda.

## Trabajo por SSH
El usuario administra el servidor mediante SSH.

Gemini deberá proporcionar:
- Comandos directamente ejecutables.
- Scripts `.sh` cuando haya varios pasos.
- Comandos para crear o modificar archivos sin exigir edición manual.

No deberá depender de que el usuario copie fragmentos manualmente dentro de editores de terminal.

## Arquitectura
- Modularidad obligatoria.
- Evitar código espagueti.
- No crear abstracciones sin necesidad.
- No introducir microservicios salvo justificación futura.
- No añadir tecnologías porque sí.
- Mantener responsabilidades claras.

## Docker
El entorno deberá ejecutarse mediante Docker para facilitar portabilidad.

## Decisiones técnicas
Antes de añadir una dependencia importante, Gemini deberá justificar brevemente:
- Qué problema resuelve.
- Por qué es necesaria ahora.
- Qué alternativa más simple se descartó.

## Control de alcance
Gemini no implementará funciones futuras no solicitadas solo porque parezcan útiles.

La documentación define dirección, no obliga a construir todo simultáneamente.

## Primera prioridad
Crear un esqueleto funcional mínimo que permita comprobar:
- Infraestructura.
- Docker.
- Frontend.
- Backend.
- Base de datos cuando corresponda.
- Health checks.
- Flujo de desarrollo.

Después se avanzará módulo por módulo.

## Criterios de aceptación
- Incrementos pequeños.
- Cada cambio probado.
- Comandos reproducibles por SSH.
- Arquitectura modular.
- Complejidad controlada.
- Ningún avance sobre una base rota.
