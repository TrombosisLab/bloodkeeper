import {
  useEffect,
  useState,
} from 'react'

import type {
  FormEvent,
} from 'react'

import {
  ViewStateStatus,
} from '../../../components/ui/ViewStateStatus'

import {
  ChronicleApiError,
  createChronicleGateway,
} from '../infrastructure/chronicle.api.ts'

import type {
  ChronicleEventApiSnapshot,
  ChronicleLocationApiSnapshot,
  ChronicleNpcApiSnapshot,
  ChronicleSessionApiSnapshot,
  ChronicleSessionContextApiSnapshot,
  ChronicleSessionContextEventApiSnapshot,
  ChronicleSessionContextLocationApiSnapshot,
  ChronicleSessionContextNpcApiSnapshot,
} from '../types/chronicle-api.types.ts'

import './chronicle-session-context-panel.css'

const gateway =
  createChronicleGateway()

interface ChronicleSessionContextPanelProps {
  readonly chronicleId: string
  readonly session:
    ChronicleSessionApiSnapshot
}

interface ContextOption {
  readonly id: string
  readonly label: string
  readonly detail: string | null
  readonly status:
    | 'active'
    | 'archived'
}

function contextErrorMessage(
  error: unknown,
): string {
  if (
    error instanceof ChronicleApiError
  ) {
    switch (error.code) {
      case 'CHRONICLE_SESSION_PERMISSION_DENIED':
        return 'Sólo un Narrador activo de la crónica puede consultar este contexto.'

      case 'CHRONICLE_SESSION_NOT_FOUND':
        return 'La Sesión ya no está disponible.'

      case 'CHRONICLE_SESSION_CONTEXT_REFERENCE_INVALID':
        return 'Algún recurso seleccionado ya no pertenece a esta crónica.'

      case 'CHRONICLE_SESSION_CONTEXT_NOT_EDITABLE':
        return 'El contexto de una Sesión archivada es sólo de consulta.'

      case 'INVALID_CHRONICLE_SESSION_CONTEXT_REQUEST':
        return 'No se pudo guardar la selección de recursos.'

      case 'AUTHENTICATION_REQUIRED':
        return 'Necesitas una sesión autenticada válida.'
    }
  }

  return 'No se pudo cargar o guardar el contexto de la Sesión.'
}

async function loadAllNpcs(
  chronicleId: string,
): Promise<
  readonly ChronicleNpcApiSnapshot[]
> {
  const items:
    ChronicleNpcApiSnapshot[] = []

  let nextOffset:
    number | null = 0

  while (nextOffset !== null) {
    const page =
      await gateway.npcs(
        chronicleId,
        {
          limit: 50,
          offset: nextOffset,
        },
      )

    items.push(
      ...page.items,
    )

    nextOffset =
      page.nextOffset
  }

  return items
}

function mergeOptions(
  activeOptions:
    readonly ContextOption[],
  linkedOptions:
    readonly ContextOption[],
): readonly ContextOption[] {
  const merged =
    new Map<string, ContextOption>()

  for (
    const option
    of activeOptions
  ) {
    merged.set(
      option.id,
      option,
    )
  }

  for (
    const option
    of linkedOptions
  ) {
    merged.set(
      option.id,
      option,
    )
  }

  return [
    ...merged.values(),
  ]
}

function eventOption(
  event:
    ChronicleEventApiSnapshot |
    ChronicleSessionContextEventApiSnapshot,
): ContextOption {
  return {
    id: event.id,
    label: event.title,
    detail:
      event.narrativeTimeLabel ??
      (
        event.realDate === null
          ? null
          : new Intl.DateTimeFormat(
              'es-ES',
              {
                dateStyle: 'medium',
              },
            ).format(
              new Date(
                event.realDate,
              ),
            )
      ),
    status: event.status,
  }
}

function npcOption(
  npc:
    ChronicleNpcApiSnapshot |
    ChronicleSessionContextNpcApiSnapshot,
): ContextOption {
  return {
    id: npc.id,
    label: npc.name,
    detail:
      npc.category ??
      npc.narrativeRole,
    status: npc.status,
  }
}

function locationOption(
  location:
    ChronicleLocationApiSnapshot |
    ChronicleSessionContextLocationApiSnapshot,
): ContextOption {
  return {
    id: location.id,
    label: location.name,
    detail:
      location.category,
    status: location.status,
  }
}

function selected(
  ids: readonly string[],
  id: string,
): boolean {
  return ids.includes(id)
}

function toggledIds(
  ids: readonly string[],
  id: string,
): readonly string[] {
  return selected(
    ids,
    id,
  )
    ? ids.filter(
        (candidate) =>
          candidate !== id,
      )
    : [
        ...ids,
        id,
      ]
}

