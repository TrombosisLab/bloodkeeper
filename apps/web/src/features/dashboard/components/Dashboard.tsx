import {
  useEffect,
  useState,
} from 'react'

import {
  ChronicleApiError,
  createChronicleGateway,
} from '../../chronicles/infrastructure/chronicle.api.ts'

import type {
  ChronicleGateway,
} from '../../chronicles/infrastructure/chronicle.api.ts'

import type {
  ChronicleApiSnapshot,
  ChronicleApiStatus,
} from '../../chronicles/types/chronicle-api.types.ts'

import './dashboard.css'
import { ViewStateStatus } from '../../../components/ui/ViewStateStatus'

interface DashboardProps {
  readonly displayName: string
  readonly canAccessChronicles: boolean
  readonly canCreateChronicles: boolean
  readonly onNavigateCharacters: () => void
  readonly onNavigateChronicles: () => void
  readonly gateway?: ChronicleGateway
}

const defaultGateway =
  createChronicleGateway()

const statusLabels:
  Readonly<Record<ChronicleApiStatus, string>> = {
    preparation: 'Preparación',
    active: 'Activa',
    archived: 'Archivada',
  }

const statusPriority:
  Readonly<Record<ChronicleApiStatus, number>> = {
    active: 0,
    preparation: 1,
    archived: 2,
  }

function relevantChronicles(
  chronicles: readonly ChronicleApiSnapshot[],
): readonly ChronicleApiSnapshot[] {
  return [...chronicles]
    .sort((left, right) => {
      const statusDifference =
        statusPriority[left.status] -
        statusPriority[right.status]

      if (statusDifference !== 0) {
        return statusDifference
      }

      return (
        Date.parse(right.updatedAt) -
        Date.parse(left.updatedAt)
      )
    })
    .slice(0, 3)
}

function chronicleErrorMessage(
  error: unknown,
): string {
  if (
    error instanceof ChronicleApiError &&
    (
      error.code ===
        'AUTHENTICATION_REQUIRED' ||
      error.code ===
        'CHRONICLE_PERMISSION_DENIED'
    )
  ) {
    return 'Tu sesión no permite consultar estas crónicas.'
  }

  return 'No se pudieron cargar tus crónicas.'
}

export function Dashboard({
  displayName,
  canAccessChronicles,
  canCreateChronicles,
  onNavigateCharacters,
  onNavigateChronicles,
  gateway = defaultGateway,
}: DashboardProps) {
  const [
    chronicles,
    setChronicles,
  ] = useState<
    readonly ChronicleApiSnapshot[]
  >([])

  const [loading, setLoading] =
    useState(canAccessChronicles)

  const [
    error,
    setError,
  ] = useState<string | null>(null)

  const [
    requestVersion,
    setRequestVersion,
  ] = useState(0)

  useEffect(() => {
    if (!canAccessChronicles) {
      setChronicles([])
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false

    async function loadChronicles() {
      setLoading(true)
      setError(null)

      try {
        const page =
          await gateway.listPage({
            limit: 3,
            offset: 0,
          })

        if (!cancelled) {
          setChronicles(
            relevantChronicles(
              page.items,
            ),
          )
        }
      } catch (loadError: unknown) {
        if (!cancelled) {
          setError(
            chronicleErrorMessage(
              loadError,
            ),
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadChronicles()

    return () => {
      cancelled = true
    }
  }, [
    canAccessChronicles,
    gateway,
    requestVersion,
  ])

  const chronicleViewState =
    loading
      ? 'loading'
      : error !== null
        ? 'error'
        : chronicles.length === 0
          ? 'empty'
          : 'content'

  return (
    <section
      className="dashboard"
      aria-labelledby="dashboard-title"
      data-view-state="content"
    >
      <header className="dashboard__header">
        <span className="dashboard__eyebrow">
          Inicio
        </span>

        <h1 id="dashboard-title">
          Bienvenido, {displayName}
        </h1>

        <p>
          Accede a las áreas disponibles y
          consulta la información útil para
          tu sesión.
        </p>
      </header>

      <div className="dashboard__grid">
        <section
          className="dashboard-panel"
          aria-labelledby="dashboard-characters-title"
        >
          <div className="dashboard-panel__heading">
            <div>
              <span>Acceso principal</span>
              <h2 id="dashboard-characters-title">
                Personajes
              </h2>
            </div>
          </div>

          <p>
            Abre la ficha de demostración,
            continúa un personaje persistido
            o inicia una nueva creación.
          </p>

          <button
            type="button"
            onClick={onNavigateCharacters}
          >
            Ir a Personajes
          </button>
        </section>

        {canAccessChronicles ? (
          <section
            className="dashboard-panel"
            aria-labelledby="dashboard-chronicles-title"
            aria-busy={loading}
          >
            <div className="dashboard-panel__heading">
              <div>
                <span>Tu participación</span>
                <h2 id="dashboard-chronicles-title">
                  Tus crónicas
                </h2>
              </div>

              <button
                type="button"
                onClick={onNavigateChronicles}
              >
                {canCreateChronicles
                  ? 'Gestionar'
                  : 'Abrir'}
              </button>
            </div>

            {chronicleViewState ===
            'loading' ? (
              <ViewStateStatus
                    state="loading"
                    className="dashboard-message"
                  >
                    Cargando crónicas…
                  </ViewStateStatus>
            ) : chronicleViewState ===
              'error' ? (
              <div
                className="dashboard-message dashboard-message--error"
                data-view-state="error"
                role="alert"
                aria-live="assertive"
              >
                <p>{error}</p>

                <button
                  type="button"
                  onClick={() =>
                    setRequestVersion(
                      (current) =>
                        current + 1,
                    )
                  }
                >
                  Reintentar
                </button>
              </div>
            ) : chronicleViewState ===
              'empty' ? (
              <ViewStateStatus
                    state="empty"
                    className="dashboard-message"
                  >
                    Todavía no participas en ninguna
                    crónica.
                  </ViewStateStatus>
            ) : (
              <ul className="dashboard-chronicles">
                {chronicles.map(
                  (chronicle) => (
                    <li key={chronicle.id}>
                      <article>
                        <div>
                          <h3>
                            {chronicle.name}
                          </h3>

                          <span>
                            {
                              statusLabels[
                                chronicle.status
                              ]
                            }
                          </span>
                        </div>

                        {chronicle.description !==
                        null ? (
                          <p>
                            {
                              chronicle.description
                            }
                          </p>
                        ) : (
                          <p className="dashboard-chronicles__empty">
                            Sin descripción.
                          </p>
                        )}
                      </article>
                    </li>
                  ),
                )}
              </ul>
            )}
          </section>
        ) : null}
      </div>
    </section>
  )
}
