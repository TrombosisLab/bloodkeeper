# Validación del despliegue

## Validación automática

Desde la raíz del repositorio:

```bash
./scripts/check.sh
```

Resultado esperado:

```text
TODAS LAS COMPROBACIONES CORRECTAS
```

La comprobación valida:

- sintaxis de Docker Compose;
- estado saludable de PostgreSQL, API y web;
- acceso al frontend;
- health check de API y PostgreSQL;
- comunicación web → API.

## Validación estándar de un incremento

```bash
./scripts/dev/check.sh
```

Ejecuta revisión de diff y shell, formato, lint, Compose, estructura,
arquitectura Docker, typecheck, pruebas, integración, Prisma, builds y
smoke tests.

El resultado esperado termina con:

```text
VALIDACIÓN DE DESARROLLO COMPLETA
```

### Builds reproducibles

API y Web mantienen `package-lock.json` versionados. Sus Dockerfiles copian
`package*.json` antes del código y usan `npm ci`, por lo que una construcción
parte del grafo de dependencias fijado por el repositorio.

`./scripts/dev/build.sh` valida este contrato antes de Prisma y de los builds
de API y Web. El paquete `packages/character-rules` no instala dependencias de
forma independiente y no necesita un lockfile propio mientras mantenga ese
contrato.

La detección de servicios de `scripts/dev/common.sh` captura primero el listado
de Compose y lo valida después. Esto evita falsos negativos de `grep -q` bajo
`pipefail` durante las validaciones automatizadas.

El flujo y las evidencias obligatorias están definidos en
`docs/DEVELOPMENT_WORKFLOW.md`.

## Validación de estructura

```bash
./scripts/check-project-structure.sh
```

La comprobación valida aplicaciones, pruebas, paquete compartido,
scripts, documentación, secretos y datos de ejecución.

## Estado de los contenedores

```bash
docker compose ps
```

Los tres servicios deben mostrar estado `healthy`.

## Validación de configuración

```bash
docker compose config --quiet
docker compose exec -T api npx prisma validate
```

Ambos comandos deben finalizar sin errores.

## Calidad del código

```bash
docker compose exec -T api npm run typecheck
docker compose exec -T api npm run build
docker compose exec -T web npm run typecheck
docker compose exec -T web npm run build
docker compose exec -T api npm test
docker compose exec -T api npm run test:integration
docker compose exec -T web npm test
```

Todas las suites deben finalizar con cero fallos.

## Validación de SPEC-006

```bash
./scripts/check-deployment.sh
./scripts/check-deployment.sh --with-backup
```

La primera comprobación valida host, entorno, contratos de despliegue y
servicios. La segunda añade un backup real y una restauración en una
base temporal sin sustituir la base activa.

## Validación de backup y recuperación

```bash
backup="$(
  ./scripts/backup.sh     --output-dir /tmp/bloodkeeper-backup-validation |
  tail -n 1
)"

./scripts/restore.sh --verify "$backup"
```

Esta prueba restaura en una base temporal y no modifica la base activa.

## Validación de SPEC-007

```bash
./scripts/check-backup-recovery.sh
./scripts/check-backup-recovery.sh --with-full-backup
```

La primera comprueba alcance, política, tarea programada y operación.
La segunda crea una copia completa real, captura el volumen y restaura
el dump en una base temporal sin sustituir la base activa.

El resultado esperado termina con:

```text
BACKUP Y RECUPERACIÓN SPEC-007 CORRECTOS
```

## Validación de SPEC-008

```bash
./scripts/status.sh
./scripts/check-system-monitoring.sh
```

La primera orden muestra el estado completo. La segunda valida el
contrato documental, los scripts de diagnóstico y el funcionamiento
operativo.

El resultado esperado termina con:

```text
MONITORIZACIÓN SPEC-008 CORRECTA
```

## Validación de SPEC-009

```bash
./scripts/check-maintenance-operations.sh
./scripts/check-maintenance-operations.sh \
  --with-restart \
  --with-backup
```

La primera orden valida los contratos y operaciones no destructivas. La
segunda añade un reinicio real controlado y una restauración temporal.

El resultado esperado termina con:

```text
MANTENIMIENTO SPEC-009 CORRECTO
```

## Validación de SPEC-010.A

```bash
./scripts/check-ui-design-system.sh
```

Comprueba tokens, adopción inicial, accesibilidad base, ausencia de una
biblioteca UI externa, typecheck, pruebas y build web. Después debe realizarse
una revisión visual manual de las vistas afectadas.

## Comprobación desde navegador

1. Abrir `http://DIRECCION_LAN:5173`.
2. Comprobar que aparece la página de acceso.
3. Iniciar sesión con una cuenta válida.
4. Abrir `Personajes`.
5. Comprobar que la ficha o el flujo de personaje es visible.
6. Recargar la página.
7. Comprobar que la aplicación continúa operativa.

