# Trasfondo y tramas

## Capas narrativas y zoom

La vista automática utiliza una burbuja compacta por cada capa del nivel visible
y por cada nota suelta: no hay un número fijo. Sus dimensiones no dependen de
los contenedores o posiciones guardados. Los títulos se reparten en líneas y
el resumen se muestra cuando hay espacio. El contenido se distribuye dentro de
la burbuja al acercar el zoom, sin cambiar su geometría exterior.

Doble clic o Ir a capa centra una rama; las migas permiten volver a un contexto
superior y Encajar recupera el conjunto. Las relaciones con ramas fuera de la
vista centrada se consultan al volver al conjunto, no se inventan destinos.
En mapas grandes Encajar conserva una escala mínima legible: puede ser necesario
arrastrar para recorrerlo. Los hitos siguen disponibles en el inspector.

Arrastrar en modo automático desplaza la cámara, no las posiciones persistidas.
Desactiva Detalle automático con zoom para recuperar la distribución manual,
ordenar notas o capas y guardar esos movimientos. Alternar vistas, acercar,
alejar o entrar en una rama nunca marca cambios pendientes ni escribe datos.

La pizarra permite anidar capas: una misión puede contener agendas ocultas y,
a su vez, formar parte de una lucha política mayor. Selecciona una capa para
crear una capa interna o un contexto superior, escribir su resumen y cambiar
su capa superior. No se admiten ciclos de contención.

El zoom despliega el contenido progresivamente según el espacio disponible.
Al alejarse, las conexiones ocultas se representan entre sus capas visibles;
al acercarse vuelven a sus extremos originales. No se inventan conexiones ni
se confunde pertenencia con causalidad. Las relaciones agrupadas conservan sus
significados originales, consultables al seleccionarlas.

Usa Ir a capa, las migas de navegación o Entrar en esta capa para recorrer el
mapa. Puedes ampliar la pizarra o desactivar Detalle automático con zoom para
ver todo. El zoom no guarda ni modifica la estructura. Mover una capa desplaza
todo su contenido; quitarla conserva sus notas y subcapas en el nivel superior
y retira solo las relaciones dirigidas a la propia capa eliminada.

Las capas también admiten referencias a recursos, historias y tarjetas.
Los hitos de una historia vinculada se consultan sin duplicarlos ni editarlos.
El filtro por historia incluye las referencias de las capas y sus descendientes.
Todo continúa siendo privado del narrador propietario activo.

## Actualización a capas

Esta ampliación no requiere una migración nueva: utiliza el JSON existente.
Las pizarras anteriores se adaptan en memoria al abrirlas, conservando datos
y posiciones; solo un guardado explícito escribe el formato 2. Respaldar la
base de datos y configuración antes de desplegar.

El servidor nuevo exige protocolo 2 para guardar ese formato e impide que un
cliente antiguo lo sustituya por formato 1. No revertir únicamente la API a una
versión anterior después de guardar capas: restaurar una copia coherente de
aplicación y datos si fuera necesario.

Se mantienen los límites de 200 notas, 60 capas, 400 relaciones, 20 referencias
por nota o capa y 80 kB UTF-8; la anidación no es ilimitada. Los tests específicos
backdrop-layers.test.mjs de API y web cubren compatibilidad, permisos, ciclos,
conexiones proyectadas y conservación de datos. Esta ampliación no altera guiones,
sesiones ni sus bloqueos.

Pizarra libre, privada y propia de cada crónica. Solo el narrador propietario con
participación activa puede leerla, editarla o consultar sus referencias. Los
jugadores y usuarios ajenos reciben 403 en el servidor. No se publica ni se
incorpora a las exportaciones compartidas existentes.

## Uso

En la crónica, abre **Trasfondo y tramas**. Añade notas y agrupaciones, muévelas,
conecta notas o capas indicando el significado de la relación y guarda la pizarra.
Las conexiones por decidir pueden marcarse discontinuas. Seleccionar una nota
atenúa las relaciones ajenas; pulsar el fondo recupera el conjunto.

Cada nota conserva texto libre, estado (confirmado, en desarrollo o posibilidad),
momento (pasado, en marcha o posible futuro), quién lo sabe en la ficción y
referencias a historias, tarjetas de guion y recursos propios. El conocimiento
ficticio no modifica permisos. Vincular no copia ni altera las fichas.

Asignar una nota a una capa permite moverlas juntas. Quitar una capa conserva
las notas y subcapas en el nivel superior. Quitar una nota retira únicamente sus conexiones. Esas operaciones
modifican el borrador: antes de guardar puedes recargar para recuperar la versión
previa. Tras guardar no hay historial de deshacer en esta primera versión.

El filtro por historia muestra las notas que tengan referencias explícitas a
esa historia o sus tarjetas; no inventa vínculos. La pizarra conserva las
posiciones elegidas por el narrador, sin reorganización automática.
Desde el guion puedes abrir Ver trasfondo relacionado. Cambiar entre apartados
de esa crónica mantiene la pizarra montada y conserva el borrador. Volver al
listado avisa si hay cambios; recargar o cerrar el navegador también avisa.
Antes de navegar a otra zona de la aplicación, guarda o descarga el borrador.

## Guardado y límites

Guardado explícito con revisión optimista. Una pestaña con revisión antigua
recibe 409 y conserva el borrador; no sobrescribe la versión nueva. Puedes
descargar un borrador JSON privado antes de recargar. Esa descarga no se importa
automáticamente ni genera un documento para jugadores.

Máximo 200 notas, 60 capas, 400 relaciones, 20 referencias por nota o capa y 80 kB de
contenido JSON UTF-8. Preferir vínculos sobre duplicar descripciones extensas.
No se usan servicios de IA ni se almacenan secretos en localStorage. La tabla
nueva no altera sesiones, guiones, mapas o recursos.

## Despliegue .84

La instalación inicial de la pizarra requiere la migración aditiva
20261014190000_add_chronicle_backdrop. Si ya está instalada, esta ampliación
no ejecuta migraciones. Respaldar base de datos y configuración antes de actualizar.
Reconstruir API y web, ejecutar sus compilaciones y los tests específicos antes
de recrear servicios. El paquete no contiene datos narrativos ni credenciales.

## Pruebas

- API: chronicle-backdrop.test.mjs (autenticación, propietario/rol activo, revisión
  conflictiva, validación de referencias y esquema).
- Web: chronicle-backdrop.test.mjs (movimientos, borrado, identificadores HTTP,
  referencias inequívocas y aislamiento de la interfaz).
- Verificar en .84 con narrador, jugador y usuario ajeno; probar recarga, notas,
  grupos, relaciones, persistencia y conflicto entre dos pestañas.
