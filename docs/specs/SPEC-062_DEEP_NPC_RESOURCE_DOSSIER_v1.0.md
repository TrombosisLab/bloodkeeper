# SPEC-062 — Dossier profundo de PNJ y recursos de Crónica

## Objetivo

Convertir Recursos en el espacio operativo profundo de una Crónica. Un PNJ deja de ser un registro simple y pasa a disponer de un dossier narrativo, editable y trazable, con la estructura visual de navegador + ficha central + contexto narrativo.

## Alcance funcional

### Espacio de Recursos

- Mantiene la cabecera de Recursos y pestañas de tipo.
- Bajo la cabecera usa tres columnas en escritorio: navegador de recursos, dossier del recurso seleccionado y contexto narrativo.
- Tipos de recurso: PNJ, Localizaciones, Documentos, Artefactos y Organizaciones.
- Cada tipo es un modelo y API propios; no se muestran categorías decorativas sin persistencia.
- En móvil las columnas se apilan manteniendo selección, edición y contexto.

### PNJ profundo

El PNJ conserva el nivel actual `simple` y se amplía con `deep`. La conversión es explícita y reversible solo mediante edición; nunca se pierden los campos simples existentes.

Campos del dossier profundo:

- Identidad: nombre, alias, nombre de clan, categoría/linaje, generación, condición y estado.
- Posición: clan, corte/secta, título, territorio, dominio, facción y concepto de rol.
- Influencia: influencia y recursos en escala 0–5, además de etiquetas de rasgos clave.
- Vínculos: personajes, PNJ, organizaciones, localizaciones, aliados y rivales.
- Narrativa: descripción pública, historia, notas privadas del Narrador y última actualización.
- Presencia: apariciones reales derivadas de sucesos, historias y sesiones vinculadas.
- Acciones: crear, editar, duplicar, archivar y eliminar solo si no tiene vínculos históricos.

### Nuevos recursos

- Documentos: título, tipo, procedencia, contenido/resumen, secreto del Narrador y vínculos.
- Artefactos: nombre, tipo, procedencia, propietario, descripción, secreto y vínculos.
- Organizaciones: nombre, tipo, objetivo, territorio, descripción, secreto y miembros/vínculos.
- Localizaciones conservan su jerarquía existente y reciben el mismo navegador, dossier y contexto.

## Persistencia y contratos

- Nueva migración Prisma para el perfil profundo de PNJ y para Documentos, Artefactos y Organizaciones de Crónica.
- Tablas de vínculo contextual con sucesos, historias y sesiones cuando no exista una relación canónica ya disponible.
- Los registros existentes se mantienen como PNJ `simple`; el dossier profundo rellena campos no informados con estado editorial claro, nunca con datos inventados.
- La API conserva los endpoints simples actuales y añade contratos de detalle/actualización profundos versionados dentro del módulo Chronicles.
- Todo acceso de escritura queda limitado al Narrador contextual; los jugadores solo reciben información compartida autorizada.

## Diseño

- Navegador izquierdo: contador, pestañas, búsqueda, creación, orden y tarjetas seleccionables.
- Centro: cabecera de dossier, estado, pestañas internas Resumen / Atributos / Disciplinas / Relaciones / Historial / Notas y bloques editables.
- Derecha: línea de apariciones, historias/sesiones vinculadas y nota privada.
- Se emplean únicamente tokens visuales existentes y la barra lateral global de BloodKeeper permanece visible.

## Criterios de aceptación

1. Un Narrador puede crear un PNJ simple y promoverlo a dossier profundo sin pérdida de datos.
2. Un dossier profundo persiste, recarga y actualiza cada bloque de información.
3. Apariciones y vínculos proceden de relaciones reales ya registradas.
4. PNJ, Localizaciones, Documentos, Artefactos y Organizaciones tienen operaciones reales y permisos coherentes.
5. La vista mantiene tres zonas de trabajo en escritorio y es usable en móvil.
6. Typecheck, pruebas API/web y preflight Docker pasan antes de cualquier commit.

## Entregas

1. Esquema y contratos de API.
2. Persistencia, permisos y pruebas de dominio.
3. Dossier profundo de PNJ.
4. Documentos, Artefactos y Organizaciones.
5. Integración contextual, preflight global y cierre operativo.
