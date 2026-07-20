import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles.css'

function App() {
  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">Plataforma local</p>

        <h1>Vampiro V5 Revolution</h1>

        <p className="subtitle">
          El primer esqueleto funcional está en marcha.
        </p>

        <div className="status-card">
          <span className="status-indicator" aria-hidden="true" />

          <div>
            <strong>Frontend operativo</strong>
            <p>MILESTONE-001 · Incremento 001-D</p>
          </div>
        </div>
      </section>
    </main>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
