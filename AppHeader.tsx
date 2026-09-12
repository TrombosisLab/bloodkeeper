import { useActiveChronicleHeader } from './activeChronicleHeader'
export function AppHeader({ displayName = 'jugador' }: { displayName?: string }) {
  const currentHash = typeof window !== 'undefined' ? window.location.hash : ''
  const pageContext = currentHash.startsWith('#/notebook')
    ? { eyebrow: 'CUADERNO', title: 'Cuaderno de la crónica', subtitle: 'Notas. Ideas. Conexiones. Todo deja huella.' }
    : currentHash.startsWith('#/dashboard')
      ? { eyebrow: 'INICIO', title: `Bienvenido, ${displayName}`, subtitle: 'Selecciona una crónica activa y consulta el estado de tu personaje.' }
      : currentHash.startsWith('#/characters')
        ? { eyebrow: 'PERSONAJES', title: 'Personajes', subtitle: 'Fichas y creación.' }
        : currentHash.startsWith('#/administration')
          ? { eyebrow: 'ADMINISTRACIÓN', title: 'Administración', subtitle: 'Usuarios y accesos.' }
          : currentHash.startsWith('#/play')
            ? { eyebrow: 'JUGAR', title: 'Mesa de juego', subtitle: 'Prepara y continúa la partida.' }
            : currentHash.startsWith('#/resources')
              ? { eyebrow: 'RECURSOS', title: 'Recursos', subtitle: 'Biblioteca reutilizable.' }
              : currentHash.startsWith('#/chronicles')
                ? { eyebrow: 'CRÓNICAS', title: 'Crónicas', subtitle: 'Participación y gestión.' }
                : { eyebrow: '', title: '', subtitle: '' }
  const isDashboard = typeof window !== 'undefined' && window.location.hash === '#/dashboard'
  useActiveChronicleHeader()
  return (
    <header className="app-header">
      <div className="app-brand">
        <span className="app-brand__mark">
          V
        </span>

        <div>
          <strong>BloodKeeper</strong>
          <span>Vampiro V5 Revolution</span>
        </div>
      </div>

      <div id="app-header-page-actions" className="app-header__page-actions" aria-label="Acciones de la página" />

      <div className="app-header__status">
        <span aria-hidden="true" />
        Sistema operativo
      </div>
    {pageContext.title ? <div className="app-header__page-context">
        <small>{pageContext.eyebrow}</small>
        <strong>{pageContext.title}</strong>
        <span>{pageContext.subtitle}</span>
      </div> : null}</header>
  )
}

// GLOBAL_CHRONICLE_HEADER_CONTEXT_V1

// UNIFIED_DASHBOARD_HEADER_V1

// UNIFIED_GLOBAL_HEADER_EXCEPT_NOTEBOOK_V1

// CHARACTER_HEADER_ACTIONS_V3

// NOTEBOOK_GLOBAL_HEADER_V1

// NOTEBOOK_GLOBAL_HEADER_V2

// NOTEBOOK_GLOBAL_HEADER_V3

// NOTEBOOK_GLOBAL_HEADER_V4

// NOTEBOOK_GLOBAL_HEADER_V5
