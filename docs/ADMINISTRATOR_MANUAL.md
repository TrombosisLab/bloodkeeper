# Manual de administrador

## Alcance

Este manual cubre la administración real disponible en BloodKeeper /
Vampiro V5 Revolution.

Distingue dos planos:

- administración mediante la interfaz web;
- operación técnica del servidor mediante SSH.

El rol global de Administrador no sustituye al rol contextual de Narrador
dentro de una Crónica.

## Primera cuenta administrativa

Después de un despliegue inicial puede crearse la primera cuenta mediante SSH:

```bash
./scripts/create-initial-admin.sh
```

La contraseña se solicita sin mostrarla.

El despliegue completo está documentado en `DEPLOYMENT.md`.

## Acceso a Administración

La entrada **Administración** sólo aparece para una sesión con rol global
`admin`.

El backend vuelve a comprobar ese rol; ocultar o mostrar la navegación no es
la única barrera de autorización.

## Usuarios y cuentas

La sección administrativa permite trabajar con las cuentas existentes.

El listado se carga por páginas. La primera página muestra hasta 25 cuentas y,
cuando existen más, **Cargar más usuarios** añade el siguiente bloque sin
sustituir las cuentas ya visibles.

Las operaciones materializadas incluyen:

- listar usuarios;
- crear cuentas;
- cambiar estado;
- cambiar roles;
- restablecer credenciales.

Los roles globales disponibles son:

- `admin`;
- `narrator`;
- `player`.

Una cuenta debe conservar al menos un rol.

El autorregistro público, cuando se utiliza desde la pantalla de acceso, crea
exclusivamente cuentas `player`.

### Roles

La asignación de `admin` permite acceder al módulo administrativo.

La asignación global de `narrator` habilita las capacidades globales previstas
para Narrador, pero la gestión de recursos dentro de una Crónica también
depende de la participación contextual en esa Crónica.

No se debe conceder `admin` para resolver un permiso narrativo.

## Diagnóstico del sistema

Administración dispone de una proyección de diagnóstico técnico ya
materializada.

Para diagnóstico completo y operación se mantiene SSH como canal oficial.

Comandos principales:

```bash
./scripts/status.sh
./scripts/check.sh
./scripts/logs.sh
```

`status.sh` muestra el estado general, contenedores, PostgreSQL, recursos,
backups y versión.

`check.sh` valida Compose, servicios, frontend, API, base de datos e integración
Web → API.

## Logs y auditoría

Consulta general:

```bash
./scripts/logs.sh
```

API:

```bash
./scripts/logs.sh api --lines 200
```

Seguimiento de PostgreSQL:

```bash
./scripts/logs.sh postgres --follow
```

La auditoría funcional mínima de acciones sensibles de la API usa líneas con
el prefijo:

```text
[AUDIT]
```

Consulta orientativa:

```bash
./scripts/logs.sh api --lines 500 |
  grep '\[AUDIT\]'
```

Las acciones sensibles realizadas desde scripts del host publican eventos
estructurados en `journald` con la etiqueta `bloodkeeper-audit`:

```bash
journalctl \
  -t bloodkeeper-audit \
  --since today \
  --no-pager
```

La auditoría no es un registro exhaustivo de cada petición o clic.

## Copias de seguridad

### Estado desde Administración

La Web puede mostrar el estado sanitizado de las copias de seguridad.

La interfaz no recibe acceso a paquetes reales, rutas privadas ni al socket de
Docker.

### Solicitud manual desde Administración

Cuando el servicio de solicitud manual está instalado, un Administrador puede
pedir una copia completa desde la interfaz.

La operación exige confirmación porque una copia completa puede detener
temporalmente la aplicación.

La API no ejecuta Docker. La petición crea un marcador controlado que un
servicio del host procesa mediante el runner aprobado.

Estado del watcher:

```bash
./scripts/install-manual-backup-request-service.sh --status
```

Instalación:

```bash
./scripts/install-manual-backup-request-service.sh --install
```

### Backup por SSH

Copia lógica:

```bash
./scripts/backup.sh
```

Copia completa:

```bash
./scripts/backup-full.sh
```

La política completa se documenta en `RECOVERY.md`.

## Restauración

La restauración no se ejecuta desde la Web. Continúa siendo una operación SSH.

Verificación no destructiva de un dump:

