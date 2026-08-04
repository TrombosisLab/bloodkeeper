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

Ejecuta revisión de diff y shell, Compose, estructura, arquitectura
Docker, typecheck, pruebas, integración, Prisma, builds y smoke tests.

El resultado esperado termina con:

```text
VALIDACIÓN DE DESARROLLO COMPLETA
```

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

## Validación de backup y recuperación

```bash
backup="$(
  ./scripts/backup.sh     --output-dir /tmp/bloodkeeper-backup-validation |
  tail -n 1
)"

./scripts/restore.sh --verify "$backup"
```

Esta prueba restaura en una base temporal y no modifica la base activa.

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
