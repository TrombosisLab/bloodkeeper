# Índice operativo de SPEC

## Uso

Este índice diferencia la aprobación documental original del estado real
del proyecto. La fuente normativa de cada requisito es el archivo enlazado;
la columna **Estado operativo** refleja únicamente decisiones y auditorías
confirmadas.

## Situación actual

- SPEC-010: cerrada.
- SPEC-011: cerrada de forma incremental.
- SPEC-012: activa.
- SPEC-013 y SPEC-014: no iniciadas.
- SPEC-016: cerrada incluyendo la ampliación 016-C de autorregistro limitado de jugadores; el stash histórico de SPEC-016.A se preserva y no debe restaurarse automáticamente.

## Catálogo

| Código | Documento | Versión | Estado original | Estado operativo | Nota |
|---|---|---:|---|---|---|
| SPEC-001 | [SPEC-001 -- PROJECT_BOOTSTRAP.md](SPEC-001_PROJECT_BOOTSTRAP_v1.0.md) | 1.0 | Aprobado | No clasificada operativamente | Pendiente de auditoría contra código y tests. |
| SPEC-002 | [SPEC-002 -- SERVER_INFRASTRUCTURE](SPEC-002_SERVER_INFRASTRUCTURE_v1.0.md) | 1.0 | Aprobado | No clasificada operativamente | Pendiente de auditoría contra código y tests. |
| SPEC-003 | [SPEC-003 -- DOCKER_ARCHITECTURE](SPEC-003_DOCKER_ARCHITECTURE_v1.0.md) | 1.0 | Aprobado | No clasificada operativamente | Pendiente de auditoría contra código y tests. |
| SPEC-004 | [SPEC-004 -- PROJECT_STRUCTURE](SPEC-004_PROJECT_STRUCTURE_v1.0.md) | 1.0 | Aprobado | No clasificada operativamente | Pendiente de auditoría contra código y tests. |
| SPEC-005 | [SPEC-005 -- DEVELOPMENT_WORKFLOW](SPEC-005_DEVELOPMENT_WORKFLOW_v1.0.md) | 1.0 | Aprobado | No clasificada operativamente | Pendiente de auditoría contra código y tests. |
| SPEC-006 | [SPEC-006 -- DEPLOYMENT](SPEC-006_DEPLOYMENT_v1.0.md) | 1.0 | Aprobado | No clasificada operativamente | Pendiente de auditoría contra código y tests. |
| SPEC-007 | [SPEC-007 -- BACKUP_AND_RECOVERY](SPEC-007_BACKUP_AND_RECOVERY_v1.0.md) | 1.0 | Aprobado | No clasificada operativamente | Pendiente de auditoría contra código y tests. |
| SPEC-008 | [SPEC-008 – SYSTEM_MONITORING](SPEC-008_SYSTEM_MONITORING_v1.0.md) | 1.0 | Aprobado | No clasificada operativamente | Pendiente de auditoría contra código y tests. |
| SPEC-009 | [SPEC-009 – MAINTENANCE_OPERATIONS](SPEC-009_MAINTENANCE_OPERATIONS_v1.0.md) | 1.0 | Aprobado | No clasificada operativamente | Pendiente de auditoría contra código y tests. |
| SPEC-010 | [SPEC-010 -- UI_DESIGN_SYSTEM](SPEC-010_UI_DESIGN_SYSTEM_v1.0.md) | 1.0 | Aprobado | Cerrada | Cerrada y validada antes de la importación del pack. |
| SPEC-011 | [SPEC-011 -- NAVIGATION](SPEC-011_NAVIGATION_v1.0.md) | 1.0 | Aprobado | Cerrada incrementalmente | Personajes y Crónicas implementados; otras áreas aplazadas hasta disponer de consumidores reales. |
| SPEC-012 | [SPEC-012 – MAIN_LAYOUT](SPEC-012_MAIN_LAYOUT_v1.0.md) | 1.0 | Aprobado | Cerrada | Layout principal reutilizable, navegación coherente, responsive y estados uniformes validados sin duplicación estructural entre módulos. |
| SPEC-013 | [SPEC-013 – DASHBOARD](SPEC-013_DASHBOARD_v1.0.md) | 1.0 | Aprobado | Cerrada | Dashboard inicial real con contenido según permisos, accesos principales, estados claros, resúmenes acotados y diseño responsive sin información redundante. |
| SPEC-014 | [SPEC-014 – COMPONENT_LIBRARY](SPEC-014_COMPONENT_LIBRARY_v1.0.md) | 1.0 | Aprobado | Cerrada | Biblioteca modular consolidada con componentes reutilizables solo donde aportan valor, APIs pequenas, comportamiento consistente, accesibilidad y responsive validados sin abstracciones genericas anticipadas. |
| SPEC-015 | [SPEC-015 – AUTHENTICATION](SPEC-015_AUTHENTICATION_v1.0.md) | 1.0 | Aprobado | Cerrada | Autenticación completada y validada. |
| SPEC-016 | [SPEC-016 – USERS](SPEC-016_USERS_v1.0.md) | 1.1 | Aprobado | Cerrada | Gestión de usuarios y autorregistro player completados y validados; stash histórico preservado. |
| SPEC-017 | [SPEC-017 – ROLES](SPEC-017_ROLES_v1.0.md) | 1.0 | Aprobado | Cerrada | Roles globales y responsabilidades validados contra consumidores reales. |
| SPEC-018 | [SPEC-018 – PERMISSIONS](SPEC-018_PERMISSIONS_v1.0.md) | 1.0 | Aprobado | Cerrada | Permisos backend y autorización contextual validados incrementalmente. |
| SPEC-019 | [SPEC-019 – CHARACTER_MODULE](SPEC-019_CHARACTER_MODULE_v1.0.md) | 1.0 | Aprobado | Cerrada | Arquitectura modular, persistencia, ficha, creación y listado de personajes validados funcionalmente. |
| SPEC-020 | [SPEC-020 – CHARACTER_SHEET](SPEC-020_CHARACTER_SHEET_v1.0.md) | 1.0 | Aprobado | Cerrada | Ficha V5, estados, responsive y modos de visualización validados; el nombre persistido de Crónica queda diferido a SPEC-031. |
| SPEC-021 | [SPEC-021 – CHARACTER_CREATION](SPEC-021_CHARACTER_CREATION_v1.0.md) | 1.0 | Aprobado | Cerrada | Creación guiada, validación centralizada, revisión/finalización e invalidación segura de decisiones dependientes validadas funcionalmente. |
| SPEC-022 | [SPEC-022 – CHARACTER_DATA_MODEL](SPEC-022_CHARACTER_DATA_MODEL_v1.0.md) | 1.0 | Aprobado | Cerrada | Modelo modular de personaje, persistencia versionada e integridad referencial con usuario y crónica validadas. |
| SPEC-023 | [SPEC-023 – CHARACTER_ATTRIBUTES_AND_SKILLS](SPEC-023_CHARACTER_ATTRIBUTES_AND_SKILLS_v1.0.md) | 1.0 | Aprobado | Cerrada | Atributos, Habilidades, especialidades, reparto aleatorio, catálogo compartido y lectura preparada para dados validados. |
| SPEC-024 | [SPEC-024 – CHARACTER_HEALTH_WILLPOWER_HUMANITY](SPEC-024_CHARACTER_HEALTH_WILLPOWER_HUMANITY_v1.0.md) | 1.0 | Aprobado | Cerrada | Salud, Fuerza de Voluntad, daño, Humanidad y Manchas con reglas centralizadas, persistencia segura y edición operativa validadas. |
| SPEC-025 | [SPEC-025 – CHARACTER_DISCIPLINES_AND_POWERS](SPEC-025_CHARACTER_DISCIPLINES_AND_POWERS_v1.0.md) | 1.0 | Aprobado | Cerrada | Disciplinas, Poderes, afinidades de Clan, validación central, persistencia, ficha y lectura para dados validadas. |
| SPEC-026 | [SPEC-026 – CHARACTER_ADVANTAGES_BACKGROUNDS_FLAWS](SPEC-026_CHARACTER_ADVANTAGES_BACKGROUNDS_FLAWS_v1.1.md) | 1.1 | Aprobado | Cerrada | Ventajas, Trasfondos, Méritos, Defectos, relaciones entre selecciones, Loresheets, validación centralizada y lectura histórica validadas. |
| SPEC-027 | [SPEC-027 – CHARACTER_HUNGER_AND_STATES](SPEC-027_CHARACTER_HUNGER_AND_STATES_v1.0.md) | 1.0 | Aprobado | Cerrada | Hambre, estados dinámicos, persistencia, concurrencia, permisos e integración de lectura con dados validados. |
| SPEC-028 | [SPEC-028 – CHARACTER_INVENTORY_NOTES_AND_HISTORY](SPEC-028_CHARACTER_INVENTORY_NOTES_AND_HISTORY_v1.0.md) | 1.0 | Aprobado | Cerrada | Inventario, Notas e Historial con CRUD, persistencia, permisos, concurrencia, ordenación simple, archivado y eliminación validados. |
| SPEC-029 | [SPEC-029 – CHARACTER_VALIDATION_AND_LIFECYCLE](SPEC-029_CHARACTER_VALIDATION_AND_LIFECYCLE_v1.0.md) | 1.0 | Aprobado | Cerrada | Validación global contextual, estados Borrador/Activo/Archivado, activación validada, archivado seguro, reactivación, dependencias, permisos y concurrencia validados. |
| SPEC-030 | [SPEC-030 – CHRONICLE_MODULE](SPEC-030_CHRONICLE_MODULE_v1.0.md) | 1.0 | Aprobado | Cerrada | Módulo base de Crónicas con entidad, creación/listado, lifecycle, archivado seguro, permisos y panel individual de Resumen validados. |
| SPEC-031 | [SPEC-031 – CHRONICLE_PARTICIPANTS_AND_CHARACTERS](SPEC-031_CHRONICLE_PARTICIPANTS_AND_CHARACTERS_v1.0.md) | 1.0 | Aprobado | Cerrada | Participación contextual, múltiples narradores, asociación de personajes, permisos y preservación histórica validados. |
| SPEC-032 | [SPEC-032 – CHRONICLE_NPCS](SPEC-032_CHRONICLE_NPCS_v1.0.md) | 1.0 | Aprobado | Cerrada | Pendiente de auditoría contra código y tests. |
| SPEC-033 | [SPEC-033 – CHRONICLE_LOCATIONS](SPEC-033_CHRONICLE_LOCATIONS_v1.0.md) | 1.0 | Aprobado | Cerrada | Pendiente de auditoría contra código y tests. |
| SPEC-034 | [SPEC-034 – CHRONICLE_EVENTS_AND_TIMELINE](SPEC-034_CHRONICLE_EVENTS_AND_TIMELINE_v1.0.md) | 1.0 | Aprobado | No clasificada operativamente | Pendiente de auditoría contra código y tests. |
| SPEC-035 | [SPEC-035 – CHRONICLE_SESSIONS](SPEC-035_CHRONICLE_SESSIONS_v1.0.md) | 1.0 | Aprobado | No clasificada operativamente | Pendiente de auditoría contra código y tests. |
| SPEC-036 | [SPEC-036 – DICE_MODULE](SPEC-036_DICE_MODULE_v1.0.md) | 1.0 | Aprobado | No clasificada operativamente | Pendiente de auditoría contra código y tests. |
| SPEC-037 | [SPEC-037 – DICE_POOLS_AND_ROLLS](SPEC-037_DICE_POOLS_AND_ROLLS_v1.0.md) | 1.0 | Aprobado | No clasificada operativamente | Pendiente de auditoría contra código y tests. |
| SPEC-038 | [SPEC-038 – DICE_HUNGER_AND_SPECIAL_RESULTS](SPEC-038_DICE_HUNGER_AND_SPECIAL_RESULTS_v1.0.md) | 1.0 | Aprobado | No clasificada operativamente | Pendiente de auditoría contra código y tests. |
| SPEC-039 | [SPEC-039 – DICE_HISTORY_AND_CONTEXT](SPEC-039_DICE_HISTORY_AND_CONTEXT_v1.0.md) | 1.0 | Aprobado | No clasificada operativamente | Pendiente de auditoría contra código y tests. |
| SPEC-040 | [SPEC-040 – ADMINISTRATION_MODULE](SPEC-040_ADMINISTRATION_MODULE_v1.0.md) | 1.0 | Aprobado | No clasificada operativamente | Pendiente de auditoría contra código y tests. |
| SPEC-041 | [SPEC-041 – ADMIN_SYSTEM_OPERATIONS](SPEC-041_ADMIN_SYSTEM_OPERATIONS_v1.0.md) | 1.0 | Aprobado | Cerrada | Diagnóstico administrativo, estado técnico por SSH, logs y recursos, versión, permisos y confirmación de parada/reinicio validados sin terminal web arbitraria. |
| SPEC-042 | [SPEC-042 – ADMIN_BACKUP_RECOVERY](SPEC-042_ADMIN_BACKUP_RECOVERY_v1.0.md) | 1.0 | Aprobado | Cerrada | Estado de copias visible, creación automática/manual controlada y restauración segura por SSH validados con recuperación independiente de la Web. |
| SPEC-043 | [SPEC-043 – ADMIN_LOGS_AUDIT](SPEC-043_ADMIN_LOGS_AUDIT_v1.0.md) | 1.0 | Aprobado | Cerrada | Logs técnicos rotables y trazabilidad mínima de acciones sensibles validados, con secretos excluidos y consulta operativa segura por SSH. |
| SPEC-044 | [SPEC-044 – TESTING_AND_QUALITY](SPEC-044_TESTING_AND_QUALITY_v1.0.md) | 1.0 | Aprobado | Cerrada | Estrategia mínima de calidad validada: pruebas automatizadas útiles, regresiones explícitas, reglas V5 críticas cubiertas y validación reproducible. |
| SPEC-045 | [SPEC-045 – CI_VALIDATION_AND_RELEASES](SPEC-045_CI_VALIDATION_AND_RELEASES_v1.0.md) | 1.0 | Aprobado | Cerrada | Validación automática, builds reproducibles, versionado estable y migraciones controladas verificados. |
| SPEC-046 | [SPEC-046 – DEPLOYMENT_UPDATE_ROLLBACK](SPEC-046_DEPLOYMENT_UPDATE_ROLLBACK_v1.0.md) | 1.0 | Aprobado | Cerrada | Despliegue reproducible, actualización por SSH, protección de datos, verificación posterior y rollback operativo verificados. |
| SPEC-047 | [SPEC-047 – DEVELOPMENT_EXECUTION_PROTOCOL](SPEC-047_DEVELOPMENT_EXECUTION_PROTOCOL_v1.0.md) | 1.0 | Aprobado | Cerrada | Protocolo de desarrollo ya materializado por el workflow vigente; incrementos pequeños, pruebas, SSH reproducible, modularidad, complejidad controlada y bloqueo ante base rota verificados. |
| SPEC-048 | [SPEC-048 – DOCUMENTATION_AND_MANUALS](SPEC-048_DOCUMENTATION_AND_MANUALS_v1.0.md) | 1.0 | Aprobado | Cerrada | Documentación viva validada; manuales de usuario y administrador creados sobre funcionalidad real, procedimientos reproducibles y alineación con código verificadas. |
| SPEC-049 | [SPEC-049 – CONFIGURATION_AND_ENVIRONMENTS](SPEC-049_CONFIGURATION_AND_ENVIRONMENTS_v1.0.md) | 1.0 | Aprobado | Cerrada | Configuración externa, secretos fuera de Git, fail-fast de variables obligatorias y portabilidad entre servidores validados y documentados. |
| SPEC-050 | [SPEC-050 – SECURITY_BASELINE](SPEC-050_SECURITY_BASELINE_v1.0.md) | 1.0 | Aprobado | Cerrada | Secretos fuera de Git, superficie de red mínima, permisos validados, dependencias controladas y riesgos básicos de seguridad acreditados. |
| SPEC-051 | [SPEC-051 – OBSERVABILITY_AND_HEALTHCHECKS](SPEC-051_OBSERVABILITY_AND_HEALTHCHECKS_v1.0.md) | 1.0 | Aprobado | Cerrada | Health checks de Web, API y PostgreSQL, diagnóstico reproducible y observabilidad ligera ya materializados y validados. |
| SPEC-052 | [SPEC-052 – DATA_MIGRATIONS_AND_INTEGRITY](SPEC-052_DATA_MIGRATIONS_AND_INTEGRITY_v1.0.md) | 1.0 | Aprobado | Cerrada | Migraciones Prisma versionadas y reproducibles, protección mediante backup previo, rollback conservador e integridad PostgreSQL validados. |
| SPEC-053 | [SPEC-053 – PERFORMANCE_AND_SCALABILITY](SPEC-053_PERFORMANCE_AND_SCALABILITY_v1.0.md) | 1.0 | Aprobado | Cerrada | Paginación acotada y determinista en listados públicos, casos especiales preservados y rendimiento local validado sin sobrearquitectura. |
| SPEC-054 | [SPEC-054 – ACCESSIBILITY_RESPONSIVE_AND_COMPATIBILITY](SPEC-054_ACCESSIBILITY_RESPONSIVE_AND_COMPATIBILITY_v1.0.md) | 1.0 | Aprobado | Cerrada | Accesibilidad por teclado, responsive móvil/tablet/escritorio, controles táctiles y compatibilidad moderna validados y documentados. |
| SPEC-055 | [SPEC-055 – PROJECT_COMPLETION_CRITERIA](SPEC-055_PROJECT_COMPLETION_CRITERIA_v1.0.md) | 1.0 | Aprobado | Cerrada | Definition of Done, integración modular E2E, release, health/smoke, backup/rollback y validación continua acreditados. |
| SPEC-056 | [SPEC-056 – CHARACTER_EXPERIENCE_AND_ADVANCEMENT](SPEC-056_CHARACTER_EXPERIENCE_AND_ADVANCEMENT_v1.0.md) | 1.0 | Aprobado | Cerrada | Experiencia y evolución completas: ledger trazable, concesiones y correcciones autorizadas, costes V5, compra atómica, validación `evolution` e integración Web verificadas. |
| SPEC-057 | [SPEC-057 – CHARACTER_SESSION_ZERO_AND_EMBRACE](SPEC-057_CHARACTER_SESSION_ZERO_AND_EMBRACE_v1.0.md) | 1.0 | Aprobado | Cerrada | Sesión 0 humana, Abrazo atómico, transición vampírica progresiva, ficha y dados adaptativos validados; migración compatible, regresión API/Web y cierre integral superados. |

| SPEC-058 | [SPEC-058 – CHARACTER_BLOOD_RESONANCE_AND_DYSCRASIA](SPEC-058_CHARACTER_BLOOD_RESONANCE_AND_DYSCRASIA_v1.0.md) | 1.0 | Aprobado | En desarrollo | Resonancias, temperamentos, afinidades especiales y Discrasias V5; implementación por bloques con integración segura en Sangre, Dados, Experiencia y ficha. |

## Versiones archivadas

- [SPEC-026 v1.0](archive/SPEC-026_CHARACTER_ADVANTAGES_BACKGROUNDS_FLAWS_v1.0.md): sustituida por v1.1.

## Regla de actualización

No debe cambiarse un estado operativo por inferencia. Toda modificación
requiere auditoría contra la SPEC, el código y los tests, o una decisión
expresa del usuario.
