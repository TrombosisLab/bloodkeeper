# Flujo de desarrollo

## Alcance

Este documento materializa SPEC-005 sobre el repositorio real de
BloodKeeper.

El objetivo es conservar el proyecto funcional entre incrementos,
trabajar únicamente sobre una SPEC aprobada y producir cambios pequeños,
verificables, documentados y reproducibles.

## Autoridad antes de implementar

Antes de modificar código debe identificarse la SPEC activa, leerse y
contrastarse con el código y las pruebas actuales.

No se inicia un desarrollo deducido, una mejora preventiva ni el bloque
posterior cuando contradiga o se adelante a la SPEC vigente.

Cuando exista contradicción, se aplica este orden:

1. instrucción más reciente del usuario;
2. código fuente;
3. pruebas;
4. documentación de continuidad y arquitectura vigente;
5. roadmap y estado de módulos;
6. resto de documentación;
7. documentación histórica.

## Inicio de un incremento

Comprobar desde la raíz:

```bash
git branch --show-current
git status --short --branch
git stash list
docker compose config --quiet
./scripts/check.sh
```

Definir antes de implementar:

- SPEC y bloque exactos;
- resultado esperado;
- archivos previsiblemente afectados;
- pruebas que demostrarán el cambio;
- límites expresos del incremento.

## Ciclo oficial

1. Seleccionar una SPEC aprobada.
2. Limitar el trabajo al menor incremento útil.
3. Crear una copia externa cuando el cambio sea relevante.
4. Implementar mediante un script SSH autocontenido cuando existan
   varios archivos o pasos.
5. Revisar el diff y ejecutar `git diff --check`.
6. Ejecutar validación técnica y funcional.
7. Comprobar regresiones mediante las suites afectadas y la validación
   completa antes del commit.
8. Actualizar documentación en el mismo incremento.
9. Revisar el conjunto exacto de archivos.
10. Crear un commit coherente únicamente tras validación.
11. Integrar en `main` únicamente tras validar el bloque completo.

## Automatización de desarrollo

Validación estándar completa:

```bash
./scripts/dev/check.sh
```

Comprobaciones parciales:

```bash
./scripts/dev/typecheck.sh
./scripts/dev/test.sh
./scripts/dev/build.sh
```

Comprobación del propio workflow:

```bash
./scripts/check-development-workflow.sh
```

Todos estos comandos usan Docker y `npm`. Node no es un requisito del
host.

El proyecto no tiene actualmente comandos propios de lint o format. No
deben añadirse herramientas nuevas de forma implícita; `git diff
--check`, TypeScript, las pruebas y los builds forman la validación
vigente.

## Errores

Cuando aparezca un error:

1. detener el avance;
2. conservar y analizar la salida real;
3. identificar la causa sin adivinar;
4. corregir únicamente el origen demostrado;
5. repetir la validación afectada;
6. incorporar una prueba de regresión cuando sea razonable;
7. repetir la validación completa antes del commit.

No se sustituye una prueba por una afirmación de que debería funcionar.

## Git

- Git es el sistema oficial de control de versiones.
- Los cambios relevantes se desarrollan en rama.
- Un commit representa una unidad coherente.
- No se reescribe el historial.
- No se mezcla trabajo suspendido con la SPEC activa.
- No se hace push sin autorización expresa.
- La ausencia de remoto no impide el workflow local.
- `main` solo recibe cambios ya validados.

## Evidencia de cierre

Cada incremento debe dejar constancia de:

- SPEC y alcance;
- archivos modificados;
- comandos ejecutados;
- resultados de typecheck, pruebas y build;
- validación operativa;
- rama, HEAD y estado Git;
- backup cuando proceda;
- commit creado o confirmación expresa de que todavía no existe.

Resultado obligatorio antes de continuar:

- cero fallos conocidos;
- documentación sincronizada;
- servicios saludables;
- working tree controlado;
- siguiente bloque aún no iniciado.

## Prohibiciones

- avanzar sobre errores conocidos;
- ocultar warnings relevantes;
- aplicar una SPEC histórica de forma que rompa el código vigente;
- crear catálogos, contratos o reglas paralelos;
- hacer refactors ajenos al bloque;
- añadir CI, dependencias o capas preventivas sin SPEC aprobada;
- integrar en `main` antes de validar;
- mezclar un stash suspendido con el incremento actual.
