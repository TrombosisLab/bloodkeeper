// LEGACY_NOTEBOOK_NAV_HIDDEN_V1: la ruta y los datos del Cuaderno se conservan; solo se oculta su acceso visual.
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
          <button type="button" aria-current={activeSection === 'map' ? 'page' : undefined} onClick={() => selectSection('map')}><span>Mapa</span><small>Cartografía de la crónica</small></button>
        ) : null}




        {canAccessChronicles ? (
          <button
            type="button"
            aria-current={activeSection === 'chronicle-space' ? 'page' : undefined}
            onClick={() => selectSection('chronicle-space')}
          >
            <span>Sala de Investigación</span>
            <small>Pizarra, cronología y archivo</small>
          </button>
        ) : null}

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
            <button
        type="button"
        aria-current={activeSection === 'manual' ? 'page' : undefined}
        onClick={() => selectSection('manual')}
      >
        <span>Manual</span>
        <small>Guía de uso</small>
      </button>
</nav>
    </aside>
  )
}

// UNIFIED_DASHBOARD_HEADER_V2

// RESEARCH_ROOM_NAVIGATION_V1
