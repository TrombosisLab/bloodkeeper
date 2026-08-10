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
  CreateChronicleEventApiRequest,
} from '../types/chronicle-api.types.ts'

import './chronicle-event-panel.css'

const gateway =
  createChronicleGateway()

interface ChronicleEventPanelProps {
  readonly chronicleId: string
}

interface EventFormState {
  readonly title: string
  readonly narrativeTimeLabel: string
  readonly realDate: string
  readonly description: string
  readonly narratorNotes: string
}

const emptyForm: EventFormState = {
  title: '',
  narrativeTimeLabel: '',
  realDate: '',
  description: '',
  narratorNotes: '',
}

const eventStatusLabels = {
  active: 'Activo',
  archived: 'Archivado',
} as const

function optionalText(
  value: string,
): string | null {
  const trimmed =
    value.trim()

  return trimmed.length === 0
    ? null
    : trimmed
}

function localDateTimeFromIso(
  value: string | null,
): string {
  if (value === null) {
    return ''
  }

  const date =
    new Date(value)

  const pad = (
    part: number,
  ) =>
    String(part).padStart(
      2,
      '0',
    )

  return (
    `${date.getFullYear()}-` +
    `${pad(date.getMonth() + 1)}-` +
    `${pad(date.getDate())}T` +
    `${pad(date.getHours())}:` +
    `${pad(date.getMinutes())}`
  )
}

function isoFromLocalDateTime(
  value: string,
): string | null {
  if (value.trim().length === 0) {
    return null
  }

  return new Date(value).toISOString()
}

function requestFromForm(
  form: EventFormState,
): CreateChronicleEventApiRequest {
  return {
    title: form.title.trim(),
    description:
      optionalText(form.description),
    narratorNotes:
      optionalText(
        form.narratorNotes,
      ),
    narrativeTimeLabel:
      optionalText(
        form.narrativeTimeLabel,
      ),
    realDate:
      isoFromLocalDateTime(
        form.realDate,
      ),
  }
}

function formFromEvent(
  event: ChronicleEventApiSnapshot,
): EventFormState {
  return {
    title: event.title,
    narrativeTimeLabel:
      event.narrativeTimeLabel ?? '',
    realDate:
      localDateTimeFromIso(
        event.realDate,
      ),
    description:
      event.description ?? '',
    narratorNotes:
      event.narratorNotes ?? '',
  }
}

function technicalDate(
  value: string,
): string {
  return new Intl.DateTimeFormat(
    'es-ES',
    {
      dateStyle: 'medium',
      timeStyle: 'short',
    },
  ).format(
    new Date(value),
  )
}

function realDateLabel(
  value: string | null,
): string {
  return value === null
    ? 'Sin fecha real'
    : technicalDate(value)
}

function operationErrorMessage(
  error: unknown,
): string {
  if (
    error instanceof ChronicleApiError
  ) {
    switch (error.code) {
      case 'CHRONICLE_EVENT_PERMISSION_DENIED':
        return 'Tu rol contextual no permite gestionar Eventos.'

      case 'CHRONICLE_EVENT_NOT_FOUND':
        return 'El Evento ya no está disponible.'

      case 'CHRONICLE_EVENT_REORDER_MISMATCH':
        return 'La línea temporal cambió mientras la ordenabas. Actualiza el panel.'

      case 'INVALID_CHRONICLE_EVENT_REQUEST':
        return 'Revisa los datos del Evento.'
    }
  }

  return 'No se pudo completar la operación sobre el Evento.'
}

