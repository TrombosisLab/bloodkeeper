import {
  useEffect,
  useState,
} from 'react'

import type {
  FormEvent,
} from 'react'

import {
  ChronicleApiError,
  createChronicleGateway,
} from '../infrastructure/chronicle.api.ts'

import type {
  ChronicleApiSnapshot,
  ChronicleApiStatus,
} from '../types/chronicle-api.types.ts'

import './chronicle-list-create.css'

const gateway =
  createChronicleGateway()

const statusLabels:
  Record<ChronicleApiStatus, string> = {
    preparation: 'Preparación',
    active: 'Activa',
    archived: 'Archivada',
  }

type ChronicleFailureState =
  | 'error'
  | 'permission'

function stateForChronicleError(
  error: unknown,
): ChronicleFailureState {
  if (
    error instanceof ChronicleApiError &&
    error.code ===
      'AUTHENTICATION_REQUIRED'
  ) {
    return 'permission'
  }

  return 'error'
}

function errorMessage(
  error: unknown,
): string {
  if (
    error instanceof ChronicleApiError
  ) {
    if (
      error.code ===
      'AUTHENTICATION_REQUIRED'
    ) {
      return 'Necesitas una sesión válida para gestionar crónicas.'
    }

    if (
      error.code ===
      'CHRONICLE_RULE_VIOLATION'
    ) {
      return 'Revisa los datos de la crónica.'
    }
  }

  return 'No se pudo completar la operación.'
}

export function ChronicleListCreate() {
  const [
    chronicles,
    setChronicles,
  ] = useState<
    readonly ChronicleApiSnapshot[]
  >([])
  const [name, setName] =
    useState('')
  const [
    description,
    setDescription,
  ] = useState('')
  const [loading, setLoading] =
    useState(true)
  const [
    submitting,
    setSubmitting,
  ] = useState(false)
  const [
    error,
    setError,
  ] = useState<string | null>(null)

  const [
    failureState,
    setFailureState,
  ] = useState<ChronicleFailureState | null>(
    null,
  )

  async function loadChronicles() {
    setLoading(true)
    setError(null)
    setFailureState(null)

    try {
      setChronicles(
        await gateway.list(),
      )
    } catch (loadError: unknown) {
      setFailureState(
        stateForChronicleError(
          loadError,
        ),
      )
      setError(
        errorMessage(loadError),
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadChronicles()
  }, [])

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    setFailureState(null)

    try {
      const created =
        await gateway.create({
          name,
          description:
            description.trim().length === 0
              ? null
              : description,
        })

      setChronicles((current) => [
        created,
        ...current.filter(
          (chronicle) =>
            chronicle.id !== created.id,
        ),
      ])
      setName('')
      setDescription('')
    } catch (creationError: unknown) {
      setFailureState(
        stateForChronicleError(
          creationError,
        ),
      )
      setError(
        errorMessage(creationError),
      )
    } finally {
      setSubmitting(false)
    }
  }

  const viewState =
    loading
      ? 'loading'
      : error !== null
        ? failureState ?? 'error'
        : chronicles.length === 0
          ? 'empty'
          : 'content'

  return (
    <section className="chronicle-workspace">
      <header className="chronicle-workspace__header">
        <div>
          <span className="chronicle-workspace__eyebrow">
            Crónicas
          </span>
          <h1>Gestión inicial</h1>
          <p>
            Crea una crónica y consulta las que
            gestionas como narrador.
          </p>
        </div>
      </header>

      <div className="chronicle-workspace__grid">
        <section
          className="chronicle-create"
          aria-labelledby="chronicle-create-title"
        >
          <h2 id="chronicle-create-title">
            Nueva crónica
          </h2>

          <form onSubmit={submit}>
            <label>
              <span>Nombre</span>
              <input
                name="chronicleName"
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value,
                  )
                }
                required
                autoComplete="off"
              />
            </label>

            <label>
              <span>Descripción o premisa</span>
              <textarea
                name="chronicleDescription"
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value,
                  )
                }
                rows={5}
              />
            </label>

            <button
              type="submit"
              disabled={
                submitting ||
                name.trim().length === 0
              }
            >
              {submitting
                ? 'Creando…'
                : 'Crear crónica'}
            </button>
          </form>

          {error !== null ? (
            <p
              className="chronicle-message chronicle-message--error"
              data-view-state={
                failureState ?? 'error'
              }
              role="alert"
              aria-live="assertive"
            >
              {error}
            </p>
          ) : null}
        </section>

        <section
          className="chronicle-list"
          aria-labelledby="chronicle-list-title"
        >
          <div className="chronicle-list__heading">
            <h2 id="chronicle-list-title">
              Tus crónicas
            </h2>

            <button
              type="button"
              onClick={() =>
                void loadChronicles()
              }
              disabled={loading}
            >
              Actualizar
            </button>
          </div>

          {loading ? (
            <p
              className="chronicle-message"
              data-view-state="loading"
              role="status"
              aria-live="polite"
            >
              Cargando crónicas…
            </p>
          ) : chronicles.length === 0 ? (
            <p
              className="chronicle-message"
              data-view-state="empty"
              role="status"
              aria-live="polite"
            >
              Todavía no has creado ninguna crónica.
            </p>
          ) : (
            <ul className="chronicle-cards">
              {chronicles.map(
                (chronicle) => (
                  <li key={chronicle.id}>
                    <article className="chronicle-card">
                      <div className="chronicle-card__heading">
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
                        <p className="chronicle-card__empty">
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
      </div>
    </section>
  )
}
