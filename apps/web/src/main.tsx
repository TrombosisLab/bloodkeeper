import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'

import { AppHeader } from './components/layout/AppHeader'
import { CharacterCreationWizard } from './features/character-creation/components/CharacterCreationWizard'
import { CharacterSheet } from './features/character-sheet/components/CharacterSheet'

import './styles.css'

type AppView =
  | 'sheet'
  | 'creation'

function App() {
  const [view, setView] =
    useState<AppView>('sheet')

  const [
    creationCharacterId,
    setCreationCharacterId,
  ] = useState<string | null>(null)

  return (
    <div className="application">
      <AppHeader />

      {view === 'sheet' ? (
        <main className="application-content">
          <div className="sheet-toolbar">
            <div>
              <span className="sheet-toolbar__eyebrow">
                Personajes
              </span>

              <strong>
                Adrián Varela
              </strong>
            </div>

            <button
              type="button"
              className="sheet-toolbar__action"
              onClick={() => setView('creation')}
            >
              {creationCharacterId === null
                ? 'Crear personaje'
                : 'Continuar creación'}
            </button>
          </div>

          <CharacterSheet />
        </main>
      ) : (
        <CharacterCreationWizard
          characterId={creationCharacterId}
          onCharacterPersisted={
            setCreationCharacterId
          }
          onBackToSheet={() => setView('sheet')}
        />
      )}
    </div>
  )
}

ReactDOM.createRoot(
  document.getElementById('root')!,
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
