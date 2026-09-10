import React, {
  useEffect,
  useState,
} from 'react'
import ReactDOM from 'react-dom/client'

import { AdministrationHub } from './features/administration/components/AdministrationHub'
import { AppLayout } from './components/layout/AppLayout'
import { AppHeader } from './components/layout/AppHeader'
import { AuthenticationGate } from './features/authentication/components/AuthenticationGate'
import { useAuthenticatedUser } from './features/authentication/context/authentication.context'
import { CharacterCreationWizard } from './features/character-creation/components/CharacterCreationWizard'
import { CharacterList } from './features/character-list/components/CharacterList'
import { CharacterSheet } from './features/character-sheet/components/CharacterSheet'
import { PersistedCharacterSheet } from './features/character-sheet/components/PersistedCharacterSheet'
import { ChronicleListCreate } from './features/chronicles/components/ChronicleListCreate'
import { PlayHub } from './features/chronicles/components/PlayHub'
import { ResourceLibrary } from './features/resources/components/ResourceLibrary'
import { Dashboard } from './features/dashboard/components/Dashboard'
import { NotebookWorkspace } from './features/notebook/components/NotebookWorkspace'
import { AppBreadcrumbs } from './features/navigation/components/AppBreadcrumbs'
import { AppNavigation } from './features/navigation/components/AppNavigation'
import {
  appViewFromHash,
  hashForAppView,
  sectionForAppView,
} from './features/navigation/domain/app-navigation-location'

import type {
  AppSection,
  AppView,
} from './features/navigation/types/app-navigation.types'

import './styles.css'
import './styles/ui-foundations.css';
import './styles/chronicle-buttons.css';
import './styles/chronicle-surfaces.css';
import './styles/dashboard-surfaces.css';
import './styles/character-list-buttons.css';
import './styles/app-shell-responsive.css';
import './styles/bloodkeeper-visual-system.css';

import './styles/v5-visual-assets.css'
import './styles/primary-workspaces.css'
function App() {
  const authenticatedUser =
    useAuthenticatedUser()

  const canAccessAdministration = authenticatedUser?.roles.includes('admin') ?? false
  const canAccessChronicles = true

  const canCreateChronicles =
    authenticatedUser.roles.includes(
      'narrator',
    )

  const [view, setView] =
    useState<AppView>(() =>
      appViewFromHash(
        window.location.hash,
        {
          canAccessChronicles,
          canAccessAdministration,
        },
      ),
    )

  const [
    creationCharacterId,
    setCreationCharacterId,
  ] = useState<string | null>(null)

  const [
    showDemoSheet,
    setShowDemoSheet,
  ] = useState(false)

  useEffect(() => {
    const synchronizeLocation = () => {
      const synchronizedView =
        appViewFromHash(
          window.location.hash,
          {
            canAccessChronicles,
            canAccessAdministration,
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
  }, [canAccessChronicles, canAccessAdministration])

  function navigateTo(
    nextView: AppView,
  ) {
    const allowedView =
      appViewFromHash(
        hashForAppView(nextView),
        {
          canAccessChronicles,
          canAccessAdministration,
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
    switch (section) {
      case 'dashboard':
        navigateTo('dashboard')
        return

      case 'administration':
        navigateTo('administration')
        return

      case 'chronicles':
        navigateTo('chronicles')
        return

      case 'characters':
        navigateTo('characters')
        return

      case 'notebook':
        navigateTo('notebook')
        return

      case 'play':
        navigateTo('play')
        return

      case 'resources':
        navigateTo('resources')
    }
  }

  return (
    <AppLayout
      breadcrumbs={
        view === 'character-creation' ? (
          <AppBreadcrumbs
            onNavigateCharacters={() =>
              navigateTo('characters')
            }
          />
        ) : null
      }
      contentClassName={view === 'notebook' ? 'application-content application-content--notebook' : 'application-content'}
      header={<AppHeader displayName={authenticatedUser.displayName} />}
      navigation={
        <AppNavigation
          aria-label="Secciones principales"
          activeSection={
            sectionForAppView(view)
          }
          canAccessChronicles={
            canAccessChronicles
          }
          canAccessAdministration={
            canAccessAdministration
          }
          onNavigate={
            navigateToSection
          }

        canCreateChronicles={canCreateChronicles}
      />
      }
    >
      {view === 'resources' && canCreateChronicles ? (
        <ResourceLibrary />
      ) : view === 'play' && canAccessChronicles ? (
        <PlayHub onOpenCharacter={(characterId) => { setCreationCharacterId(characterId); setShowDemoSheet(false); navigateTo('characters') }} />
      ) : view === 'notebook' && canAccessChronicles ? (
        <NotebookWorkspace />
      ) : view === 'administration' && canAccessAdministration ? (
        <AdministrationHub />
      ) : view === 'dashboard' ? (
        <>
        <Dashboard
          displayName={
            authenticatedUser.displayName
          }
          canAccessChronicles={
            canAccessChronicles
          }
          canCreateChronicles={
            canCreateChronicles
          }
          onNavigateCharacters={() =>
            navigateTo('characters')
          }
          onNavigateChronicles={() =>
            navigateTo('chronicles')
          }
        />
        </>
      ) : view === 'chronicles' &&
        canAccessChronicles ? (
        <ChronicleListCreate
          canCreateChronicles={
            canCreateChronicles
          }
          onOpenCharacter={(characterId) => {
            setCreationCharacterId(characterId)
            setShowDemoSheet(false)
            navigateTo('characters')
          }}
        />
      ) : view === 'characters' ? (
        creationCharacterId === null &&
        !showDemoSheet ? (
          <CharacterList
            onOpenCharacter={(
              characterId,
            ) => {
              setCreationCharacterId(
                characterId,
              )
              setShowDemoSheet(false)
            }}
            onContinueCreation={(
              characterId,
            ) => {
              setCreationCharacterId(
                characterId,
              )
              setShowDemoSheet(false)
              navigateTo(
                'character-creation',
              )
            }}
            onCreateCharacter={() => {
              setCreationCharacterId(null)
              setShowDemoSheet(false)
              navigateTo(
                'character-creation',
              )
            }}
            onOpenDemo={() => {
              setCreationCharacterId(null)
              setShowDemoSheet(true)
            }}
          />
        ) : (
          <>
            <div className="sheet-toolbar">
              <div>
                <span className="sheet-toolbar__eyebrow">
                  Personajes
                </span>

                <strong>
                  {showDemoSheet
                    ? 'Ficha de demostración'
                    : 'Personaje persistido'}
                </strong>
              </div>

              <button
                type="button"
                className="sheet-toolbar__action"
                onClick={() => {
                  setCreationCharacterId(null)
                  setShowDemoSheet(false)
                }}
              >
                Volver a personajes
              </button>
            </div>

            {showDemoSheet ? (
              <CharacterSheet />
            ) : creationCharacterId !==
              null ? (
              <>
              <PersistedCharacterSheet
                characterId={
                  creationCharacterId
                }
              />
</>
            ) : null}
          </>
        )
      ) : view === 'character-creation' ? (
        <CharacterCreationWizard
          characterId={creationCharacterId}
          onCharacterPersisted={setCreationCharacterId}
          onBackToSheet={() =>
            navigateTo('characters')
          }
        />
      ) : null}
    </AppLayout>
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

// UNIFIED_DASHBOARD_HEADER_V1

// APPLICATION_CONTENT_ALL_PAGES_V2
