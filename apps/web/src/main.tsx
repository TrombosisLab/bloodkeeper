import React, {
  useEffect,
  useState,
} from 'react'
import ReactDOM from 'react-dom/client'

import { AppHeader } from './components/layout/AppHeader'
import { AuthenticationGate } from './features/authentication/components/AuthenticationGate'
import { useAuthenticatedUser } from './features/authentication/context/authentication.context'
import { CharacterCreationWizard } from './features/character-creation/components/CharacterCreationWizard'
import { CharacterSheet } from './features/character-sheet/components/CharacterSheet'
import { PersistedCharacterSheet } from './features/character-sheet/components/PersistedCharacterSheet'
import { ChronicleListCreate } from './features/chronicles/components/ChronicleListCreate'
import { AppBreadcrumbs } from './features/navigation/components/AppBreadcrumbs'
import { AppNavigation } from './features/navigation/components/AppNavigation'
import {
  appViewFromHash,
  hashForAppView,
  sectionForAppView,
} from './features/navigation/domain/app-navigation-location'

import type {
  AppSection,
} from './features/navigation/types/app-navigation.types'

import './styles.css'

type AppView =
  | 'characters'
  | 'character-creation'
  | 'chronicles'

function App() {
  const authenticatedUser =
    useAuthenticatedUser()

  const canManageChronicles =
    authenticatedUser.roles.includes(
      'narrator',
    )

  const [view, setView] =
    useState<AppView>(() =>
      appViewFromHash(
        window.location.hash,
        {
          canManageChronicles,
        },
      ),
    )

  const [
    creationCharacterId,
    setCreationCharacterId,
  ] = useState<string | null>(null)

  useEffect(() => {
    const synchronizeLocation = () => {
      const synchronizedView =
        appViewFromHash(
          window.location.hash,
          {
            canManageChronicles,
          },
        )

      const canonicalHash =
        hashForAppView(
          synchronizedView,
        )

      setView(synchronizedView)

      if (
        window.location.hash !==
        canonicalHash
      ) {
        window.history.replaceState(
          null,
          '',
          canonicalHash,
        )
      }
    }

    synchronizeLocation()

    window.addEventListener(
      'hashchange',
      synchronizeLocation,
    )

    return () => {
      window.removeEventListener(
        'hashchange',
        synchronizeLocation,
      )
    }
  }, [canManageChronicles])

  function navigateTo(
    nextView: AppView,
  ) {
    const allowedView =
      appViewFromHash(
        hashForAppView(nextView),
        {
          canManageChronicles,
        },
      )

    const nextHash =
      hashForAppView(allowedView)

    if (
      window.location.hash ===
      nextHash
    ) {
      setView(allowedView)
      return
    }

    window.location.hash = nextHash
  }

  function navigateToSection(
    section: AppSection,
  ) {
    navigateTo(
      section === 'chronicles'
        ? 'chronicles'
        : 'characters',
    )
  }

  return (
    <div className="application">
      <AppHeader />

      <div className="application-shell">
        <AppNavigation
          aria-label="Secciones principales"
          activeSection={
            sectionForAppView(view)
          }
          canManageChronicles={
            canManageChronicles
          }
          onNavigate={
            navigateToSection
          }
        />

        <div className="application-shell__content">
          {view === 'character-creation' ? (
            <AppBreadcrumbs
              onNavigateCharacters={() =>
                navigateTo('characters')
              }
            />
          ) : null}

          {view === 'chronicles' &&
          canManageChronicles ? (
            <ChronicleListCreate />
          ) : view === 'characters' ? (
            <main className="application-content">
              <div className="sheet-toolbar">
                <div>
                  <span className="sheet-toolbar__eyebrow">
                    Personajes
                  </span>

                  <strong>
                    {creationCharacterId === null
                      ? 'Ficha de demostración'
                      : 'Personaje persistido'}
                  </strong>
                </div>

                <button
                  type="button"
                  className="sheet-toolbar__action"
                  onClick={() =>
                    navigateTo(
                      'character-creation',
                    )
                  }
                >
                  {creationCharacterId === null
                    ? 'Crear personaje'
                    : 'Continuar creación'}
                </button>
              </div>

              {creationCharacterId === null ? (
                <CharacterSheet />
              ) : (
                <PersistedCharacterSheet
                  characterId={creationCharacterId}
                />
              )}
            </main>
          ) : (
            <CharacterCreationWizard
              characterId={creationCharacterId}
              onCharacterPersisted={setCreationCharacterId}
              onBackToSheet={() =>
                navigateTo('characters')
              }
            />
          )}
        </div>
      </div>
    </div>
  )
}

ReactDOM.createRoot(
  document.getElementById('root')!,
).render(
  <React.StrictMode>
    <AuthenticationGate>
      <App />
    </AuthenticationGate>
  </React.StrictMode>,
)
