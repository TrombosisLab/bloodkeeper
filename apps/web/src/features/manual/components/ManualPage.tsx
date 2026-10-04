import { useState } from 'react'

import './manual-page.css'

type ManualRole = 'admin' | 'narrator' | 'player'

interface ManualSection {
  readonly title: string
  readonly paragraphs?: readonly string[]
  readonly bullets?: readonly string[]
  readonly commands?: readonly string[]
}

interface ManualRoleDefinition {
  readonly label: string
  readonly badge: string
  readonly introduction: string
  readonly sections: readonly ManualSection[]
  readonly quickStartTitle: string
  readonly quickStart: string
}

const relationshipManual: ManualSection = {
  title: 'Relaciones: mapa privado y mapas compartidos',
  paragraphs: ['Sala de Investigación → Relaciones ofrece dos mapas por persona y por crónica, tanto para jugadores como para el Narrador. Mi mapa privado solo puede verlo y editarlo su propietario; ni dirigir la mesa ni tener rol de administrador permite consultar el mapa privado de otra persona.', 'Mapas compartidos reúne los mapas visibles para la coterie en un selector. Mi mapa compartido es editable; los de los demás son de solo lectura. Compartido no significa accesible fuera de la crónica: hace falta ser el Narrador de esa mesa o mantener participación activa.'],
  bullets: ['Añade tarjetas con un nombre libre o vincúlalas a un PJ o PNJ disponible. Ver el nombre no concede acceso a la ficha: Abrir ficha vinculada comprueba los permisos habituales.', 'En el privado, guarda primero y pulsa Mostrar en mi mapa compartido en la tarjeta. Solo se publican el nombre y el vínculo a la ficha: no se copian descripción, nota privada, relaciones, posiciones ni páginas. Una vez publicada, puedes escribir una descripción y relaciones distintas en el compartido; las ediciones posteriores de ambos mapas son independientes.', 'Retirar de mi mapa compartido quita esa tarjeta de todas las páginas compartidas y elimina sus relaciones compartidas, sin cambiar el privado. Eliminar la tarjeta privada también retira su publicación cuando guardas. Revisa los avisos antes de confirmar.', 'Crea relaciones de familia, sire/chiquillo, mentor/protegido, amistad, alianza, amor, rivalidad, enemistad, autoridad, deuda/favor, vínculo de sangre, manipulación o sospecha. Son categorías de organización del mapa, no efectos automáticos de las reglas de V5.', 'El tipo determina el color de la línea. Personalizada permite escribir otro nombre y escoger su color. Puedes detallar cualquier relación, añadir varias entre dos personas y elegir una flecha, ambas direcciones o ninguna.', 'Abre una tarjeta para consultar y editar sus relaciones entrantes y salientes. Una relación con una sola flecha va desde la primera persona hacia la segunda; no implica reciprocidad.', 'Nueva página desde una tarjeta conserva la misma tarjeta en la original y la coloca al inicio de la nueva. Nombre, descripción y nota son comunes dentro de ese mapa; la posición es independiente. Las continuaciones y páginas nunca se trasladan entre el privado y el compartido.', 'Usa los enlaces de continuación para volver o avanzar, el zoom para leer y el desplazamiento del lienzo para recorrerlo. Quitar solo de esta página retira una aparición; Eliminar tarjeta de todas las páginas también elimina sus relaciones.', 'Guarda mapa conserva tarjetas, relaciones y páginas. Publicar o retirar una tarjeta guardada se aplica directamente al servidor. Si aparece un conflicto por otra sesión tuya, tu borrador se conserva: no se sobrescribe automáticamente.', 'Cada mapa admite 30 páginas, 120 tarjetas y 240 relaciones. Solo se pueden eliminar páginas vacías.'],
}
const manualRoles: Record<ManualRole, ManualRoleDefinition> = {
  admin: {
    label: 'Administrador',
    badge: 'Rol global · admin',
    introduction: 'Se ocupa de la instalación, la salud técnica y las cuentas globales. El rol de administrador no sustituye el papel de narrador dentro de una crónica.',
    sections: [
      {
        title: 'Primer arranque e instalación',
        paragraphs: ['La instalación se hace desde una máquina anfitriona con Docker y acceso SSH. Clona el repositorio, entra en su carpeta y ejecuta el instalador.'],
        commands: ['git clone https://github.com/TrombosisLab/bloodkeeper.git', 'cd bloodkeeper', 'chmod +x install.sh && sudo ./install.sh'],
        bullets: ['El instalador prepara el entorno y crea los servicios.', 'Si el sistema recién clonado no permite ejecutar el archivo, usa chmod antes de lanzarlo.', 'No subas al repositorio .env, contraseñas, claves SSH ni credenciales de Cloudflare.'],
      },
      {
        title: 'Panel general del administrador',
        paragraphs: ['Todas las tareas del host se concentran en un menú interactivo. Se invoca por SSH desde la carpeta del proyecto.'],
        commands: ['sudo bash scripts/admin-menu.sh'],
        bullets: ['Estado de servicios, comprobaciones y logs.', 'Copias inmediatas, programación y copia de los archivos del volumen Docker a la máquina anfitriona.', 'Verificación y restauración de copias lógicas o completas.', 'Configuración del túnel temporal o permanente de Cloudflare.', 'Inicio, parada, reinicio, actualización y rollback.', 'Limpieza completa de la base de datos, con copia previa y doble confirmación.'],
      },
      {
        title: 'Administración de usuarios',
        paragraphs: ['En Administración puedes buscar usuarios, consultar su estado, crear cuentas y gestionar roles globales.'],
        bullets: ['Los roles globales son admin, narrator y player.', 'Un usuario conserva al menos un rol global válido.', 'Puedes activar, suspender o reactivar cuentas y restablecer credenciales.', 'El registro público, si está habilitado, crea usuarios jugador; no concede privilegios de administración.', 'La API vuelve a comprobar permisos: ocultar un botón no es la única barrera de seguridad.'],
      },
      {
        title: 'Copias de seguridad y recuperación',
        paragraphs: ['La aplicación muestra estado sanitizado y, si está habilitado el servicio correspondiente, permite solicitar una copia manual desde la web. Los archivos reales viven en volúmenes de Docker o en la ruta de la máquina anfitriona que hayas configurado.'],
        commands: ['./scripts/backup.sh', './scripts/backup-full.sh', './scripts/install-backup-schedule.sh --status', './scripts/restore.sh --verify backups/ARCHIVO.dump', './scripts/restore.sh --apply backups/ARCHIVO.dump --confirm', './scripts/restore-full.sh --verify /ruta/bloodkeeper_full_FECHA.tar.gz'],
        bullets: ['Conserva una copia fuera del servidor.', 'Verifica siempre antes de restaurar.', 'El menú general permite copiar los archivos del volumen Docker a una ruta persistente del host.'],
      },
      {
        title: 'Estado, logs y ciclo de vida',
        commands: ['./scripts/status.sh', './scripts/check.sh', './scripts/logs.sh', './scripts/start.sh', './scripts/stop.sh --confirm', './scripts/restart.sh --confirm'],
        bullets: ['No uses docker compose down --volumes durante la operación habitual: puede eliminar los datos persistentes.', 'Después de un cambio, ejecuta la comprobación operativa y revisa los logs de API y PostgreSQL si algo no carga.'],
      },
      {
        title: 'Cloudflare y publicación externa',
        paragraphs: ['La publicación es opcional y se configura desde el host.'],
        commands: ['sudo bash scripts/configure-cloudflare.sh'],
        bullets: ['El túnel temporal crea una URL trycloudflare.com para pruebas; no necesita dominio ni Cloudflare Access y deja de funcionar al cerrar el proceso.', 'El túnel permanente con Access necesita un dominio y configuración de Cloudflare.', 'El túnel se ejecuta en Docker y no requiere ZeroTier para esta conexión.', 'No guardes tokens, certificados ni secretos en GitHub.'],
      },
      {
        title: 'Actualizar desde consola con bloodkeeper-update',
        paragraphs: ['En instalaciones Linux desde Git, bloodkeeper-update descarga la última versión pública de main, conserva una copia del código, configuración y datos, construye las imágenes, aplica migraciones y comprueba los servicios. El instalador registra el usuario y la ruta propios de esa máquina.', 'Ejecuta el comando por SSH como el usuario configurado, sin sudo delante; te pedirá permisos para Docker cuando corresponda. Durante el despliegue puede haber una interrupción de servicio.'],
        commands: ['bloodkeeper-update', 'sudo bash scripts/install-update-command.sh --user "$(id -un)"'],
        bullets: ['La segunda orden sirve para registrar el comando en una instalación existente con compose.yaml; no descarga ni despliega cambios. Para producción, configura el archivo Compose y el nombre de proyecto que ya usa la máquina siguiendo docs/CONSOLE_UPDATES.md.', 'El comando requiere main sin cambios locales ni archivos nuevos pendientes. No borra cambios ni hace commits o push.', 'Descarga por HTTPS sin sustituir el remoto que utilices para subir código.', 'Si una fase falla, consulta el informe, corrige el problema y repite el mismo comando. Una descarga completada no se considera una actualización desplegada.', 'Las copias quedan en bloodkeeper_backups/updates dentro de la carpeta del usuario, salvo configuración alternativa. Conserva la copia del primer intento si necesitas recuperar la versión previa.', 'No se restauran datos automáticamente al fallar. Las instalaciones desde ZIP sin Git necesitan preparar un checkout antes de usar este actualizador.'],
      },
      {
        title: 'Actualizaciones y rollback',
        commands: ['./scripts/apply-update.sh --check', './scripts/apply-update.sh --apply --target REFERENCIA_GIT_LOCAL --confirm', './scripts/rollback-update.sh --check', './scripts/rollback-update.sh --apply --confirm'],
        bullets: ['Las actualizaciones se preparan y validan antes de aplicarse.', 'Conserva las copias de datos cuando haya migraciones.', 'No hagas git pull dentro de un flujo que deba ser reproducible.'],
      },
      {
        title: 'Historia general: permisos y conservación',
        paragraphs: ['Historia, en la navegación lateral, es el archivo general del mundo. Sus entradas no necesitan pertenecer a una crónica. Los administradores y los usuarios con rol global de narrador pueden crear y gestionar entradas; los jugadores consultan las que estén publicadas para todos los usuarios.'],
        bullets: ['En este archivo, el administrador puede gestionar también las entradas privadas. Privada no significa inaccesible para la administración.', 'Un narrador puede gestionar entradas no privadas y sus propias entradas privadas; el rol contextual de una crónica no debe confundirse con el rol global que habilita esta gestión.', 'El archivo Historia → Crónicas exige participación activa en esa crónica, también para un administrador: el rol global no sustituye esa pertenencia.', 'Las imágenes, referencias, entradas y guiones guardados forman parte de los datos de la aplicación. Su conservación depende de las copias de seguridad de datos, no de subir el código a GitHub.'],
      },
      {
        title: 'Qué comprobar antes de cerrar',
        bullets: ['La aplicación carga y los servicios aparecen saludables.', 'Existe una copia reciente y se conoce dónde está guardada.', 'Las credenciales y secretos no están en el repositorio.', 'El acceso público, si existe, está protegido y probado.', 'El log no muestra errores continuos de API, base de datos o almacenamiento.', 'Las operaciones destructivas se han confirmado y documentado.'],
      },
    ],
    quickStartTitle: 'Idea clave',
    quickStart: 'La web administra usuarios y estado visible; SSH y el panel general del host resuelven instalación, copias, restauraciones, publicación externa y recuperación ante fallos.',
  },
  narrator: {
    label: 'Narrador',
    badge: 'Rol contextual · narrador',
    introduction: 'Prepara la crónica, decide qué información se comparte y mantiene el ritmo de las sesiones. Sus permisos dependen de su papel dentro de cada crónica.',
    sections: [
      {
        title: 'Crear una crónica paso a paso',
        paragraphs: ['Entra en Crónicas y usa el asistente de creación. La crónica es el contenedor que une participantes, sesiones, historias, recursos, eventos y la memoria de la campaña.'],
        bullets: ['Define nombre, descripción, imagen y estado inicial.', 'Revisa el resultado antes de invitar a los jugadores.', 'Selecciona la crónica desde el selector superior para no trabajar por error sobre otra.', 'Después de crearla, configura participantes, personajes asociados y los primeros recursos.'],
      },
      {
        title: 'Generación rápida de crónicas',
        paragraphs: ['La generación rápida integrada sirve para montar una base jugable sin rellenar cada pieza desde cero. No sustituye las decisiones del narrador: prepara un punto de partida que después se puede revisar.'],
        bullets: ['Comprueba títulos, descripción, participantes, sesiones, historias y recursos antes de compartirla.', 'Completa o corrige el contenido desde cada panel; la generación no debe darse por definitiva.', 'Si quieres una campaña completamente controlada, crea la crónica manualmente y añade cada componente de forma progresiva.'],
      },
      {
        title: 'Participantes y personajes',
        paragraphs: ['Desde Crónicas → Participantes puedes revisar quién forma parte de la mesa, su papel y su personaje.'],
        bullets: ['Gestiona solicitudes de incorporación o asociación cuando estén disponibles.', 'Un jugador puede desasociar su personaje sin borrar la ficha ni su historial.', 'La asociación es el origen del nombre de la crónica que aparece en la ficha.', 'No confundas quitar una asociación con eliminar un personaje.'],
      },
      {
        title: 'Recursos de la crónica, sesiones e historias',
        paragraphs: ['Los recursos son la biblioteca reutilizable de la crónica. Primero se crean o incorporan en la crónica y después se enlazan allí donde tengan sentido.'],
        bullets: ['PNJ: aliados, rivales y figuras de la trama.', 'Localizaciones: lugares con descripción, foto y relaciones.', 'Organizaciones: facciones, dominios y grupos de poder.', 'Artefactos y documentos: objetos, pistas y material narrativo.', 'Desde una sesión, enlaza los recursos que aparecen o se utilizan en esa partida.', 'Desde una historia, enlaza los recursos que forman parte del arco aunque todavía no hayan aparecido en una sesión.', 'Desde notas y mapas, crea referencias para abrir la ficha con su imagen e información.', 'Edita o archiva el recurso desde su catálogo sin romper el registro histórico.'],
      },
      {
        title: 'Sesiones: preparar, abrir y cerrar',
        paragraphs: ['Una sesión representa una reunión concreta de la mesa. Se prepara antes de jugar, se utiliza durante la partida y después queda como registro de lo ocurrido.'],
        bullets: ['En preparación, añade título, resumen previsto, notas privadas y la información que necesites para dirigir.', 'Registra qué personajes activos han asistido mientras la sesión sea editable.', 'Durante la sesión, enlaza notas, recursos, historias y eventos relevantes.', 'Al completarla, la cronología conserva el resumen, la asistencia y las anotaciones vinculadas.', 'La asistencia histórica se conserva; registrar asistencia no concede experiencia automáticamente.'],
      },
      {
        title: 'Historias: la trama dentro de la crónica',
        paragraphs: ['Una historia organiza un arco narrativo que puede atravesar varias sesiones. La sesión registra cuándo se juega; la historia registra qué conflicto o hilo se está desarrollando.'],
        bullets: ['Escribe una premisa para recordar de qué trata el arco.', 'Define las apuestas: qué se puede ganar, perder o poner en peligro.', 'Añade notas privadas del narrador mientras la trama aún está en preparación.', 'Relaciona sesiones, eventos, PNJ y localizaciones para reunir todo el contexto.', 'Actualiza el estado hasta completarla o archivarla sin perder el historial.'],
      },
      {
        title: 'Tipos y progreso de las historias',
        paragraphs: ['El tipo ayuda a distinguir el peso del arco dentro de la campaña.'],
        bullets: ['Arco principal: el conflicto que sostiene la campaña.', 'Arco secundario: una trama paralela que puede cruzarse con la principal.', 'Arco personal: un hilo centrado en un personaje o en una parte concreta del grupo.', 'Los hitos representan gancho, primer giro, revelación, clímax y resolución.', 'Marca un hito cuando la ficción lo haya alcanzado y añade una nota que explique qué ocurrió.', 'Los recordatorios sirven para no olvidar cabos abiertos.'],
      },
      {
        title: 'Historias de la crónica: qué compartes con los jugadores',
        paragraphs: ['En la ficha de una historia, el panel Publicación permite elegir Solo Narrador o Participantes de la Crónica y redactar un Resumen compartido. Pulsa Guardar publicación para conservar ambas decisiones. Completar una historia no la publica automáticamente.', 'La vista compartida muestra título, tipo, estado, resumen compartido, progreso y estado de los hitos, además de las sesiones vinculadas disponibles. La premisa, las apuestas, las descripciones privadas de hitos, los recordatorios, las notas del Narrador, la resolución privada y el guion no se incluyen en esa vista.'],
        bullets: ['Usa Solo Narrador para preparar un arco sin mostrarlo a la mesa.', 'Usa Participantes de la Crónica cuando quieras que los participantes activos consulten la versión compartida. Revisa el título y el resumen para evitar anticipar revelaciones.', 'Los jugadores pueden ver que un hito se ha completado, pero no su descripción privada. El estado del progreso también puede dar pistas sobre la trama: tenlo en cuenta al publicar.', 'Guarda la publicación antes de completar o archivar la historia, porque después sus controles quedan en modo de consulta.', 'La resolución del cierre se consulta por el Narrador en la historia cerrada. Para la memoria compartida de Historia → Crónicas se utiliza el Resumen compartido, no esa resolución.'],
      },
      {
        title: 'Guion privado del Narrador: preparar el flujo de pistas',
        paragraphs: ['Abre Crónicas → selecciona la crónica → Historias → selecciona una historia → Guion privado del Narrador. Este lienzo reúne lo que tú sabes de la trama y los caminos que podrían seguir los personajes. Pertenece a esa historia y solo se ofrece en el espacio de gestión del Narrador; no aparece en la información compartida con jugadores.', 'Usa una tarjeta por elemento o descubrimiento importante. Por ejemplo: en la morgue encuentran un sello; el sello conduce a Elena; Elena identifica la Casa de los Ecos. Añade también una ruta alternativa, como una factura que permita encontrar la casa aunque no hablen con Elena. El guion representa posibilidades y condiciones, no obliga a los jugadores a seguir un único recorrido.'],
        bullets: ['Pulsa Añadir tarjeta: una ventana flotante permite elegir Pista, Personaje, Lugar, Documento / recurso, Suceso, Decisión o Resultado y escribir su título.', 'Arrastra las tarjetas para colocarlas. Mover una tarjeta cambia su posición en el guion, no el contenido de un recurso ni lo que ven los jugadores.', 'Pulsa Editar en una tarjeta, haz doble clic o usa Intro al enfocarla para abrir su ventana de edición. Puedes consultar o modificar título, descripción y nota privada del Narrador.', 'Describe lo que se puede encontrar en Descripción. Reserva Nota privada del Narrador para la verdad, requisitos, consecuencias, pistas alternativas o respuestas que necesitas durante la partida.', 'Las tarjetas son elementos propios del guion: escribir el nombre de un PNJ o lugar no crea ni enlaza automáticamente su ficha en Recursos.', 'Las historias completadas o archivadas permiten consultar el guion, pero no modificarlo. Guarda tu preparación antes de cerrarlas.'],
      },
      {
        title: 'Guion privado: páginas para continuar la historia',
        paragraphs: ['Usa las pestañas del guion para separar Inicio, Investigación, Consecuencias u otras partes de la misma historia. Cada página tiene su propio lienzo: cambiar de página no amplía el mapa ni duplica tarjetas. Los guiones anteriores se abren en Inicio conservando tarjetas, posiciones, notas y conexiones.', 'Pulsa ＋ Página y escribe un nombre. Renombrar cambia el nombre de la página actual. Solo se puede eliminar una página vacía, y debe quedar al menos una página. Todos estos cambios forman parte del borrador hasta pulsar Guardar guion.'],
        bullets: ['Añadir tarjeta la coloca en la página actual. Para mover una tarjeta existente, abre Editar y cambia Página: conserva su contenido y conexiones.', 'Esta tarjeta lleva a agrupa los destinos por página. Puedes conectar tarjetas de distintas páginas igual que las del mismo lienzo.', 'Las flechas del lienzo unen las tarjetas de esa página. Cuando una conexión cruza páginas, aparece un acceso con origen, destino, significado y nombre de página. Abrir destino cambia de página y destaca la tarjeta; Volver al origen permite regresar.', 'Puedes cambiar de página y seguir conexiones también al consultar una historia cerrada. Crear, renombrar, mover o eliminar sigue reservado a historias editables.', 'El guion admite hasta 30 páginas, 120 tarjetas y 240 conexiones en total, no por página. Las páginas siguen siendo privadas: no se publican a los jugadores ni se copian a la Sala de Investigación.'],
      },
      {
        title: 'Continuar desde una tarjeta sin perder el contexto',
        paragraphs: ['Pulsa ＋ Nueva página dentro de una tarjeta, o Continuar en una nueva página en su editor. Escribe el nombre y pulsa Crear página y continuar. La tarjeta permanece en su página original y aparece al principio de la nueva, con un acceso para continuar y otro para volver al origen.', 'No se crean dos copias: título, descripción, nota privada y estado pertenecen a una sola tarjeta y cualquier modificación se ve en todas sus páginas. Puedes arrastrarla a posiciones distintas en cada lienzo sin mover las otras apariciones.'],
        bullets: ['Puedes continuar desde una aparición para crear otro tramo, o abrir varias rutas alternativas desde el mismo origen. Si hay varios accesos, la tarjeta muestra un selector de páginas.', 'Las conexiones existentes siguen unidas a la misma tarjeta. Cada lienzo dibuja las flechas cuyos extremos están en esa página; las relaciones hacia otros lienzos mantienen sus accesos de navegación.', 'La Página de origen queda bloqueada mientras tenga continuaciones, para conservar su contexto. El editor permite Quitar solo de esta página cuando estás consultando una aparición: no borra la tarjeta original, sus notas ni sus conexiones.', 'Si retiras una aparición desde la que partían otras continuaciones, sus accesos de regreso pasan a la página de origen. Después podrás eliminar la página si quedó vacía.', 'Eliminar de todas las páginas borra la tarjeta y sus conexiones de todo el guion; la aplicación pide confirmar antes de hacerlo. Revisa el borrador antes de guardar.', 'Crear una continuación no consume otra tarjeta del límite global. Sigue siendo necesario pulsar Guardar guion para conservar páginas y apariciones. Las historias cerradas permiten seguir estos accesos, pero no crear ni retirar apariciones.', 'Esta preparación sigue siendo privada: compartir una historia o marcar la tarjeta como descubierta no publica sus datos ni sus páginas a los jugadores.'],
      },
      {
        title: 'Guion privado: conexiones, estados y guardado',
        paragraphs: ['Las flechas explican cómo una información conduce a otra. En la ventana de una tarjeta, Crear conexión parte de esa tarjeta hacia la que elijas. El significado de la flecha debe explicar la relación: reconoce el símbolo, revela la dirección, exige una decisión o provoca una consecuencia.', 'Editar una tarjeta actualiza el borrador del lienzo. Cerrar la ventana, pulsar Listo o añadir una tarjeta no guarda todavía el guion en el servidor: usa Guardar guion en la barra superior.'],
        bullets: ['En Esta tarjeta lleva a elige el destino, escribe el Significado, selecciona un Color y pulsa Añadir flecha. Los colores son una ayuda visual; no cambian permisos ni reglas de la historia.', 'Puedes crear varias salidas para ofrecer rutas alternativas. En Sale hacia consulta las conexiones de esa tarjeta y elimina las que sobren.', 'Secreto / pendiente indica algo preparado que aún no se ha descubierto; Descubierto por la coterie marca información conocida; Resuelto señala un elemento ya tratado. Son estados de tu seguimiento privado.', 'Marcar una tarjeta como descubierta no la publica ni la copia a la Sala de Investigación. Comparte manualmente allí solo la información que los jugadores hayan obtenido.', 'Usa los botones de zoom para leer el flujo y el desplazamiento del lienzo para recorrerlo.', 'Eliminar una tarjeta elimina también sus conexiones del borrador. Revisa el resultado antes de guardar.', 'Cuando aparezca Cambios sin guardar, conserva el borrador con Guardar guion. Al cambiar de historia o volver a Ficha de historia, la aplicación pide confirmar si quieres descartar cambios pendientes.', 'Después de guardar, comprueba el indicador Guardado. Si el guardado falla, conserva la página abierta y revisa el aviso antes de recargar o salir.'],
      },
      {
        title: 'Historia: archivo general del mundo',
        paragraphs: ['Historia es un apartado propio en la navegación lateral. Sirve para documentar el mundo de juego más allá de una campaña: acontecimientos, épocas, personajes, organizaciones, lugares y otros elementos. No sustituye Historias dentro de Crónicas, donde preparas y sigues los arcos de esa mesa.', 'Puedes utilizarlo como enciclopedia y cronología: una época presenta un periodo, un acontecimiento registra un hecho, una organización explica una facción y una entrada de personaje describe una figura histórica. Un personaje de esta categoría es una entrada de documentación, no una ficha de jugador creada automáticamente.'],
        bullets: ['Elige Todo o una categoría para consultar el archivo. La búsqueda encuentra títulos, periodos, resúmenes, contenido y etiquetas.', 'Selecciona Más antiguo primero o Más reciente primero para cambiar el orden. El listado muestra cinco entradas por página; usa los controles de paginación para pasar a las siguientes.', 'Con rol global de narrador o administrador, pulsa Nueva entrada y completa título, categoría, periodo, año inicial y final cuando proceda, resumen y desarrollo.', 'Usa las etiquetas para agrupar temas. Indica si se trata de Canon oficial, Creación propia o Versión alternativa para distinguir tus adaptaciones de la ambientación de referencia.', 'Puedes asociar la entrada a las crónicas que puedes gestionar. Esa relación da contexto: no restringe por sí sola quién puede leerla. Revisa siempre su visibilidad.', 'Guarda la entrada para conservar los cambios. Archivar la retira de la consulta habitual; no equivale a borrar todos sus datos. Los gestores pueden incluir archivadas para consultarlas.'],
      },
      {
        title: 'Historia: publicación y visibilidad',
        paragraphs: ['Estado y visibilidad responden a preguntas distintas: el estado indica si la entrada está en preparación, publicada o archivada; la visibilidad indica a quién va dirigida. Para un jugador, una entrada del archivo general debe estar Publicada y tener acceso Todos los usuarios.', 'Los usuarios con rol global de narrador pueden consultar las entradas no privadas, incluidos borradores, y sus propias entradas privadas. Los administradores pueden consultar y gestionar también las privadas. Por tanto, Solo narradores no significa solo el narrador de una crónica concreta.'],
        bullets: ['Borrador: conserva el trabajo en preparación; no aparece en la consulta de un jugador.', 'Publicada + Todos los usuarios: permite leer la entrada a los usuarios autenticados, aunque no pertenezcan a una crónica asociada.', 'Solo narradores: reserva la entrada a usuarios con rol global de narrador y administradores.', 'Privada: limita el acceso ordinario al autor narrador y a la administración; no la uses como publicación para una mesa concreta.', 'Los narradores pueden editar entradas no privadas y sus propias privadas. La administración puede gestionar todas. Los jugadores no pueden crear, editar ni archivar estas entradas.', 'Antes de publicar, revisa también la imagen, el pie de foto, los nombres mencionados y el texto: forman parte de lo que el lector puede conocer.'],
      },
      {
        title: 'Historia: imágenes y menciones',
        paragraphs: ['En la ventana de creación o edición puedes añadir una imagen principal y referencias a recursos o personajes. La imagen acompaña al relato; las menciones permiten consultar un elemento relacionado sin duplicar su información.', 'El nombre de una mención se muestra a quien puede leer la entrada. Al abrirla, la aplicación comprueba por separado el acceso al recurso o personaje. Conocer su nombre no concede permisos sobre sus datos.'],
        bullets: ['Selecciona una imagen JPEG, PNG o WebP de hasta 5 MB. Añade Pie de foto y Crédito de la imagen cuando corresponda y guarda la entrada.', 'Pulsa la imagen de una entrada para ampliarla. Para retirarla, edita la entrada, marca Eliminar imagen al guardar y guarda los cambios.', 'En Buscar recurso o personaje (@), escribe parte del nombre y selecciona un resultado autorizado. La mención se inserta en el contenido y también aparece en Elementos relacionados.', 'No es necesario escribir identificadores ni enlaces técnicos. Para quitar una referencia, usa Quitar mención; el nombre queda como texto en el relato.', 'Al pulsar una mención se abre una vista de la información disponible del elemento, no se concede edición ni acceso a toda su ficha.', 'Si el lector no tiene acceso, verá que conoce el nombre pero no dispone de más información. Aun así, el nombre y cualquier detalle escrito directamente en la entrada ya están compartidos: evita revelar secretos en ellos.', 'Las fichas de otros personajes de jugador conservan sus permisos; compartir una entrada no convierte todas las fichas mencionadas en públicas.'],
      },
      {
        title: 'Historia → Crónicas: memoria automática de la mesa',
        paragraphs: ['Dentro de Historia, pulsa Crónicas y elige una de las mesas en las que eres participante activo. Este archivo reúne automáticamente resúmenes guardados en las sesiones y en las historias cerradas. Es una vista de lectura: el contenido se prepara en la sesión o historia original.', 'El archivo no publica tus notas privadas ni el guion de pistas. Tampoco usa la nota de resolución del cierre como sustituto del Resumen compartido.'],
        bullets: ['Una sesión aparece cuando está Completada y tiene un resumen no vacío. Escribe ese resumen para los participantes; las notas privadas del Narrador se mantienen aparte.', 'Una historia aparece cuando ha sido completada, tiene acceso Participantes de la Crónica y contiene un Resumen compartido no vacío. Si después se archiva, su recuerdo puede seguir presente.', 'Completa el resumen y la publicación de una historia antes de cerrarla: al completarse o archivarse, su ficha queda en modo de consulta.', 'La nota de resolución del cierre conserva el desenlace para el Narrador. Si quieres compartirlo, redacta antes una versión adecuada en Resumen compartido.', 'El orden utiliza la fecha real de la sesión; si falta, usa su última actualización. Para historias utiliza la fecha de finalización. En empates, ordena por título.', 'Cada lector solo accede a crónicas en las que tiene participación activa. No basta con tener rol global de narrador o administrador.', 'Si falta un recuerdo, comprueba pertenencia activa, estado de cierre, resumen y, en historias, la publicación para participantes.'],
      },
      {
        title: 'Eventos y línea temporal',
        paragraphs: ['Un evento es un hecho narrativo que quieres localizar dentro de la historia: una aparición, una decisión, un conflicto, una pista o una consecuencia.'],
        bullets: ['Crea el evento con título, descripción y referencia temporal narrativa.', 'Añade una fecha real opcional cuando ayude a ordenar la campaña.', 'Relaciona personajes, PNJ y localizaciones para que el evento se entienda desde sus participantes.', 'Enlázalo con una sesión o una historia cuando forme parte de ellas.', 'Edita los eventos activos, reordénalos o archívalos si dejan de estar vigentes.', 'Las notas privadas de un evento sólo deben contener información para el narrador.', 'La línea temporal ordena estos registros; no reemplaza el resumen de una sesión ni el progreso de una historia.'],
      },
      {
        title: 'Pizarra y notas compartidas',
        paragraphs: ['La Sala de Investigación reúne pizarra, cronología y archivo. Las notas pueden ser privadas, compartidas o vinculadas a una sesión.'],
        bullets: ['Indica quién puede leer una anotación antes de compartirla.', 'Relaciona personas, lugares y recursos para que la pista tenga contexto.', 'La vista personal de la pizarra permite filtrar por una sesión, notas generales o todas las sesiones.', 'La posición, selección y conexiones ayudan a preparar la escena sin alterar la información original.'],
      },
      relationshipManual,
      {
        title: 'Mapas y cartografía',
        paragraphs: ['En Mapa puedes trabajar con varias escalas: por ejemplo, una provincia, una ciudad y un barrio.'],
        bullets: ['Sube o reemplaza la imagen de cada mapa y establece su mapa superior.', 'Añade marcadores y zonas; puedes editar o borrar ambos elementos.', 'Elige tamaño del marcador y diferencia las zonas por color de relleno, borde y texto.', 'Ajusta tamaño y posición del texto dentro de una zona.', 'Enlaza un marcador con un recurso: al pulsarlo se abre su ficha flotante y desde ahí su información completa.', 'Usa zoom para trabajar con mapas amplios sin perder el contexto.'],
      },
      {
        title: 'Jugar y dirigir la mesa',
        paragraphs: ['En Jugar consulta el estado de la crónica y usa las herramientas de tiradas habilitadas para la mesa.'],
        bullets: ['Comprueba personaje, hambre, salud, voluntad y demás datos antes de resolver una acción.', 'Registra el resultado con una dificultad y contexto comprensibles.', 'La aplicación ayuda con el cálculo; la decisión narrativa sigue siendo del narrador.'],
      },
      {
        title: 'Qué no debe hacer un narrador',
        bullets: ['No asumir que ser narrador de una crónica concede administración global.', 'No compartir notas privadas por error ni adjuntar una pista a la sesión equivocada.', 'No borrar un recurso si basta con archivarlo.', 'No usar la base de datos o los scripts de recuperación para tareas narrativas normales.'],
      },
    ],
    quickStartTitle: 'Orden recomendado',
    quickStart: 'Prepara la crónica → incorpora participantes → crea historias y recursos → organiza y guarda el guion privado → prepara la sesión → dirige y comparte solo las pistas descubiertas → redacta los resúmenes → configura la publicación antes de cerrar la historia → revisa Historia → Crónicas.',
  },
  player: {
    label: 'Jugador',
    badge: 'Rol contextual · jugador',
    introduction: 'Consulta tu personaje, participa en las crónicas y conserva tus propias pistas. Lo que puedes ver depende de la crónica y de la visibilidad de cada contenido.',
    sections: [
      {
        title: 'Entrar y orientarse',
        paragraphs: ['Después de iniciar sesión, usa la navegación lateral. Las secciones visibles pueden variar según tus permisos y según si tienes una crónica seleccionada.'],
        bullets: ['Inicio resume tus crónicas y accesos.', 'Personajes crea y consulta tus fichas.', 'Jugar permite participar en la mesa.', 'Mapa consulta la cartografía disponible.', 'Sala de Investigación reúne tus notas y la memoria compartida.', 'Crónicas revisa tu participación y sesiones.', 'Historia reúne la documentación del mundo y, en su pestaña Crónicas, los resúmenes compartidos de tus mesas.'],
      },
      {
        title: 'Crear y cuidar tu personaje',
        paragraphs: ['En Personajes crea la ficha por pasos y guarda los cambios antes de salir.'],
        bullets: ['Completa identidad, concepto, clan, atributos, habilidades y demás campos.', 'El nombre de la crónica asociada se obtiene de la asociación persistida.', 'Puedes conservar la ficha independiente hasta asociarla a una crónica.', 'Desasociar retira la relación con la crónica, pero conserva la ficha y su historial.', 'Archiva una ficha que ya no uses en vez de borrarla sin necesidad.'],
      },
      {
        title: 'Participar en una crónica',
        paragraphs: ['En Crónicas consulta las campañas a las que tienes acceso.'],
        bullets: ['Asocia uno de tus personajes independientes cuando el narrador lo permita.', 'Consulta tu estado, sesiones, asistencia y experiencia registrada.', 'Si ya no quieres participar con ese personaje, desasócialo desde su relación y confirma la operación.', 'La desasociación no borra la hoja ni la historia del personaje.'],
      },
      {
        title: 'Sesiones y cronología',
        paragraphs: ['La cronología muestra la historia de la crónica en orden. Puedes abrir una sesión para consultar su resumen, anotaciones compartidas y registros disponibles.'],
        bullets: ['Marca o consulta la asistencia según el flujo de la mesa.', 'Usa la búsqueda y los filtros para localizar una sesión concreta.', 'Las anotaciones privadas del narrador no se vuelven visibles por aparecer en la misma sesión.'],
      },
      {
        title: 'Historias compartidas de una crónica',
        paragraphs: ['Dentro de Crónicas → Historias puedes consultar los arcos que el Narrador haya publicado para participantes. Verás su título, tipo, estado, resumen compartido, progreso y estado de los hitos, junto con las sesiones vinculadas disponibles.', 'Que una historia esté compartida no permite leer la premisa de preparación, las apuestas privadas, las descripciones de los hitos, los recordatorios, la resolución del Narrador ni su guion privado. Una historia completada puede seguir siendo privada si no se publicó para la mesa.'],
        bullets: ['Usa el resumen compartido para recordar el conflicto y lo que vuestro grupo conoce.', 'El progreso indica hitos completados; sus explicaciones privadas siguen reservadas al Narrador.', 'El guion privado no es la pizarra personal de la Sala de Investigación. Para tus hipótesis y conexiones utiliza tu espacio de investigación.'],
      },
      {
        title: 'Historia: leer el mundo y sus referencias',
        paragraphs: ['En Historia, desde la navegación lateral, puedes leer las entradas publicadas para todos los usuarios. Es el archivo general del mundo, independiente de las Historias de una crónica. Una entrada asociada a una campaña puede seguir siendo visible para todos si el Narrador la publica con ese acceso.', 'Usa Todo o las categorías Acontecimientos, Épocas, Personajes, Organizaciones, Lugares y Otros. Selecciona una entrada del listado para leer su desarrollo, ver la imagen y consultar elementos relacionados.'],
        bullets: ['Busca por nombre, periodo o etiqueta y cambia entre Más antiguo primero y Más reciente primero.', 'El listado muestra cinco entradas por página. Usa los botones de paginación para recorrerlo.', 'Pulsa la imagen para ampliarla. Las menciones y Elementos relacionados abren la información a la que tengas acceso.', 'Puedes conocer el nombre de un PNJ, lugar, recurso o personaje sin poder consultar sus datos. En ese caso, la vista te indicará que no tienes acceso a más información.', 'Una mención no te permite editar el recurso ni abrir cualquier ficha de jugador. Cada elemento conserva sus permisos.', 'Los borradores, las entradas reservadas a narradores y las privadas no forman parte de tu archivo como jugador. Tampoco puedes crear, editar o archivar entradas generales.'],
      },
      {
        title: 'Historia → Crónicas: recordar lo ocurrido',
        paragraphs: ['En Historia, pulsa Crónicas y elige una mesa en la que seas participante activo. Encontrarás los resúmenes de sesiones completadas y las historias cerradas que el Narrador haya compartido con la crónica.', 'Este archivo permite repasar la partida sin consultar la preparación del Narrador. No incluye su guion privado, notas privadas, hitos secretos ni la nota privada de resolución.'],
        bullets: ['Las sesiones necesitan estar completadas y tener resumen. Las historias necesitan estar completadas, tener un resumen compartido y acceso para participantes.', 'La fecha de una sesión es su fecha real o, si falta, su última actualización; la de una historia es su fecha de finalización.', 'Si todavía no hay resúmenes, el archivo muestra un mensaje vacío. No significa que puedas acceder a las notas privadas de preparación.', 'Solo se muestran las crónicas en las que mantienes participación activa. Pertenecer a una mesa no permite consultar la memoria de otras.', 'Si falta un resumen que esperabas, pide al Narrador que revise el cierre y la publicación en el registro original.'],
      },
      relationshipManual,
      {
        title: 'La pizarra personal',
        paragraphs: ['En la Sala de Investigación, la pizarra personal te permite ordenar lo que sabes sin modificar la biblioteca de la crónica.'],
        bullets: ['Filtra por una sesión, por notas generales o por todas las sesiones.', 'Busca personas, lugares y anotaciones.', 'Selecciona, oculta o reorganiza tarjetas y conserva tu vista personal.', 'Abre una tarjeta para consultar su ficha o la anotación completa.', 'Lo privado sigue dependiendo de los permisos devueltos por la crónica.'],
      },
      {
        title: 'Notas, pistas y recursos',
        paragraphs: ['Puedes crear anotaciones desde los espacios habilitados y relacionarlas con una sesión o con un recurso.'],
        bullets: ['Una nota compartida puede ser consultada por los participantes autorizados.', 'Una nota privada sólo debe contener información que quieras conservar para ti.', 'Al abrir una localización, persona u objeto enlazado, consulta su foto y ficha completa cuando estén disponibles.', 'Usa títulos claros para encontrar las pistas después.'],
      },
      {
        title: 'Mapas y mesa de juego',
        paragraphs: ['El mapa de la crónica se consulta como herramienta de orientación narrativa.'],
        bullets: ['Pulsa un marcador para ver su información y abrir el recurso enlazado.', 'Usa zoom para leer mapas grandes y cambia de escala si existe una jerarquía.', 'Las zonas y marcadores se editan sólo con permiso de narrador.', 'En Jugar realiza las tiradas y consulta tu estado según lo que la mesa permita.'],
      },
      {
        title: 'Qué no puede hacer un jugador',
        bullets: ['No administrar usuarios, roles ni credenciales globales.', 'No crear copias, restaurar la base de datos ni ejecutar mantenimiento del servidor.', 'No editar o borrar mapas, zonas y marcadores sin permiso narrativo.', 'No leer notas privadas, recursos restringidos o historias no compartidas contigo.'],
      },
    ],
    quickStartTitle: 'Primeros pasos',
    quickStart: 'Completa tu personaje → asócialo a la crónica → revisa la sesión actual → consulta el mapa → filtra la pizarra por sesión → comparte tus notas cuando estés preparado.',
  },
}