```bash
./scripts/restore.sh --verify backups/ARCHIVO.dump
```

Aplicación confirmada:

```bash
./scripts/restore.sh \
  --apply backups/ARCHIVO.dump \
  --confirm
```

Verificación de un paquete completo:

```bash
./scripts/restore-full.sh \
  --verify /ruta/bloodkeeper_full_FECHA.tar.gz
```

No aplicar una restauración sin comprobar antes qué datos serán sustituidos.

## Inicio, parada y reinicio

Iniciar:

```bash
./scripts/start.sh
```

Detener:

```bash
./scripts/stop.sh --confirm
```

Reiniciar:

```bash
./scripts/restart.sh --confirm
```

Parada y reinicio exigen confirmación.

No usar durante la operación habitual:

```bash
docker compose down --volumes
```

Ese comando eliminaría el volumen PostgreSQL.

## Actualización

Precomprobación:

```bash
./scripts/apply-update.sh \
  --check \
  --target REFERENCIA_GIT_LOCAL
```

Aplicación:

```bash
./scripts/apply-update.sh \
  --apply \
  --target REFERENCIA_GIT_LOCAL \
  --confirm
```

El flujo de actualización:

1. valida el estado previo;
2. crea y verifica un backup completo;
3. instala una referencia Git ya disponible localmente;
4. reconstruye API y Web;
5. arranca PostgreSQL;
6. aplica `prisma migrate deploy`;
7. arranca API y Web;
8. espera health checks;
9. ejecuta la validación operativa.

El procedimiento no ejecuta `git fetch` ni `git pull`.

La referencia objetivo debe existir previamente en el repositorio local.

## Rollback

Cada actualización preparada genera un plan que identifica la versión previa y
el backup correspondiente.

Precheck:

```bash
./scripts/rollback-update.sh \
  --check \
  --plan RUTA/update_plan_*.txt
```

Rollback de código cuando no hubo migraciones:

```bash
./scripts/rollback-update.sh \
  --apply \
  --plan RUTA/update_plan_*.txt \
  --confirm
```

Si el plan contiene migraciones, no se intenta SQL inverso automático y no se
permite volver sólo el código.

La restauración explícita de datos exige:

```bash
./scripts/rollback-update.sh \
  --apply \
  --plan RUTA/update_plan_*.txt \
  --restore-data \
  --confirm-data-restore \
  --confirm
```

Una restauración puede descartar cambios posteriores al backup. Debe evaluarse
ese impacto antes de confirmar.

## Actualizaciones de alto riesgo

Antes de cambios importantes debe valorarse:

- backup completo verificado;
- versión anterior identificada;
- plan de reversión;
- snapshot de VirtualBox cuando el cambio de infraestructura lo justifique.

El snapshot de VirtualBox es una operación manual del host. No se automatiza
desde la VM.

## Programación de backups

Estado:

```bash
./scripts/install-backup-schedule.sh --status
```

Instalación de la programación aprobada:

```bash
./scripts/install-backup-schedule.sh --install
```

Eliminación:

```bash
./scripts/install-backup-schedule.sh --remove
```

La política vigente y la retención están documentadas en `RECOVERY.md`.

## Validación administrativa

Validación operativa mínima:

```bash
./scripts/check.sh
```

Validación completa de desarrollo:

```bash
./scripts/dev/check.sh
```

Los procedimientos específicos de backup, recuperación, despliegue y
mantenimiento disponen además de sus validadores documentados en
`VALIDATION.md`.

## Seguridad operacional

Reglas básicas:

- no compartir credenciales;
- no guardar contraseñas en documentación o scripts;
- no dar acceso a Docker a la API;
- no usar una terminal web arbitraria;
- no modificar manualmente la base de producción como procedimiento normal;
- no restaurar datos sin una copia y verificación adecuadas;
- no conceder roles adicionales como solución genérica a errores de permisos;
- no hacer push o cambios Git operativos sin la autorización correspondiente.

## Documentación relacionada

- `DEPLOYMENT.md`: instalación y despliegue;
- `MAINTENANCE_OPERATIONS.md`: operación por SSH;
- `RECOVERY.md`: backup y recuperación;
- `SYSTEM_MONITORING.md`: supervisión, logs y auditoría;
- `VALIDATION.md`: validación técnica y funcional;
- `RELEASES.md`: versiones y releases.