export function ChronicleEventPanel({
  chronicleId,
}: ChronicleEventPanelProps) {
  const [
    events,
    setEvents,
  ] = useState<
    readonly ChronicleEventApiSnapshot[]
  >([])

  const [loading, setLoading] =
    useState(true)

  const [
    operationError,
    setOperationError,
  ] = useState<string | null>(
    null,
  )

  const [
    operationId,
    setOperationId,
  ] = useState<string | null>(
    null,
  )

  const [
    createForm,
    setCreateForm,
  ] = useState<EventFormState>(
    emptyForm,
  )

  const [
    editingEventId,
    setEditingEventId,
  ] = useState<string | null>(
    null,
  )

  const [
    editForm,
    setEditForm,
  ] = useState<EventFormState>(
    emptyForm,
  )

  const [
    selectedEvent,
    setSelectedEvent,
  ] = useState<
    ChronicleEventApiSnapshot | null
  >(null)

  async function loadEvents() {
    setLoading(true)
    setOperationError(null)

    try {
      setEvents(
        await gateway.events(
          chronicleId,
        ),
      )
    } catch (error: unknown) {
      setOperationError(
        operationErrorMessage(
          error,
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadEvents()
  }, [chronicleId])

  function updateCreateField(
    field: keyof EventFormState,
    value: string,
  ) {
    setCreateForm(
      (current) => ({
        ...current,
        [field]: value,
      }),
    )
  }

  function updateEditField(
    field: keyof EventFormState,
    value: string,
  ) {
    setEditForm(
      (current) => ({
        ...current,
        [field]: value,
      }),
    )
  }

  async function refreshAfterWrite(
    eventId?: string,
  ) {
    const updated =
      await gateway.events(
        chronicleId,
      )

    setEvents(updated)

    if (
      selectedEvent !== null &&
      (
        eventId === undefined ||
        selectedEvent.id === eventId
      )
    ) {
      setSelectedEvent(
        updated.find(
          (event) =>
            event.id ===
            selectedEvent.id,
        ) ?? null,
      )
    }
  }

  async function createEvent(
    submitEvent:
      FormEvent<HTMLFormElement>,
  ) {
    submitEvent.preventDefault()

    const request =
      requestFromForm(
        createForm,
      )

    if (
      request.title.length === 0
    ) {
      setOperationError(
        'El título del Evento es obligatorio.',
      )
      return
    }

    setOperationId(
      'event-create',
    )
    setOperationError(null)

    try {
      await gateway.createEvent(
        chronicleId,
        request,
      )

      setCreateForm(emptyForm)
      await refreshAfterWrite()
    } catch (error: unknown) {
      setOperationError(
        operationErrorMessage(
          error,
        ),
      )
    } finally {
      setOperationId(null)
    }
  }

  async function consultEvent(
    eventId: string,
  ) {
    setOperationId(
      `event-detail:${eventId}`,
    )
    setOperationError(null)

    try {
      setSelectedEvent(
        await gateway.event(
          chronicleId,
          eventId,
        ),
      )
    } catch (error: unknown) {
      setOperationError(
        operationErrorMessage(
          error,
        ),
      )
    } finally {
      setOperationId(null)
    }
  }

  function beginEdit(
    event: ChronicleEventApiSnapshot,
  ) {
    if (
      event.status !== 'active'
    ) {
      return
    }

    setEditingEventId(
      event.id,
    )
    setEditForm(
      formFromEvent(event),
    )
    setOperationError(null)
  }

  function cancelEdit() {
    setEditingEventId(null)
    setEditForm(emptyForm)
  }

  async function updateEvent(
    submitEvent:
      FormEvent<HTMLFormElement>,
    eventId: string,
  ) {
    submitEvent.preventDefault()

    const request =
      requestFromForm(
        editForm,
      )

    if (
      request.title.length === 0
    ) {
      setOperationError(
        'El título del Evento es obligatorio.',
      )
      return
    }

    setOperationId(
      `event-update:${eventId}`,
    )
    setOperationError(null)

    try {
      await gateway.updateEvent(
        chronicleId,
        eventId,
        request,
      )

      cancelEdit()

      await refreshAfterWrite(
        eventId,
      )
    } catch (error: unknown) {
      setOperationError(
        operationErrorMessage(
          error,
        ),
      )
    } finally {
      setOperationId(null)
    }
  }

  async function archiveEvent(
    eventId: string,
  ) {
    setOperationId(
      `event-archive:${eventId}`,
    )
    setOperationError(null)

    try {
      await gateway.archiveEvent(
        chronicleId,
        eventId,
      )

      if (
        editingEventId === eventId
      ) {
        cancelEdit()
      }

      await refreshAfterWrite(
        eventId,
      )
    } catch (error: unknown) {
      setOperationError(
        operationErrorMessage(
          error,
        ),
      )
    } finally {
      setOperationId(null)
    }
  }

  const activeEvents =
    events.filter(
      (event) =>
        event.status === 'active',
    )

  async function moveEvent(
    eventId: string,
    direction: -1 | 1,
  ) {
    const currentIndex =
      activeEvents.findIndex(
        (event) =>
          event.id === eventId,
      )

    const nextIndex =
      currentIndex + direction

    if (
      currentIndex < 0 ||
      nextIndex < 0 ||
      nextIndex >=
        activeEvents.length
    ) {
      return
    }

    const reordered =
      [...activeEvents]

    const [
      moved,
    ] = reordered.splice(
      currentIndex,
      1,
    )

    reordered.splice(
      nextIndex,
      0,
      moved,
    )

    setOperationId(
      `event-reorder:${eventId}`,
    )
    setOperationError(null)

    try {
      await gateway.reorderEvents(
        chronicleId,
        {
          eventIds:
            reordered.map(
              (event) =>
                event.id,
            ),
        },
      )

      await refreshAfterWrite(
        eventId,
      )
    } catch (error: unknown) {
      setOperationError(
        operationErrorMessage(
          error,
        ),
      )
    } finally {
      setOperationId(null)
    }
  }

  function formFields(
    form: EventFormState,
    updateField: (
      field: keyof EventFormState,
      value: string,
    ) => void,
    prefix: string,
  ) {
    return (
      <div className="chronicle-event-panel__fields">
        <label>
          <span>Título</span>
          <input
            name={`${prefix}-title`}
            value={form.title}
            required
            onChange={(event) =>
              updateField(
                'title',
                event.target.value,
              )
            }
          />
        </label>

        <label>
          <span>
            Referencia temporal narrativa
          </span>
          <input
            name={`${prefix}-narrative-time`}
            value={
              form.narrativeTimeLabel
            }
            placeholder="Ej.: La noche del Abrazo"
            onChange={(event) =>
              updateField(
                'narrativeTimeLabel',
                event.target.value,
              )
            }
          />
        </label>

        <label>
          <span>Fecha real opcional</span>
          <input
            type="datetime-local"
            name={`${prefix}-real-date`}
            value={form.realDate}
            onChange={(event) =>
              updateField(
                'realDate',
                event.target.value,
              )
            }
          />
        </label>

        <label className="chronicle-event-panel__wide-field">
          <span>Descripción</span>
          <textarea
            name={`${prefix}-description`}
            rows={3}
            value={form.description}
            onChange={(event) =>
              updateField(
                'description',
                event.target.value,
              )
            }
          />
        </label>

        <label className="chronicle-event-panel__wide-field">
          <span>Notas privadas</span>
          <textarea
            name={`${prefix}-narrator-notes`}
            rows={3}
            value={form.narratorNotes}
            onChange={(event) =>
              updateField(
                'narratorNotes',
                event.target.value,
              )
            }
          />
        </label>
      </div>
    )
  }

  return (
    <section
      className="chronicle-event-panel"
      aria-labelledby="chronicle-events-title"
    >
      <div className="chronicle-event-panel__heading">
        <div>
          <span>
            Información privada del Narrador
          </span>
          <h2 id="chronicle-events-title">
            Eventos / Línea temporal
          </h2>
        </div>

        <span className="chronicle-event-panel__count">
          {events.length}
        </span>
      </div>

      <form
        className="chronicle-event-panel__create"
        aria-labelledby="chronicle-event-create-title"
        onSubmit={createEvent}
      >
        <h3 id="chronicle-event-create-title">
          Crear Evento
        </h3>

        {formFields(
          createForm,
          updateCreateField,
          'create-event',
        )}

        <button
          type="submit"
          disabled={
            operationId ===
            'event-create'
          }
        >
          {operationId ===
          'event-create'
            ? 'Creando…'
            : 'Crear Evento'}
        </button>
      </form>

      {operationError !== null ? (
        <p
          className="chronicle-event-panel__error"
          role="alert"
          aria-live="assertive"
        >
          {operationError}
        </p>
      ) : null}

      {loading ? (
        <ViewStateStatus
          state="loading"
          className="chronicle-event-panel__message"
        >
          Cargando Eventos…
        </ViewStateStatus>
      ) : events.length === 0 ? (
        <p className="chronicle-event-panel__empty">
          No hay Eventos registrados en esta crónica.
        </p>
      ) : (
        <ul className="chronicle-event-panel__list">
          {events.map(
            (event) => {
              const consulting =
                operationId ===
                `event-detail:${event.id}`
              const updating =
                operationId ===
                `event-update:${event.id}`
              const archiving =
                operationId ===
                `event-archive:${event.id}`
              const reordering =
                operationId?.startsWith(
                  'event-reorder:',
                ) ?? false
              const editing =
                editingEventId ===
                event.id

              const activeIndex =
                activeEvents.findIndex(
                  (candidate) =>
                    candidate.id ===
                    event.id,
                )

              return (
                <li
                  key={event.id}
                  className={
                    'chronicle-event-panel__item ' +
                    `chronicle-event-panel__item--${event.status}`
                  }
                >
                  <div className="chronicle-event-panel__item-heading">
                    <div>
                      <strong>
                        {event.title}
                      </strong>

                      <span>
                        {event.narrativeTimeLabel ??
                          realDateLabel(
                            event.realDate,
                          )}
                      </span>
                    </div>

                    <span className="chronicle-event-panel__state">
                      {
                        eventStatusLabels[
                          event.status
                        ]
                      }
                    </span>
                  </div>

                  {editing ? (
                    <form
                      className="chronicle-event-panel__edit"
                      onSubmit={(
                        submitEvent,
                      ) =>
                        void updateEvent(
                          submitEvent,
                          event.id,
                        )
                      }
                    >
                      {formFields(
                        editForm,
                        updateEditField,
                        `edit-${event.id}`,
                      )}

                      <div className="chronicle-event-panel__actions">
                        <button
                          type="submit"
                          disabled={updating}
                        >
                          {updating
                            ? 'Guardando…'
                            : 'Guardar'}
                        </button>

                        <button
                          type="button"
                          className="chronicle-event-panel__compact-action"
                          disabled={updating}
                          onClick={cancelEdit}
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="chronicle-event-panel__actions">
                      <button
                        type="button"
                        className="chronicle-event-panel__compact-action"
                        disabled={consulting}
                        onClick={() =>
                          void consultEvent(
                            event.id,
                          )
                        }
                      >
                        {consulting
                          ? 'Consultando…'
                          : 'Consultar'}
                      </button>

                      {event.status ===
                      'active' ? (
                        <>
                          <button
                            type="button"
                            className="chronicle-event-panel__compact-action"
                            onClick={() =>
                              beginEdit(
                                event,
                              )
                            }
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            className="chronicle-event-panel__compact-action"
                            disabled={
                              reordering ||
                              activeIndex <= 0
                            }
                            onClick={() =>
                              void moveEvent(
                                event.id,
                                -1,
                              )
                            }
                          >
                            Subir
                          </button>

                          <button
                            type="button"
                            className="chronicle-event-panel__compact-action"
                            disabled={
                              reordering ||
                              activeIndex < 0 ||
                              activeIndex ===
                                activeEvents.length -
                                  1
                            }
                            onClick={() =>
                              void moveEvent(
                                event.id,
                                1,
                              )
                            }
                          >
                            Bajar
                          </button>

                          <button
                            type="button"
                            className="chronicle-event-panel__compact-action"
                            disabled={archiving}
                            onClick={() =>
                              void archiveEvent(
                                event.id,
                              )
                            }
                          >
                            {archiving
                              ? 'Archivando…'
                              : 'Archivar'}
                          </button>
                        </>
                      ) : null}
                    </div>
                  )}
                </li>
              )
            },
          )}
        </ul>
      )}

      {selectedEvent !== null ? (
        <section className="chronicle-event-panel__detail">
          <div className="chronicle-event-panel__detail-heading">
            <div>
              <span>
                Consulta rápida
              </span>
              <h3>
                {selectedEvent.title}
              </h3>
            </div>

            <button
              type="button"
              className="chronicle-event-panel__compact-action"
              onClick={() =>
                setSelectedEvent(null)
              }
            >
              Cerrar
            </button>
          </div>

          <dl className="chronicle-event-panel__detail-grid">
            <div>
              <dt>Estado</dt>
              <dd>
                {
                  eventStatusLabels[
                    selectedEvent.status
                  ]
                }
              </dd>
            </div>

            <div>
              <dt>Posición temporal</dt>
              <dd>
                {selectedEvent.status ===
                'active'
                  ? selectedEvent.timelineOrder +
                    1
                  : `Archivada · orden ${selectedEvent.timelineOrder + 1}`}
              </dd>
            </div>

            <div>
              <dt>
                Referencia temporal
              </dt>
              <dd>
                {selectedEvent.narrativeTimeLabel ??
                  'Sin referencia narrativa'}
              </dd>
            </div>

            <div>
              <dt>Fecha real</dt>
              <dd>
                {realDateLabel(
                  selectedEvent.realDate,
                )}
              </dd>
            </div>

            <div className="chronicle-event-panel__detail-wide">
              <dt>Descripción</dt>
              <dd>
                {selectedEvent.description ??
                  'Sin descripción'}
              </dd>
            </div>

            <div className="chronicle-event-panel__detail-wide">
              <dt>Notas privadas</dt>
              <dd>
                {selectedEvent.narratorNotes ??
                  'Sin notas privadas'}
              </dd>
            </div>

            <div>
              <dt>Creado</dt>
              <dd>
                {technicalDate(
                  selectedEvent.createdAt,
                )}
              </dd>
            </div>

            <div>
              <dt>Actualizado</dt>
              <dd>
                {technicalDate(
                  selectedEvent.updatedAt,
                )}
              </dd>
            </div>
          </dl>
        </section>
      ) : null}
    </section>
  )
}