export function ChronicleSessionContextPanel({
  chronicleId,
  session,
}: ChronicleSessionContextPanelProps) {
  const [
    context,
    setContext,
  ] = useState<
    ChronicleSessionContextApiSnapshot | null
  >(null)

  const [
    eventOptions,
    setEventOptions,
  ] = useState<
    readonly ContextOption[]
  >([])

  const [
    npcOptions,
    setNpcOptions,
  ] = useState<
    readonly ContextOption[]
  >([])

  const [
    locationOptions,
    setLocationOptions,
  ] = useState<
    readonly ContextOption[]
  >([])

  const [
    eventIds,
    setEventIds,
  ] = useState<
    readonly string[]
  >([])

  const [
    npcIds,
    setNpcIds,
  ] = useState<
    readonly string[]
  >([])

  const [
    locationIds,
    setLocationIds,
  ] = useState<
    readonly string[]
  >([])

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    saving,
    setSaving,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null)

  const readOnly =
    session.status ===
    'archived'

  useEffect(() => {
    let cancelled = false

    async function loadContext() {
      setLoading(true)
      setError(null)

      try {
        const [
          loadedContext,
          events,
          npcs,
          locations,
        ] =
          await Promise.all([
            gateway.sessionContext(
              chronicleId,
              session.id,
            ),
            gateway.events(
              chronicleId,
            ),
            loadAllNpcs(
              chronicleId,
            ),
            gateway.locations(
              chronicleId,
            ),
          ])

        if (cancelled) {
          return
        }

        setContext(
          loadedContext,
        )

        setEventIds(
          loadedContext.events.map(
            (event) =>
              event.id,
          ),
        )
        setNpcIds(
          loadedContext.npcs.map(
            (npc) =>
              npc.id,
          ),
        )
        setLocationIds(
          loadedContext.locations.map(
            (location) =>
              location.id,
          ),
        )

        setEventOptions(
          mergeOptions(
            events
              .filter(
                (event) =>
                  event.status ===
                  'active',
              )
              .map(eventOption),
            loadedContext.events
              .filter(
                (event) =>
                  event.status ===
                  'archived',
              )
              .map(eventOption),
          ),
        )

        setNpcOptions(
          mergeOptions(
            npcs
              .filter(
                (npc) =>
                  npc.status ===
                  'active',
              )
              .map(npcOption),
            loadedContext.npcs
              .filter(
                (npc) =>
                  npc.status ===
                  'archived',
              )
              .map(npcOption),
          ),
        )

        setLocationOptions(
          mergeOptions(
            locations
              .filter(
                (location) =>
                  location.status ===
                  'active',
              )
              .map(
                locationOption,
              ),
            loadedContext.locations
              .filter(
                (location) =>
                  location.status ===
                  'archived',
              )
              .map(
                locationOption,
              ),
          ),
        )
      } catch (
        operationError: unknown
      ) {
        if (!cancelled) {
          setError(
            contextErrorMessage(
              operationError,
            ),
          )
          setContext(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadContext()

    return () => {
      cancelled = true
    }
  }, [
    chronicleId,
    session.id,
    session.status,
  ])

  async function saveContext(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (readOnly) {
      return
    }

    setSaving(true)
    setError(null)

    try {
      const updated =
        await gateway.replaceSessionContext(
          chronicleId,
          session.id,
          {
            eventIds,
            npcIds,
            locationIds,
          },
        )

      setContext(updated)
      setEventIds(
        updated.events.map(
          (item) =>
            item.id,
        ),
      )
      setNpcIds(
        updated.npcs.map(
          (item) =>
            item.id,
        ),
      )
      setLocationIds(
        updated.locations.map(
          (item) =>
            item.id,
        ),
      )
    } catch (
      operationError: unknown
    ) {
      setError(
        contextErrorMessage(
          operationError,
        ),
      )
    } finally {
      setSaving(false)
    }
  }

  function optionList(
    options:
      readonly ContextOption[],
    ids: readonly string[],
    setIds: (
      next:
        readonly string[],
    ) => void,
    emptyLabel: string,
  ) {
    if (options.length === 0) {
      return (
        <p className="chronicle-session-context-panel__empty">
          {emptyLabel}
        </p>
      )
    }

    return (
      <div className="chronicle-session-context-panel__options">
        {options.map(
          (option) => (
            <label
              key={option.id}
              className={
                'chronicle-session-context-panel__option ' +
                (
                  option.status ===
                  'archived'
                    ? 'chronicle-session-context-panel__option--archived'
                    : ''
                )
              }
            >
              <input
                type="checkbox"
                checked={
                  selected(
                    ids,
                    option.id,
                  )
                }
                onChange={() =>
                  setIds(
                    toggledIds(
                      ids,
                      option.id,
                    ),
                  )
                }
              />

              <span>
                <strong>
                  {option.label}
                </strong>

                {option.detail !==
                null ? (
                  <small>
                    {option.detail}
                  </small>
                ) : null}
              </span>

              {option.status ===
              'archived' ? (
                <em>
                  Archivado
                </em>
              ) : null}
            </label>
          ),
        )}
      </div>
    )
  }

  return (
    <section
      className="chronicle-session-context-panel"
      aria-labelledby={`chronicle-session-context-${session.id}`}
    >
      <div className="chronicle-session-context-panel__heading">
        <div>
          <span>
            Preparación privada del Narrador
          </span>
          <h4
            id={`chronicle-session-context-${session.id}`}
          >
            Contexto de la Sesión · Recursos preparados
          </h4>
        </div>

        <span className="chronicle-session-context-panel__count">
          {context === null
            ? '—'
            : (
                context.events.length +
                context.npcs.length +
                context.locations.length
              )}
        </span>
      </div>

      <div
        className="chronicle-session-context-panel__summary"
        aria-label="Resumen del contexto seleccionado"
      >
        <article
          className="chronicle-session-context-panel__summary-card chronicle-session-context-panel__summary-card--events"
        >
          <span>Eventos</span>
          <strong>
            {eventIds.length} seleccionados
          </strong>
          <small>
            {eventOptions.length} en el selector
          </small>
        </article>

        <article
          className="chronicle-session-context-panel__summary-card chronicle-session-context-panel__summary-card--npcs"
        >
          <span>PNJ</span>
          <strong>
            {npcIds.length} seleccionados
          </strong>
          <small>
            {npcOptions.length} en el selector
          </small>
        </article>

        <article
          className="chronicle-session-context-panel__summary-card chronicle-session-context-panel__summary-card--locations"
        >
          <span>Localizaciones</span>
          <strong>
            {locationIds.length} seleccionadas
          </strong>
          <small>
            {locationOptions.length} en el selector
          </small>
        </article>
      </div>

      {readOnly ? (
        <p className="chronicle-session-context-panel__notice">
          La Sesión está archivada. Sus recursos vinculados se conservan como historial y son sólo de consulta.
        </p>
      ) : null}

      {error !== null ? (
        <p
          className="chronicle-session-context-panel__error"
          role="alert"
          aria-live="assertive"
        >
          {error}
        </p>
      ) : null}

      {loading ? (
        <ViewStateStatus
          state="loading"
          className="chronicle-session-context-panel__message"
        >
          Cargando contexto…
        </ViewStateStatus>
      ) : context === null ? null : (
        <form
          className="chronicle-session-context-panel__form"
          onSubmit={saveContext}
        >
          <details className="chronicle-session-context-panel__resource-fold chronicle-session-context-panel__resource-fold--events">
            <summary><span>Eventos</span><strong>{eventIds.length} vinculados</strong><small>Abrir selector</small></summary>
<fieldset
            className="chronicle-session-context-panel__group chronicle-session-context-panel__group--events"
            disabled={
              readOnly ||
              saving
            }
          >
            <legend>
              <span>Eventos</span>
              <small>
                {eventIds.length} / {eventOptions.length}
              </small>
            </legend>

            {optionList(
              eventOptions,
              eventIds,
              setEventIds,
              'No hay Eventos activos disponibles.',
            )}
          </fieldset>
          </details>

          <details className="chronicle-session-context-panel__resource-fold chronicle-session-context-panel__resource-fold--npcs">
            <summary><span>PNJ</span><strong>{npcIds.length} vinculados</strong><small>Abrir selector</small></summary>
<fieldset
            className="chronicle-session-context-panel__group chronicle-session-context-panel__group--npcs"
            disabled={
              readOnly ||
              saving
            }
          >
            <legend>
              <span>PNJ</span>
              <small>
                {npcIds.length} / {npcOptions.length}
              </small>
            </legend>

            {optionList(
              npcOptions,
              npcIds,
              setNpcIds,
              'No hay PNJ activos disponibles.',
            )}
          </fieldset>
          </details>

          <details className="chronicle-session-context-panel__resource-fold chronicle-session-context-panel__resource-fold--locations">
            <summary><span>Localizaciones</span><strong>{locationIds.length} vinculados</strong><small>Abrir selector</small></summary>
<fieldset
            className="chronicle-session-context-panel__group chronicle-session-context-panel__group--locations"
            disabled={
              readOnly ||
              saving
            }
          >
            <legend>
              <span>Localizaciones</span>
              <small>
                {locationIds.length} / {locationOptions.length}
              </small>
            </legend>

            {optionList(
              locationOptions,
              locationIds,
              setLocationIds,
              'No hay Localizaciones activas disponibles.',
            )}
          </fieldset>
          </details>

          {!readOnly ? (
            <div className="chronicle-session-context-panel__footer">
              <p>
                Los cambios se aplican únicamente al contexto de esta sesión.
              </p>

              <button
                type="submit"
                disabled={saving}
              >
                {saving
                  ? 'Guardando contexto…'
                  : 'Guardar contexto'}
              </button>
            </div>
          ) : null}
        </form>
      )}
    </section>
  )
}
