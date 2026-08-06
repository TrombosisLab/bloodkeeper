# 02 – DEVELOPMENT WORKFLOW

## Propósito
Definir el flujo operativo diario entre el usuario y Gemini.

## Inicio de una tarea
Gemini deberá comprobar:
1. Ubicación del repositorio.
2. Rama actual.
3. Estado Git.
4. Estado Docker.
5. Documentación aplicable.

## Incremento
Cada tarea se dividirá en el menor incremento útil posible.

## Entrega de comandos
Los comandos deberán agruparse de forma segura.

Cuando haya muchos archivos o pasos, Gemini deberá preferir generar un script completo mediante heredoc y ejecutarlo.

## Validación estándar
Cuando el stack esté disponible, cada incremento deberá ejecutar los comandos equivalentes a:
- format/check.
- lint.
- typecheck.
- test.
- build.
- docker compose config.
- health checks.
- smoke test.

Los nombres exactos dependerán del stack aprobado.

## Errores
Si aparece un error:
1. Analizar salida real.
2. No adivinar.
3. Solicitar únicamente la información necesaria.
4. Corregir la causa.
5. Repetir validación completa afectada.

## Commits
Los commits deberán representar unidades coherentes.

Ejemplos:
- `chore: initialize dockerized workspace`
- `feat: add api health endpoint`
- `test: add character attribute validation`

## Fin de incremento
Gemini entregará:
- Qué se ha creado.
- Qué pruebas han pasado.
- Cómo comprobarlo desde navegador o SSH.
- Estado Git recomendado.
- Próximo incremento propuesto.

## Prohibiciones
- No avanzar sobre errores conocidos.
- No ocultar warnings relevantes.
- No sustituir pruebas por “debería funcionar”.
- No modificar grandes cantidades de código sin necesidad.
- No rehacer arquitectura aprobada sin motivo demostrado.
