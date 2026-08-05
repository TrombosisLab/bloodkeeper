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