function GuideSection({ section, index }: { readonly section: ManualSection; readonly index: number }) {
  return (
    <details className="manual-guide-card" open={index < 2}>
      <summary>{section.title}</summary>
      <div className="manual-guide-card__body">
        {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        {section.commands?.length ? (
          <div className="manual-guide-card__commands" aria-label="Comandos">
            {section.commands.map((command) => <code key={command}>{command}</code>)}
          </div>
        ) : null}
        {section.bullets?.length ? (
          <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
        ) : null}
      </div>
    </details>
  )
}

function RolePanel({ role }: { readonly role: ManualRole }) {
  const definition = manualRoles[role]

  return (
    <section className="manual-role-panel" role="tabpanel" aria-label={definition.label}>
      <div className="manual-role-summary">
        <div>
          <h2>{definition.label}</h2>
          <p>{definition.introduction}</p>
        </div>
        <span className="manual-badge">{definition.badge}</span>
      </div>

      <div className="manual-guide-grid">
        {definition.sections.map((section, index) => <GuideSection key={section.title} section={section} index={index} />)}
      </div>

      <div className="manual-quick-start">
        <strong>{definition.quickStartTitle}</strong>
        <p>{definition.quickStart}</p>
      </div>
    </section>
  )
}

export function ManualPage() {
  const [activeRole, setActiveRole] = useState<ManualRole>('admin')
  const roles: readonly ManualRole[] = ['admin', 'narrator', 'player']

  return (
    <section className="manual-page">
      <div className="manual-page__notice" role="note">
        <span aria-hidden="true">◈</span>
        <p><strong>La aplicación adapta las acciones a tus permisos.</strong> Esta guía explica las funciones disponibles para cada responsabilidad; no concede acceso adicional.</p>
      </div>

      <section className="manual-page__panel" aria-label="Manual por perfil">
        <header className="manual-page__panel-heading">
          <div>
            <span className="manual-page__eyebrow">GUÍA RÁPIDA</span>
            <h2>Elige tu perfil</h2>
            <p>El contenido se adapta a tu responsabilidad dentro de BloodKeeper.</p>
          </div>
          <span className="manual-badge manual-badge--soft">Guía integrada</span>
        </header>

        <div className="manual-role-tabs" role="tablist" aria-label="Perfiles del manual">
          {roles.map((role) => (
            <button
              key={role}
              type="button"
              role="tab"
              aria-selected={activeRole === role}
              className={activeRole === role ? 'is-active' : ''}
              onClick={() => setActiveRole(role)}
            >
              {manualRoles[role].label}
            </button>
          ))}
        </div>

        <RolePanel role={activeRole} />
      </section>

      <p className="manual-page__footer">El manual debe mantenerse sincronizado con las funciones y permisos reales de BloodKeeper.</p>
    </section>
  )
}
