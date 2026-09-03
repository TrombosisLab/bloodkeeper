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
import { ViewStateStatus } from '../../../components/ui/ViewStateStatus'

import { ChronicleDetail } from './ChronicleDetail'

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
    (
      error.code ===
        'AUTHENTICATION_REQUIRED' ||
      error.code ===
        'CHRONICLE_PERMISSION_DENIED'
    )
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
        'CHRONICLE_PERMISSION_DENIED'
    ) {
      return 'No tienes permiso para gestionar crónicas.'
    }

    if (
      error.code ===
        'CHRONICLE_RULE_VIOLATION'
    ) {
      return 'Revisa los datos de la crónica.'
    }

    if (
      error.code ===
        'CHRONICLE_LIFECYCLE_TRANSITION_REJECTED'
    ) {
      return 'El cambio de estado solicitado no está permitido.'
    }

    if (
      error.code ===
        'CHRONICLE_LIFECYCLE_WRITE_CONFLICT'
    ) {
      return 'La crónica cambió mientras la estabas editando. Actualiza el listado.'
    }
  }

  return 'No se pudo completar la operación.'
}

interface ChronicleListCreateProps {
  readonly canCreateChronicles: boolean
  readonly onOpenCharacter?: (characterId: string) => void
}

export function ChronicleListCreate({
  canCreateChronicles,
  onOpenCharacter,
}: ChronicleListCreateProps) {
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
  const [
    chroniclesNextOffset,
    setChroniclesNextOffset,
  ] = useState<number | null>(null)

  const [
    loadingMore,
    setLoadingMore,
  ] = useState(false)

  const [loading, setLoading] =
    useState(true)
  const [
    submitting,
    setSubmitting,
  ] = useState(false)
  const [
    selectedChronicleId,
    setSelectedChronicleId,
  ] = useState<string | null>(null)
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
      const page =
        await gateway.listPage({
          limit: 25,
          offset: 0,
        })

      setChronicles(page.items)
      setChroniclesNextOffset(
        page.nextOffset,
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

  async function loadMoreChronicles() {
    if (
      chroniclesNextOffset === null ||
      loadingMore
    ) {
      return
    }

    setLoadingMore(true)
    setError(null)
    setFailureState(null)

    try {
      const page =
        await gateway.listPage({
          limit: 25,
          offset:
            chroniclesNextOffset,
        })

      setChronicles(
        (current) => [
          ...current,
          ...page.items,
        ],
      )
      setChroniclesNextOffset(
        page.nextOffset,
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
      setLoadingMore(false)
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
      await gateway.create({
        name,
        description:
          description.trim().length === 0
            ? null
            : description,
      })

      setName('')
      setDescription('')
      await loadChronicles()
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

  const habitualChronicles =
    chronicles.filter(
      (chronicle) =>
        chronicle.status !== 'archived',
    )
  const archivedChronicles =
    chronicles.filter(
      (chronicle) =>
        chronicle.status === 'archived',
    )

  const viewState =
    loading
      ? 'loading'
      : error !== null
        ? failureState ?? 'error'
        : chronicles.length === 0
          ? 'empty'
          : 'content'

  function renderChronicle(
    chronicle: ChronicleApiSnapshot,
  ) {

    return (
      <li key={chronicle.id}>
        <article className="chronicle-card">
          <div className="chronicle-card__cover" aria-hidden="true">
            <span>V5</span>
            <img src={'/api/chronicles/' + chronicle.id + '/cover'} alt="" onError={(event) => { event.currentTarget.style.display = 'none' }} />
          </div>

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

          <div className="chronicle-card__actions">
            <button
              type="button"
              onClick={() =>
                setSelectedChronicleId(
                  chronicle.id,
                )
              }
            >
              Abrir crónica
            </button>

          </div>
        </article>
      </li>
    )
  }

  if (selectedChronicleId !== null) {
    return (
      <ChronicleDetail
        chronicleId={selectedChronicleId}
        onOpenCharacter={onOpenCharacter}
        onBack={() =>
          setSelectedChronicleId(null)
        }
        onChronicleUpdated={(
          updated,
        ) =>
          setChronicles(
            (current) =>
              current.map(
                (chronicle) =>
                  chronicle.id ===
                  updated.id
                    ? updated
                    : chronicle,
              ),
          )
        }
      />
    )
  }

  return (
    <section className="chronicle-workspace">
      <header className="chronicle-workspace__header">
        <div>
          <span className="chronicle-workspace__eyebrow">
            Crónicas
          </span>
          <h1>Crónicas</h1>
          <p>
            Consulta las crónicas en las que
            participas y gestiona únicamente
            las acciones permitidas por tu rol.
          </p>
        </div>
      </header>

      <div className="chronicle-workspace__grid">
        {canCreateChronicles ? (
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
        ) : null}

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
            <ViewStateStatus
              state="loading"
              className="chronicle-message"
            >
              Cargando crónicas…
            </ViewStateStatus>
          ) : chronicles.length === 0 ? (
            <ViewStateStatus
              state="empty"
              className="chronicle-message"
            >
              Todavía no has creado ninguna crónica.
            </ViewStateStatus>
          ) : habitualChronicles.length === 0 ? (
            <ViewStateStatus
              state="empty"
              className="chronicle-message"
            >
              No hay crónicas activas o en preparación.
            </ViewStateStatus>
          ) : (
            <ul className="chronicle-cards">
              {habitualChronicles.map(
                renderChronicle,
              )}
            </ul>
          )}

          {!loading &&
          archivedChronicles.length > 0 ? (
            <section
              aria-labelledby="chronicle-archived-title"
            >
              <h2 id="chronicle-archived-title">
                Archivadas
              </h2>

              <ul className="chronicle-cards">
                {archivedChronicles.map(
                  renderChronicle,
                )}
              </ul>
            </section>
          ) : null}
        </section>
      </div>

        {!loading &&
        error === null &&
        chronicles.length > 0 &&
        chroniclesNextOffset !== null ? (
          <button
            type="button"
            onClick={() =>
              void loadMoreChronicles()
            }
            disabled={loadingMore}
          >
            {loadingMore
              ? 'Cargando más…'
              : 'Cargar más crónicas'}
          </button>
        ) : null}
</section>
  )
}
