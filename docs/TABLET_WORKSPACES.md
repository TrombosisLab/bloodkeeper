# Adaptación de tablet

La capa `apps/web/src/styles/tablet-workspaces.css` se aplica entre 721 y 1180 px de ancho, en ambas orientaciones. Fuera de ese rango no añade reglas. No modifica permisos, estados de sesiones, datos, coordenadas, rutas ni gestos de los lienzos.

- La cuenta queda en el flujo normal, sin tapar botones ni contenido.
- La barra lateral ocupa menos ancho y las acciones de cabecera pueden envolver.
- Sesiones, Cronología y Guion apilan sus paneles para evitar columnas centrales ilegibles.
- Jugar muestra dos tarjetas por fila con portada encima del texto.
- Recursos conserva el árbol anidado con desplazamiento propio; ficha, categorías y paginación tienen anchos acotados. Las fotografías se muestran completas.
- La ficha limita la altura del retrato, distribuye identidad en dos columnas y da todo el ancho al contenido inferior.
- Mapa coloca el navegador sobre el lienzo; no altera marcas ni zonas.
- Investigación amplía controles y reorganiza cabeceras.
- Trasfondo coloca el inspector debajo del lienzo y permite recorrer las rutas de navegación horizontalmente, sin cambiar los límites de zoom.

## Verificación

Pruebas: `node --test tests/tablet-workspaces.test.mjs` desde `apps/web`, más las pruebas existentes de móvil y recursos. Compilación: `npm run build`.

Las pruebas de código comprueban aislamiento del rango, presencia de los cambios y ausencia de modificaciones de geometría; no sustituyen una prueba visual del resultado desplegado.

Después de instalar en .84, revisar a 768×1024, 820×1180 y 1024×768; comprobar también móvil (390×844) y escritorio (1440×900). Recorrer todas las secciones, abrir y cerrar el menú, cambiar categorías, seleccionar recursos, comprobar la paginación y abrir diálogos. Verificar fichas tanto en consulta como en edición sin guardar cambios. En los lienzos comprobar rueda, desplazamiento e inspector. La prueba física con teclado virtual y Safari queda separada de la emulación del navegador.

No desplegar en .118 ni publicar en Git hasta validar visualmente .84.
