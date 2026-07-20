import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import './styles.css'

type SystemState =
  | { state: 'loading' }
  | {
      state: 'healthy'
      application: string
      database: string
    }
  | { state: 'error' }

interface HealthResponse {
  status: 'ok'
  service: 'api'
  database: 'ok'
  application: string
  timestamp: string
}

function App() {
  const [system, setSystem] =
    useState<SystemState>({ state: 'loading' })

  useEffect(() => {
    let active = true

    async function checkSystem(): Promise<void> {
      try {
        const response = await fetch('/api/health')

        if (!response.ok) {
          throw new Error('Health check failed')
        }

        const data =
          (await response.json()) as HealthResponse

        if (active) {
          setSystem({
            state: 'healthy',
            application: data.application,
            database: data.database,
          })
        }
      } catch {
        if (active) {
          setSystem({ state: 'error' })
        }
      }
    }

    void checkSystem()

    return () => {
      active = false
    }
  }, [])

  const healthy = system.state === 'healthy'

  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">
          Plataforma local
        </p>

        <h1>Vampiro V5 Revolution</h1>

        <p className="subtitle">
          Esqueleto funcional del proyecto.
        </p>

        <div
          className={`status-card ${
            system.state === 'error'
              ? 'status-card--error'
              : ''
          }`}
        >
          <span
            className={`status-indicator ${
              system.state === 'loading'
                ? 'status-indicator--loading'
                : system.state === 'error'
                  ? 'status-indicator--error'
                  : ''
            }`}
            aria-hidden="true"
          />

          <div>
            {system.state === 'loading' && (
              <>
                <strong>
                  Comprobando sistema…
                </strong>
                <p>
                  Conectando con la API.
                </p>
              </>
            )}

            {healthy && (
              <>
                <strong>
                  Sistema operativo
                </strong>
                <p>
                  Frontend · API · PostgreSQL
                </p>
              </>
            )}

            {system.state === 'error' && (
              <>
                <strong>
                  Sistema no disponible
                </strong>
                <p>
                  No se ha podido validar la API.
                </p>
              </>
            )}
          </div>
        </div>

        {healthy && (
          <div className="services">
            <div>
              <span>Frontend</span>
              <strong>Operativo</strong>
            </div>

            <div>
              <span>API</span>
              <strong>Operativa</strong>
            </div>

            <div>
              <span>Base de datos</span>
              <strong>
                {system.database === 'ok'
                  ? 'Operativa'
                  : 'No disponible'}
              </strong>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

ReactDOM.createRoot(
  document.getElementById('root')!,
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
