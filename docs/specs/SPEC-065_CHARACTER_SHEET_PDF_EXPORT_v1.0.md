# SPEC-065 - Persistencia y exportación PDF de personajes

## Estado

Versión 1.0. Implementación operativa pendiente de cierre.

## Objetivo

Permitir que el propietario descargue la última versión canónica guardada de su personaje usando como plantilla exacta `Básica V5 ByN Editable.pdf`, sin instalar software en el host y sin reconstruir visualmente la ficha.

## Alcance

- La generación se ejecuta en la API dentro de Docker.
- La plantilla se distribuye con la aplicación en `apps/api/assets/character-sheet/`.
- El propietario autenticado puede descargar únicamente sus personajes.
- Se ofrecen dos formatos:
  - `editable`: conserva los campos AcroForm.
  - `print`: actualiza apariencias y aplana los campos.
- La exportación usa datos persistidos; no guarda borradores locales del navegador.
- Nombre, concepto, ambición, deseo, clan, generación, sire y depredador.
- Atributos, habilidades, especialidades, disciplinas y poderes.
- Méritos, defectos y trasfondos, incluyendo su puntuación y detalle principal.
- Salud dañada, voluntad dañada, humanidad, hambre y potencia de sangre.
- Convicciones, piedras de toque, rituales, experiencia total y gastada.
- Inventario, notas e historia secundaria persistida.

## Contrato HTTP

`GET /api/characters/:characterId/sheet.pdf?format=editable|print`

- `200 application/pdf`: descarga correcta.
- `400 INVALID_CHARACTER_SHEET_PDF_FORMAT`: formato no soportado.
- `401 AUTHENTICATION_REQUIRED`: sesión ausente.
- `404 CHARACTER_DRAFT_NOT_FOUND`: personaje inexistente o ajeno.

## Reglas de seguridad

- La propiedad se verifica antes de leer datos secundarios o experiencia.
- El nombre de descarga se normaliza y no admite rutas.
- No se persisten copias temporales del PDF en el servidor.
- El PDF se genera en memoria.
- La plantilla forma parte de la imagen Docker y no depende del host.

## Limitaciones explícitas de la plantilla

- Los campos sin equivalente canónico permanecen vacíos.
- Los daños superficial y agravado se representan como casillas dañadas porque la plantilla no expone estados AcroForm diferenciados.
- Las imágenes, mapa de relaciones y boceto no se inventan.

## Criterios de aceptación

1. El botón de descarga solo aparece en fichas persistidas.
2. La exportación editable conserva campos interactivos.
3. La exportación para imprimir no conserva campos AcroForm.
4. Identidad, puntuaciones principales y experiencia coinciden con la API.
5. Un usuario no puede exportar un personaje ajeno.
6. API y web superan typecheck, pruebas y build dentro de Docker.
