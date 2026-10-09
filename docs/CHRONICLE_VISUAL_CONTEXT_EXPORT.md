# Paquete visual de contexto

En Crónicas → Resumen, cada diálogo de exportación permite preparar un ZIP después de generar su vista previa. Las fuentes se consultan nuevamente al preparar el ZIP. No se envían datos a una IA.

Contenido: contexto.md, indice-de-material.md, fotos JPEG, mapas reconstruidos con marcas numeradas y zonas Z1/Z2, y sus leyendas. Si se activan las instrucciones para IA se añade instrucciones-para-pdf.md y el prompt del contexto. Sin esa opción no se añade ninguno de los dos prompts.

## Alcance y privacidad

El paquete compartido usa el contexto compartido. Incluso para el narrador excluye marcas y zonas privadas. Las marcas compartidas de solicitudes aprobadas se incluyen aunque su recurso de biblioteca no figure en el contexto del cuaderno. No se incluyen solicitudes pendientes ni se consultan las fichas o las fotos de los recursos vinculados solo para exportar una marca. La selección de mapas conserva el filtro de mapas activos y los vínculos del propio mapa. El paquete privado usa las fuentes autorizadas al narrador. Nunca consulta los mapas de relaciones privados ni las notas privadas de otros jugadores.

Una imagen base compartida puede contener secretos dibujados en sus propios píxeles: el filtro de marcas no puede eliminarlos. El usuario debe revisar el ZIP antes de compartirlo. Los archivos descargados dejan de estar protegidos por los permisos de BloodKeeper.

No se incluyen fichas completas ni documentos adjuntos. Los mapas de relaciones compartidos continúan descritos en contexto.md, no se representan como imágenes. Los mapas de zona sí incluyen imagen y leyenda cuando disponen de imagen base. Una imagen inexistente (404) se registra en el índice. Cualquier otro fallo de consulta, incluidas respuestas 403, cancela el paquete completo.

## Recursos y seguridad

Se genera en memoria del navegador, sin archivos temporales en el servidor ni nuevas rutas de escritura. Las consultas llevan la sesión actual. Las imágenes solo se obtienen de rutas de imágenes de la misma crónica; no se descargan direcciones externas ni se siguen redirecciones. Los JPEG generados no conservan los metadatos del archivo original.

Límites: 60 fotos/mapas, ZIP de 50 MiB, 120 segundos, imágenes originales de 5 MiB y 16 millones de píxeles, salida de hasta 4096 píxeles por lado, 1000 marcas/zonas por mapa. No se trunca silenciosamente. El formato ZIP estándar usa almacenamiento sin compresión adicional (las imágenes JPEG ya están comprimidas).

El prompt propone un PDF estructurado, pero no lo crea. La herramienta externa debe poder leer el ZIP y sus imágenes y generar PDF. Las instrucciones no sustituyen controles de acceso ni garantizan el comportamiento de una IA.

## Comprobación en la 84

Probar con narrador y jugador: paquete compartido sin marcas privadas; paquete privado identificado; fotos y leyendas correctas; cancelar; desactivar instrucciones; descargar y descomprimir. Comprobar que un usuario ajeno a la crónica no accede a las fuentes. No publicar ZIP ni Markdown exportados en Git.
