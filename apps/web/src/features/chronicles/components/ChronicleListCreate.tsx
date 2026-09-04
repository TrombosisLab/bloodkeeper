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

function dateLabel(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "Sin fecha"
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date)
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
  const [createOpen, setCreateOpen] = useState(false)
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

  const latestChronicle =
    habitualChronicles.length === 0
      ? null
      : [...habitualChronicles].sort(
          (left, right) =>
            new Date(right.updatedAt).getTime() -
            new Date(left.updatedAt).getTime(),
        )[0]
  const activeChronicleCount = chronicles.filter(
    (chronicle) => chronicle.status === "active",
  ).length
  const preparationChronicleCount = chronicles.filter(
    (chronicle) => chronicle.status === "preparation",
  ).length

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
        <article className={
          "chronicle-card chronicle-card--visual chronicle-card--" +
          chronicle.status
        }>
          <div className="chronicle-card__cover" aria-hidden="true">
            <span>V5</span>
            <img
              src={"/api/chronicles/" + chronicle.id + "/cover"}
              alt=""
              onError={(event) => {
                event.currentTarget.style.display = "none"
              }}
            />
          </div>

          <div className="chronicle-card__body">
            <div className="chronicle-card__heading">
              <div>
                <span className={
                  "chronicle-card__status chronicle-card__status--" +
                  chronicle.status
                }>
                  {statusLabels[chronicle.status]}
                </span>
                <h3>{chronicle.name}</h3>
              </div>
              <span className="chronicle-card__arrow" aria-hidden="true">
                →
              </span>
            </div>

            {chronicle.description !== null ? (
              <p>{chronicle.description}</p>
            ) : (
              <p className="chronicle-card__empty">
                Sin descripción.
              </p>
            )}

            <div className="chronicle-card__meta">
              <span>
                Actualizada <strong>{dateLabel(chronicle.updatedAt)}</strong>
              </span>
              <span>
                Estado <strong>{statusLabels[chronicle.status]}</strong>
              </span>
            </div>
          </div>

          <div className="chronicle-card__actions">
            <button
              type="button"
              onClick={() =>
                setSelectedChronicleId(chronicle.id)
              }
            >
              Abrir crónica <span aria-hidden="true">→</span>
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
            Gestiona tus partidas y continúa donde lo dejaste.
          </p>
        </div>

        {canCreateChronicles ? (
          <button
            type="button"
            className="chronicle-workspace__primary-action"
            aria-expanded={createOpen}
            aria-controls="chronicle-create-panel"
            onClick={() => setCreateOpen((current) => !current)}
          >
            + Nueva crónica
          </button>
        ) : null}
      </header>

      <section className="chronicle-overview" aria-label="Resumen de crónicas">
        <div className="chronicle-overview__stat">
          <span>Crónicas</span>
          <strong>{chronicles.length}</strong>
        </div>
        <div className="chronicle-overview__stat chronicle-overview__stat--active">
          <span>Activas</span>
          <strong>{activeChronicleCount}</strong>
        </div>
        <div className="chronicle-overview__stat chronicle-overview__stat--preparation">
          <span>En preparación</span>
          <strong>{preparationChronicleCount}</strong>
        </div>
      </section>

      {latestChronicle !== null ? (
        <section className="chronicle-continue" aria-labelledby="chronicle-continue-title">
          <div className="chronicle-continue__cover" aria-hidden="true">
            <span>V5</span>
            <img
              src={"/api/chronicles/" + latestChronicle.id + "/cover"}
              alt=""
              onError={(event) => {
                event.currentTarget.style.display = "none"
              }}
            />
          </div>
          <div className="chronicle-continue__body">
            <span className="chronicle-workspace__eyebrow">
              Continuar donde lo dejaste
            </span>
            <h2 id="chronicle-continue-title">
              {latestChronicle.name}
              <span> · Última actualización {dateLabel(latestChronicle.updatedAt)}</span>
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setSelectedChronicleId(latestChronicle.id)}
          >
            Entrar en crónica <span aria-hidden="true">→</span>
          </button>
        </section>
      ) : null}

      {canCreateChronicles && createOpen ? (
        <section
          id="chronicle-create-panel"
          className="chronicle-create"
          aria-labelledby="chronicle-create-title"
        >
          <div className="chronicle-create__heading">
            <div>
              <h2 id="chronicle-create-title">Nueva crónica</h2>
              <p>Añade una crónica y empieza a organizar tu partida.</p>
            </div>
            <button
              type="button"
              className="chronicle-create__close"
              onClick={() => setCreateOpen(false)}
            >
              Cerrar
            </button>
          </div>

          <form onSubmit={submit}>
            <label>
              <span>Nombre</span>
              <input
                name="chronicleName"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                autoComplete="off"
              />
            </label>

            <label>
              <span>Descripción o premisa</span>
              <textarea
                name="chronicleDescription"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
              />
            </label>

            <button
              type="submit"
              disabled={submitting || name.trim().length === 0}
            >
              {submitting ? "Creando…" : "Crear crónica"}
            </button>
          </form>

          {error !== null ? (
            <p
              className="chronicle-message chronicle-message--error"
              data-view-state={failureState ?? "error"}
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
          <div>
            <span className="chronicle-workspace__eyebrow">Tus partidas</span>
            <h2 id="chronicle-list-title">Tus crónicas</h2>
          </div>
          <button
            type="button"
            onClick={() => void loadChronicles()}
            disabled={loading}
          >
            Actualizar
          </button>
        </div>

        {loading ? (
          <ViewStateStatus state="loading" className="chronicle-message">
            Cargando crónicas…
          </ViewStateStatus>
        ) : chronicles.length === 0 ? (
          <ViewStateStatus state="empty" className="chronicle-message">
            Todavía no has creado ninguna crónica.
          </ViewStateStatus>
        ) : habitualChronicles.length === 0 ? (
          <ViewStateStatus state="empty" className="chronicle-message">
            No hay crónicas activas o en preparación.
          </ViewStateStatus>
        ) : (
          <ul className="chronicle-cards">
            {habitualChronicles.map(renderChronicle)}
          </ul>
        )}

        {!loading && archivedChronicles.length > 0 ? (
          <section
            className="chronicle-archived"
            aria-labelledby="chronicle-archived-title"
          >
            <div className="chronicle-list__heading">
              <h2 id="chronicle-archived-title">Archivadas</h2>
            </div>
            <ul className="chronicle-cards">
              {archivedChronicles.map(renderChronicle)}
            </ul>
          </section>
        ) : null}
      </section>

      {!loading &&
      error === null &&
      chronicles.length > 0 &&
      chroniclesNextOffset !== null ? (
        <button
          type="button"
          className="chronicle-load-more"
          onClick={() => void loadMoreChronicles()}
          disabled={loadingMore}
        >
          {loadingMore ? "Cargando más…" : "Cargar más crónicas"}
        </button>
      ) : null}
    </section>
  )

}
