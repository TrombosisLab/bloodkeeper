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
        title: 'Actualizaciones y rollback',
        commands: ['./scripts/apply-update.sh --check', './scripts/apply-update.sh --apply --target REFERENCIA_GIT_LOCAL --confirm', './scripts/rollback-update.sh --check', './scripts/rollback-update.sh --apply --confirm'],
        bullets: ['Las actualizaciones se preparan y validan antes de aplicarse.', 'Conserva las copias de datos cuando haya migraciones.', 'No hagas git pull dentro de un flujo que deba ser reproducible.'],
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
        title: 'Eventos y línea temporal',
        paragraphs: ['Un evento es un hecho narrativo que quieres localizar dentro de la historia: una aparición, una decisión, un conflicto, una pista o una consecuencia.'],
        bullets: ['Crea el evento con título, descripción y referencia temporal narrativa.', 'Añade una fecha real opcional cuando ayude a ordenar la campaña.', 'Relaciona personajes, PNJ y localizaciones para que el evento se entienda desde sus participantes.', 'Enlázalo con una sesión o una historia cuando forme parte de ellas.', 'Edita los eventos activos, reordénalos o archívalos si dejan de estar vigentes.', 'Las notas privadas de un evento sólo deben contener información para el narrador.', 'La línea temporal ordena estos registros; no reemplaza el resumen de una sesión ni el progreso de una historia.'],
      },
      {
        title: 'Pizarra y notas compartidas',
        paragraphs: ['La Sala de Investigación reúne pizarra, cronología y archivo. Las notas pueden ser privadas, compartidas o vinculadas a una sesión.'],
        bullets: ['Indica quién puede leer una anotación antes de compartirla.', 'Relaciona personas, lugares y recursos para que la pista tenga contexto.', 'La vista personal de la pizarra permite filtrar por una sesión, notas generales o todas las sesiones.', 'La posición, selección y conexiones ayudan a preparar la escena sin alterar la información original.'],
      },
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
    quickStart: 'Prepara la crónica → incorpora participantes → crea historias y recursos → añade eventos → prepara la sesión → abre la mesa → toma notas y enlaza pistas → cierra la sesión → actualiza hitos y revisa la cronología.',
  },
  player: {
    label: 'Jugador',
    badge: 'Rol contextual · jugador',
    introduction: 'Consulta tu personaje, participa en las crónicas y conserva tus propias pistas. Lo que puedes ver depende de la crónica y de la visibilidad de cada contenido.',
    sections: [
      {
        title: 'Entrar y orientarse',
        paragraphs: ['Después de iniciar sesión, usa la navegación lateral. Las secciones visibles pueden variar según tus permisos y según si tienes una crónica seleccionada.'],
        bullets: ['Inicio resume tus crónicas y accesos.', 'Personajes crea y consulta tus fichas.', 'Jugar permite participar en la mesa.', 'Mapa consulta la cartografía disponible.', 'Sala de Investigación reúne tus notas y la memoria compartida.', 'Crónicas revisa tu participación y sesiones.'],
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
