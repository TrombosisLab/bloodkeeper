# 00 – MASTER DOCUMENTATION INDEX

## Proyecto
Vampiro V5 Revolution

## Propósito
Este documento define el orden de lectura y la jerarquía documental que debe utilizar Gemini actuando como equipo de desarrollo.

## Regla principal
La documentación define el producto y sus restricciones, pero no obliga a implementar todo simultáneamente.

El desarrollo será incremental. Ante cualquier conflicto, Gemini deberá señalarlo antes de inventar una solución.

## Orden de lectura

### Nivel 1 – Visión y documentación fundacional
Leer primero todos los documentos fundacionales existentes del proyecto:
- PRD / visión.
- Documentos 00–06 previamente aprobados.
- README del proyecto.
- Decisiones arquitectónicas ya aprobadas.

### Nivel 2 – Infraestructura y arquitectura
- SPEC-001 a SPEC-009.

### Nivel 3 – Interfaz base
- SPEC-010 a SPEC-014.

### Nivel 4 – Usuarios y acceso
- SPEC-015 a SPEC-018.

### Nivel 5 – Personajes
- SPEC-019 a SPEC-029.

### Nivel 6 – Crónicas
- SPEC-030 a SPEC-035.

### Nivel 7 – Dados
- SPEC-036 a SPEC-039.

### Nivel 8 – Administración y operación
- SPEC-040 a SPEC-043.

### Nivel 9 – Calidad y ejecución
- SPEC-044 a SPEC-055.

## Documentos especialmente vinculantes
Gemini deberá tener presentes durante todo el desarrollo:
- SPEC-044 – TESTING_AND_QUALITY.
- SPEC-046 – DEPLOYMENT_UPDATE_ROLLBACK.
- SPEC-047 – DEVELOPMENT_EXECUTION_PROTOCOL.
- SPEC-050 – SECURITY_BASELINE.
- SPEC-052 – DATA_MIGRATIONS_AND_INTEGRITY.
- SPEC-055 – PROJECT_COMPLETION_CRITERIA.

## Jerarquía ante conflictos
1. Instrucción explícita más reciente del usuario.
2. PRD y decisiones fundacionales aprobadas.
3. SPEC específica del módulo.
4. SPEC transversal.
5. Implementación existente validada.

Si existe una contradicción real, no asumir silenciosamente: informar y proponer la mínima corrección necesaria.

## Regla anti-burocracia
No crear nuevos documentos, capas, servicios, abstracciones o tecnologías salvo necesidad real del incremento actual.

## Resultado
Este índice será el punto de entrada documental para Gemini.
