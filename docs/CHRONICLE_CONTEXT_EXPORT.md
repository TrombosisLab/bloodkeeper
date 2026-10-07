# Exportar el contexto compartido de una crónica

Abre Crónicas → selecciona una crónica → Resumen → Exportar contexto, en la
cabecera de Visión general. Una ventana flotante carga las fuentes, muestra la
vista previa y permite Descargar .md. Incluye instrucciones para IA al final;
puedes desmarcarlas para una descarga destinada exclusivamente a una persona.
Las instrucciones están plegadas en la ventana, no ocultas dentro del archivo.

La prueba reúne sesiones completadas por fecha real de juego; separa las que no
tienen fecha y las archivadas (archivar no confirma que se hayan jugado). No
confunde actualizaciones de notas con fechas de acontecimientos. Los hitos se
presentan por historia con su fecha de registro: vincular una historia a una
sesión no prueba que un hito se lograse allí.

Incluye resúmenes compartidos de historias, estados públicos de hitos, notas
CHRONICLE de la libreta/Sala, nombres de personajes vinculados, tarjetas básicas
de PNJ y lugares que ofrece el contexto de la Sala, conexiones oficiales cuyos
extremos estén incluidos, resúmenes de recursos compartidos con toda la crónica,
y mapas compartidos de miembros disponibles. También lee las notas públicas de
sesión directamente, incluidas las antiguas; elimina sus copias automáticas de
la libreta para no duplicarlas. Solo se utilizan sharedNotes, nunca las notas
privadas de la respuesta. Cada consulta aplica los permisos de su API existente.

No consulta guiones ni mapas privados, conexiones personales, fichas completas,
imágenes ni documentos adjuntos. No exporta notas PRIVATE o SELECTED_PLAYERS,
notas de narrador, campos privados de tarjetas ni recursos narrator_only o
selected_players. También para un narrador se exporta SOLO esta versión
compartida. Esta prueba no ofrece todavía exportación de preparación privada.

Los permisos se comprueban en cada una de las API existentes del servidor, con
la sesión autenticada. El exportador selecciona campos concretos, no serializa
las respuestas completas. Una denegación o fallo de una fuente impide descargar
un contexto parcialmente cargado. Las teorías se atribuyen a sus autores; los
mapas son estado actual, no un historial reconstruido.

El navegador crea el texto y la descarga en memoria. No hay carpeta temporal,
archivo persistente ni caché de exportaciones en el servidor; tampoco envío a
un proveedor de IA. Cerrar la ventana cancela las lecturas y elimina la vista
previa del estado de la interfaz. El enlace Blob se libera tras la descarga.
El archivo guardado en tu equipo sí persiste y queda fuera de los permisos de
BloodKeeper: revisar antes de adjuntarlo a una IA o compartirlo con otras personas.

Límites iniciales: 200 sesiones, 200 historias compartidas, 40 mapas y 8 MiB de
respuestas leídas por exportación. El Markdown final tiene un máximo de 2 MiB,
incluidas las instrucciones opcionales. Se cancela a los 60 segundos. Superar
un límite produce un error visible, nunca truncado silencioso. Hay una operación
activa por ventana. Las API actuales siguen conservando sus propios límites y
consultas: esta funcionalidad no sustituye los límites globales del servidor.

Pruebas:

```bash
node --experimental-strip-types --test tests/chronicle-context-export.test.mjs
```

Cubren cronología, archivo de sesiones, notas sin asociación, selección de campos,
ausencia de secretos, conexiones filtradas, mapas por autor, texto HTML/Markdown
inerte, paginación, denegación, cancelación y límites de lectura/documento.
La vista previa es texto: no ejecuta HTML ni hace peticiones a enlaces del contenido.
