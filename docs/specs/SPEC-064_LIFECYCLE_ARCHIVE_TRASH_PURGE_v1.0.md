# SPEC-064 — Archivo, papelera, restauración y borrado definitivo

Versión: 1.0
Estado: En implementación
Ámbito: API, persistencia, Web, seguridad, auditoría y operación Docker

## Objetivo

BloodKeeper distinguirá retirada, archivado, restauración y eliminación definitiva. Las operaciones destructivas serán administrativas, transaccionales, confirmadas por nombre exacto y condicionadas por un análisis de dependencias calculado en la API.

## Entidades

- Usuarios: desactivar, restaurar y purgar sólo sin propiedad o autoría protegida.
- Participantes: retirar y restaurar; sin purga independiente mientras exista la crónica.
- Crónicas: archivar desde preparación o activa; restaurar a preparación; purgar sólo archivadas y sin historia inmutable.
- Personajes: archivar, restaurar a borrador y purgar sólo sin experiencia, tiradas, asistencia u operaciones protegidas.
- Historias, sesiones, sucesos, PNJ, localizaciones y recursos: archivar, restaurar al estado seguro y purgar vínculos no históricos cuando no existan bloqueos.

## Centro de Archivo y Papelera

Administración incorporará un área con búsqueda, filtros, contadores, restauración, análisis de dependencias y eliminación definitiva. La interfaz usará el sistema visual común y será adaptable.

## Contrato HTTP

- GET /administration/lifecycle/trash
- GET /administration/lifecycle/trash/:kind/:id/dependencies
- PATCH /administration/lifecycle/trash/:kind/:id/restore
- DELETE /administration/lifecycle/trash/:kind/:id

La purga recibe confirmation y, cuando proceda, expectedUpdatedAt. Los conflictos devuelven códigos estables y blockers.

## Restauraciones seguras

- Usuario: ACTIVE
- Participante: ACTIVE
- Crónica: PREPARATION
- Personaje: DRAFT
- Historia: PLANNED
- Sesión: PREPARATION
- Suceso, PNJ y localización: ACTIVE
- Recurso: active

## Seguridad

- Sólo administradores consultan la papelera, restauran o purgan.
- No se elimina la última cuenta administrativa activa ni la propia cuenta de la sesión.
- La API calcula dependencias y ejecuta cada cambio en una transacción.
- La purga no afecta migraciones, configuración ni copias.
- Se generan eventos de auditoría administrativa sin exponer secretos.

## Validación

- Permisos y códigos de error.
- Restauración por tipo.
- Confirmación exacta y bloqueos de dependencia.
- Purga segura de datos sin historia inmutable.
- Pruebas API/Web, typecheck, build estricto y preflight global Docker.

La entrega no realiza commit ni push automáticamente.