La SPEC-001 describía una ficha vacía previa a la autenticación. En el
estado actual, funcionalidades posteriores aprobadas protegen la
aplicación mediante login; no deben retirarse para reproducir aquel
estado histórico.

## Registros

Últimas 100 líneas de todos los servicios:

```bash
./scripts/logs.sh
```

Solo API:

```bash
./scripts/logs.sh api --lines 200
```

Seguimiento en tiempo real:

```bash
./scripts/logs.sh web --follow
```

Los errores provocados deliberadamente por pruebas de restricciones
pueden aparecer en PostgreSQL. Deben interpretarse junto con el
resultado de las suites y los health checks.

## Evidencia de cierre

Conservar:

- salida de `bootstrap-server.sh`;
- salida de `check.sh`;
- resultado de las suites;
- `docker compose ps`;
- validación visual;
- rama, HEAD y `git status`.

La aceptación definitiva de instalación desde servidor limpio requiere
ejecutar el procedimiento en una VM Ubuntu Server 24.04 recién creada o
restaurada a un snapshot limpio.

### Versiones de release

La validación estándar comprueba que API, Web y el paquete compartido de
reglas mantienen una versión `MAJOR.MINOR.PATCH` sincronizada.

```bash
./scripts/dev/release-check.sh --candidate vMAJOR.MINOR.PATCH
./scripts/dev/release-check.sh --tag vMAJOR.MINOR.PATCH
```

El proceso completo está documentado en `docs/RELEASES.md`.

## Validación de actualización — SPEC-046-B

```bash
./scripts/check-update-workflow.sh
```

Comprueba el contrato del flujo de actualización y ejecuta un precheck real
no destructivo contra `HEAD`. El modo `--apply` exige un working tree limpio
y confirmación explícita; no se ejecuta durante un incremento aún no
comprometido en Git.

## Validación de rollback — SPEC-046-C

```bash
./scripts/check-rollback-workflow.sh
```

Valida el contrato, usa un backup completo real para ejecutar un precheck
no destructivo y comprueba que operaciones de impacto requieren confirmación.
No cambia HEAD ni restaura la base durante esta validación.

## Actualización controlada de dependencias y seguridad

Toda actualización de seguridad o dependencias debe ser controlada,
revisable y validada como un incremento independiente. API y Web
mantendrán sus `package-lock.json` versionados y las construcciones
seguirán usando `npm ci`.

No se aplicarán actualizaciones masivas de dependencias sin revisar su
alcance. Tras cualquier cambio de versiones se ejecutará, como mínimo:

```bash
bash scripts/dev/check.sh
```

La actualización no se considerará válida mientras typecheck, tests,
build, Docker Compose y health checks no permanezcan correctos.

## SPEC-054 — Accesibilidad, responsive y compatibilidad

La Web prioriza navegadores modernos mantenidos. El objetivo operativo es la versión estable actual de Chrome/Chromium, Microsoft Edge, Firefox y Safari. No se mantiene compatibilidad específica con navegadores obsoletos ni se incorporan polyfills o capas legacy salvo necesidad explícita y documentada.

La validación transversal de SPEC-054 combina comprobaciones automáticas y un smoke test manual en navegador. Las comprobaciones automáticas deben conservar el `lang="es"`, el `viewport` responsive, controles HTML nativos o semánticos, foco visible, nombres accesibles en formularios, estados que no dependan únicamente del color, media queries responsive y un toolchain moderno (`ES2022` + Vite).

Antes del cierre de un cambio que afecte a superficies Web críticas se comprobarán tamaños representativos:

- móvil: aproximadamente 360 × 800 CSS px;
- tablet: aproximadamente 768 × 1024 CSS px;
- escritorio: aproximadamente 1440 × 900 CSS px.

El smoke test cubrirá, según los permisos disponibles, autenticación, navegación principal/Inicio, Personajes (listado, creador y ficha), Crónicas y sus paneles principales, Dados y Administración. Se verificará que no exista desplazamiento horizontal injustificado, que los controles táctiles principales sean utilizables y que la reorganización responsive preserve la funcionalidad.

La navegación básica por teclado se comprobará con `Tab` y `Shift+Tab`, activación con `Enter` o `Espacio` cuando corresponda, foco visible durante el recorrido y ausencia de trampas de teclado. También se comprobará visualmente que textos, controles, mensajes y estados críticos mantengan contraste legible y que la información relevante no se comunique únicamente mediante color.

Estas comprobaciones no exigen que las vistas sean idénticas entre escritorio, tablet y móvil; la reorganización es válida mientras conserve funcionalidad y comprensión.
