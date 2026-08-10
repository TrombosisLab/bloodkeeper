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
