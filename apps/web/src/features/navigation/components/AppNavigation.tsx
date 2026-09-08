import {
  useEffect,
  useState,
} from 'react'

import type {
  AppSection,
} from '../types/app-navigation.types'

import './app-navigation.css'

interface AppNavigationProps {
  readonly 'aria-label': string
  readonly activeSection: AppSection
  readonly canAccessChronicles: boolean
  readonly canCreateChronicles: boolean
  readonly canAccessAdministration: boolean
  readonly onNavigate: (
    section: AppSection,
  ) => void
}

const compactNavigationQuery =
  '(max-width: 900px)'

export function AppNavigation({
  'aria-label': navigationLabel,
  activeSection,
  canAccessChronicles,
  canCreateChronicles,
  canAccessAdministration,
  onNavigate,
}: AppNavigationProps) {
  const [
    compactNavigation,
    setCompactNavigation,
  ] = useState(
    () =>
      window.matchMedia(
        compactNavigationQuery,
      ).matches,
  )

  const [menuOpen, setMenuOpen] =
    useState(false)

  useEffect(() => {
    const mediaQuery =
      window.matchMedia(
        compactNavigationQuery,
      )

    const updateNavigationMode = (
      event: MediaQueryListEvent,
    ) => {
      setCompactNavigation(event.matches)

      if (!event.matches) {
        setMenuOpen(false)
      }
    }

    setCompactNavigation(
      mediaQuery.matches,
    )

    mediaQuery.addEventListener(
      'change',
      updateNavigationMode,
    )

    return () => {
      mediaQuery.removeEventListener(
        'change',
        updateNavigationMode,
      )
    }
  }, [])

  const navigationVisible =
    !compactNavigation || menuOpen

  function selectSection(
    section: AppSection,
  ) {
    onNavigate(section)

    if (compactNavigation) {
      setMenuOpen(false)
    }
  }

  return (
    <aside
      className="app-navigation-shell"
      aria-label="Navegación de la aplicación"
    >
      <div className="app-navigation__heading">
        <div>
          <span>BloodKeeper</span>
          <strong>Secciones</strong>
        </div>

        <button
          type="button"
          className="app-navigation__toggle"
          aria-expanded={navigationVisible}
          aria-controls="app-primary-navigation"
          onClick={() =>
            setMenuOpen(
              (current) => !current,
            )
          }
        >
          {navigationVisible
            ? 'Ocultar menú'
            : 'Mostrar menú'}
        </button>
      </div>

      <nav
        id="app-primary-navigation"
        className="app-navigation"
        aria-label={navigationLabel}
        hidden={!navigationVisible}
      >
        <button
          type="button"
          aria-current={
            activeSection === 'dashboard'
              ? 'page'
              : undefined
          }
          onClick={() =>
            selectSection('dashboard')
          }
        >
          <span>Inicio</span>
          <small>Resumen y accesos</small>
        </button>

        <button
          type="button"
          aria-current={
            activeSection === 'characters'
              ? 'page'
              : undefined
          }
          onClick={() =>
            selectSection('characters')
          }
        >
          <span>Personajes</span>
          <small>Ficha y creación</small>
        </button>

        {canAccessAdministration ? (
          <button
            type="button"
            aria-current={
              activeSection === 'administration'
                ? 'page'
                : undefined
            }
            onClick={() =>
              selectSection('administration')
            }
          >
            <span>Administración</span>
            <small>Usuarios y accesos</small>
          </button>
        ) : null}

        {canAccessChronicles ? (
          <button type="button" aria-current={activeSection === 'play' ? 'page' : undefined} onClick={() => selectSection('play')}><span>Jugar</span><small>Mesa de juego</small></button>
        ) : null}

        {canCreateChronicles ? (
          <button type="button" aria-current={activeSection === 'resources' ? 'page' : undefined} onClick={() => selectSection('resources')}><span>Recursos</span><small>Biblioteca reutilizable</small></button>
        ) : null}

        {canAccessChronicles ? (
          <button
            type="button"
            aria-current={activeSection === 'notebook' ? 'page' : undefined}
            onClick={() => selectSection('notebook')}
          >
            <span>Cuaderno</span>
            <small>Notas y referencias</small>
          </button>
        ) : null}
        {/* NOTEBOOK_CONTEXTUAL_NAV_V1 */}
        {activeSection === 'notebook' ? <div className="app-navigation__notebook-subnav" aria-label="Secciones del Cuaderno">{[
          ['ALL', 'Resumen'], ['ALL', 'Notas'], ['SESSION', 'Sesiones'], ['TAGS', 'Etiquetas'], ['NPC', 'PNJ'], ['LOCATION', 'Localizaciones'], ['ORGANIZATION', 'Organizaciones'], ['ARTIFACT', 'Artefactos'], ['DOCUMENT', 'Documentos'],
        ].map(([section, label]) => <button type="button" key={label} onClick={() => window.dispatchEvent(new CustomEvent('bloodkeeper:notebook-section', { detail: { section, label } }))}>{label}</button>)}</div> : null}

        {canAccessChronicles ? (
          <button
            type="button"
            aria-current={
              activeSection === 'chronicles'
                ? 'page'
                : undefined
            }
            onClick={() =>
              selectSection('chronicles')
            }
          >
            <span>Crónicas</span>
            <small>Participación y gestión</small>
          </button>
        ) : null}
      </nav>
    </aside>
  )
}
