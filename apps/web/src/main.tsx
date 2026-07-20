import React from 'react'
import ReactDOM from 'react-dom/client'

import { AppHeader } from './components/layout/AppHeader'
import { CharacterSheet } from './features/character-sheet/components/CharacterSheet'

import './styles.css'

function App() {
  return (
    <div className="application">
      <AppHeader />

      <main className="application-content">
        <CharacterSheet />
      </main>
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
