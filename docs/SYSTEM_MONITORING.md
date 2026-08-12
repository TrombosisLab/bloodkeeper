# Supervisión del sistema

## Alcance

Este documento materializa SPEC-008 y define la supervisión mínima de
BloodKeeper sin incorporar plataformas externas ni procesos residentes
adicionales.

La operación se realiza mediante scripts `.sh` simples y Docker Compose.

## Estado consultable

`./scripts/status.sh` presenta en una única ejecución:

- Estado general de la aplicación.
- Estado de los contenedores.
- Estado de PostgreSQL.
- Uso de CPU.
- Uso de memoria.
- Espacio libre en disco.
- Estado de las copias de seguridad.
- Versión instalada de Git, API y web.
- Indicaciones para consultar logs relevantes.

El script termina con uno de estos resultados:

```text
ESTADO GENERAL: CORRECTO
ESTADO GENERAL: CORRECTO CON AVISOS
ESTADO GENERAL: ERROR
```

Los avisos no implican por sí solos que la aplicación esté caída. Los
errores provocan un código de salida distinto de cero.

## Comprobación general

```bash
./scripts/check.sh
```

Valida:

- Docker Compose;
- health de PostgreSQL, API y web;
- frontend;
- API y conexión con PostgreSQL;
- integración web → API.

Resultado esperado:

```text
TODAS LAS COMPROBACIONES CORRECTAS
```

## Logs relevantes

```bash
./scripts/logs.sh
./scripts/logs.sh api --lines 200
./scripts/logs.sh postgres --follow
```

Filtro orientativo:

```bash
./scripts/logs.sh all --lines 250 |
  grep -Ei 'error|fatal|panic|unhealthy|exception|failed|warning|warn'
```

Los errores generados deliberadamente por pruebas de restricciones deben
interpretarse junto con el resultado de las suites y los health checks.

## Servicios detenidos

`status.sh` y `check.sh` detectan contenedores ausentes, detenidos o no
saludables. `check.sh` falla inmediatamente cuando un servicio requerido
no está en estado `healthy`.

## Copias de seguridad

El estado incluye:

- tarea programada;
- última copia completa;
- fecha, tamaño y permisos;
- verificación SHA-256;
- aviso cuando la copia supera 48 horas.

La estrategia completa permanece definida en `docs/RECOVERY.md`.

## Versión instalada

La versión técnica se identifica mediante:

- rama Git;
- commit corto;
- fecha y descripción del commit;
- versiones declaradas por API y web;
- imágenes activas consultables mediante Docker.

## Presentación visual

La presentación dentro del panel de administración queda diferida hasta
que dicho panel exista, tal como permite SPEC-008.

No se incorporan Prometheus, Grafana, agentes, alertas remotas ni otra
infraestructura preventiva en este bloque.

## Rotación y retención de logs

SPEC-043 limita el crecimiento de los registros técnicos conservando el
driver Docker `json-file` ya utilizado por la plataforma.

Los servicios `api`, `web` y `postgres` usan la misma política:

- tamaño máximo por archivo: `10m`;
- máximo de archivos conservados por contenedor: `5`;
- límite aproximado: 50 MB por servicio antes de reutilizar los archivos
  más antiguos.

La consulta operativa continúa realizándose por SSH mediante
`scripts/logs.sh`; no se expone el socket Docker ni se crea una terminal
de administración en la Web.

Esta retención cubre los logs técnicos de contenedor. La auditoría funcional
mínima de acciones sensibles se trata por separado dentro de SPEC-043 y no
debe convertirse en un registro exhaustivo de cada petición o clic.

## Auditoría funcional mínima

SPEC-043 registra únicamente acciones sensibles con valor operativo. No se
registra cada petición, navegación o clic.

En la API, los eventos administrativos correctos se escriben en el log del
servicio con el prefijo `[AUDIT]` y estos campos cerrados:

- `action`;
- `actorId`;
- `targetId` cuando existe;
- `outcome=success`;
- `channel=http`.

Se cubren creación y cambios administrativos de cuentas, cambios de roles,
restablecimiento administrativo de credenciales y solicitudes manuales de
backup. Los `GET`, el registro normal de usuarios y las operaciones fallidas
no generan una entrada de éxito.

Las líneas de auditoría HTTP nunca incluyen contraseñas, hashes, cookies,
tokens, cabeceras, cuerpos completos, nombres de usuario, nombres visibles
ni listas de roles.

Consulta por SSH:

```bash
./scripts/logs.sh api --lines 500 |
  grep '\[AUDIT\]'
```

Las acciones sensibles ejecutadas en el host escriben además una línea
estructurada `AUDIT` en `journald` con la etiqueta `bloodkeeper-audit`.
Se registran inicio, éxito o fallo de:

- ejecución de backup manual;
- restauración aplicada;
- extracción de recuperación completa;
- parada controlada;
- reinicio controlado.

Consulta:

```bash
journalctl \
  -t bloodkeeper-audit \
  --since today \
  --no-pager
```

Las líneas estructuradas del host no incluyen rutas de backups, contenido de
archivos, credenciales ni parámetros libres. El journal utiliza la gestión y
rotación propia del sistema operativo; los logs de contenedor mantienen la
rotación `json-file` definida por SPEC-043.A.

No existe una tabla Prisma de auditoría, un interceptor global, una terminal
Web ni acceso de la API al socket Docker.
