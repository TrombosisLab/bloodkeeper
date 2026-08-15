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
  ChronicleSessionApiSnapshot,
  ChronicleSessionApiStatus,
  CreateChronicleSessionApiRequest,
} from '../types/chronicle-api.types.ts'

import {
  ViewStateStatus,
} from '../../../components/ui/ViewStateStatus'

import {
  DiceHistoryPanel,
} from '../../dice/components/DiceHistoryPanel'

import {
  DiceRollPanel,
} from '../../dice/components/DiceRollPanel'

import './chronicle-session-panel.css'

const gateway =
  createChronicleGateway()

const sessionStatusLabels:
  Readonly<
    Record<
      ChronicleSessionApiStatus,
      string
    >
  > = {
    preparation: 'Preparación',
    completed: 'Completada',
    archived: 'Archivada',
  }

interface SessionFormState {
  readonly sessionNumber: string
  readonly title: string
  readonly realDate: string
  readonly summary: string
  readonly narratorNotes: string
}

const emptyForm: SessionFormState = {
  sessionNumber: '',
  title: '',
  realDate: '',
  summary: '',
  narratorNotes: '',
}

interface ChronicleSessionPanelProps {
  readonly chronicleId: string
}

function optionalText(
  value: string,
): string | null {
  const trimmed = value.trim()

  return trimmed.length === 0
    ? null
    : trimmed
}

function parsedSessionNumber(
  value: string,
): number | null {
  if (value.trim().length === 0) {
    return null
  }

  const parsed = Number(value)

  return Number.isInteger(parsed) &&
    parsed >= 0
    ? parsed
    : null
}

function isoFromLocalDateTime(
  value: string,
): string | null {
  if (value.trim().length === 0) {
    return null
  }

  const parsed = new Date(value)

  return Number.isNaN(parsed.getTime())
    ? null
    : parsed.toISOString()
}

function localDateTimeFromIso(
  value: string | null,
): string {
  if (value === null) {
    return ''
  }

  const parsed = new Date(value)
  const local = new Date(
    parsed.getTime() -
      parsed.getTimezoneOffset() *
        60_000,
  )

  return local.toISOString().slice(0, 16)
}

function requestFromForm(
  form: SessionFormState,
): CreateChronicleSessionApiRequest {
  return {
    sessionNumber:
      parsedSessionNumber(
        form.sessionNumber,
      ),
    title: optionalText(form.title),
    realDate:
      isoFromLocalDateTime(
        form.realDate,
      ),
    summary: optionalText(form.summary),
    narratorNotes:
      optionalText(
        form.narratorNotes,
      ),
  }
}

function formFromSession(
  session: ChronicleSessionApiSnapshot,
): SessionFormState {
  return {
    sessionNumber:
      session.sessionNumber === null
        ? ''
        : String(session.sessionNumber),
    title: session.title ?? '',
    realDate:
      localDateTimeFromIso(
        session.realDate,
      ),
    summary: session.summary ?? '',
    narratorNotes:
      session.narratorNotes ?? '',
  }
}

function operationErrorMessage(
  error: unknown,
): string {
  if (error instanceof ChronicleApiError) {
    if (
      error.code ===
      'CHRONICLE_SESSION_PERMISSION_DENIED'
    ) {
      return 'Sólo un Narrador activo de la crónica puede gestionar Sesiones.'
    }

    if (
      error.code ===
      'CHRONICLE_SESSION_NOT_FOUND'
    ) {
      return 'La Sesión ya no está disponible.'
    }

    if (
      error.code ===
      'INVALID_CHRONICLE_SESSION_REQUEST'
    ) {
      return 'Revisa los datos de la Sesión.'
    }

    if (
      error.code ===
      'AUTHENTICATION_REQUIRED'
    ) {
      return 'Necesitas una sesión autenticada válida.'
    }
  }

  return 'No se pudo completar la operación con la Sesión.'
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
  ).format(new Date(value))
}

function realDateLabel(
  value: string | null,
): string {
  return value === null
    ? 'Sin fecha real'
    : technicalDate(value)
}

function sessionTitle(
  session: ChronicleSessionApiSnapshot,
): string {
  if (session.title !== null) {
    return session.title
  }

  return session.sessionNumber === null
    ? 'Sesión especial / interludio'
    : `Sesión ${session.sessionNumber}`
}

function sessionNumberLabel(
  sessionNumber: number | null,
): string {
  return sessionNumber === null
    ? 'Sin numeración'
    : `Número ${sessionNumber}`
}

export function ChronicleSessionPanel({
  chronicleId,
}: ChronicleSessionPanelProps) {
  const [
    sessions,
    setSessions,
  ] = useState<
    readonly ChronicleSessionApiSnapshot[]
  >([])
  const [loading, setLoading] =
    useState(true)
  const [
    sessionsNextOffset,
    setSessionsNextOffset,
  ] = useState<number | null>(null)
  const [
    loadingMoreSessions,
    setLoadingMoreSessions,
  ] = useState(false)
  const [
    operationError,
    setOperationError,
  ] = useState<string | null>(null)
  const [
    operationId,
    setOperationId,
  ] = useState<string | null>(null)
  const [
    createForm,
    setCreateForm,
  ] = useState<SessionFormState>(
    emptyForm,
  )
  const [
    editingSessionId,
    setEditingSessionId,
  ] = useState<string | null>(null)
  const [
    editForm,
    setEditForm,
  ] = useState<SessionFormState>(
    emptyForm,
  )
  const [
    selectedSession,
    setSelectedSession,
  ] = useState<
    ChronicleSessionApiSnapshot | null
  >(null)

  async function loadSessions() {
    setLoading(true)
    setOperationError(null)

    try {
      const page =
        await gateway.sessions(
          chronicleId,
          {
            limit: 25,
            offset: 0,
          },
        )

      setSessions(page.items)
      setSessionsNextOffset(
        page.nextOffset,
      )
    } catch (error: unknown) {
      setOperationError(
        operationErrorMessage(error),
      )
    } finally {
      setLoading(false)
    }
  }

  async function loadMoreSessions() {
    if (
      sessionsNextOffset === null ||
      loadingMoreSessions
    ) {
      return
    }

    setLoadingMoreSessions(true)
    setOperationError(null)

    try {
      const page =
        await gateway.sessions(
          chronicleId,
          {
            limit: 25,
            offset:
              sessionsNextOffset,
          },
        )

      setSessions(
        (current) => [
          ...current,
          ...page.items,
        ],
      )
      setSessionsNextOffset(
        page.nextOffset,
      )
    } catch (error: unknown) {
      setOperationError(
        operationErrorMessage(error),
      )
    } finally {
      setLoadingMoreSessions(false)
    }
  }

  useEffect(() => {
    void loadSessions()
  }, [chronicleId])

  function updateCreateField(
    field: keyof SessionFormState,
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
    field: keyof SessionFormState,
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
    sessionId?: string,
  ) {
    const page =
      await gateway.sessions(
        chronicleId,
        {
          limit: 25,
          offset: 0,
        },
      )

    setSessions(page.items)
    setSessionsNextOffset(
      page.nextOffset,
    )

    if (
      selectedSession !== null &&
      (
        sessionId === undefined ||
        selectedSession.id === sessionId
      )
    ) {
      setSelectedSession(
        await gateway.session(
          chronicleId,
          selectedSession.id,
        ),
      )
    }
  }

  function validFormNumber(
    form: SessionFormState,
  ): boolean {
    return (
      form.sessionNumber.trim().length ===
        0 ||
      parsedSessionNumber(
        form.sessionNumber,
      ) !== null
    )
  }

  async function createSession(
    submitEvent:
      FormEvent<HTMLFormElement>,
  ) {
    submitEvent.preventDefault()

    if (!validFormNumber(createForm)) {
      setOperationError(
        'El número debe ser un entero no negativo o quedar vacío.',
      )
      return
    }

    setOperationId('session-create')
    setOperationError(null)

    try {
      await gateway.createSession(
        chronicleId,
        requestFromForm(createForm),
      )
      setCreateForm(emptyForm)
      await refreshAfterWrite()
    } catch (error: unknown) {
      setOperationError(
        operationErrorMessage(error),
      )
    } finally {
      setOperationId(null)
    }
  }

  async function consultSession(
    sessionId: string,
  ) {
    setOperationId(
      `session-detail:${sessionId}`,
    )
    setOperationError(null)

    try {
      setSelectedSession(
        await gateway.session(
          chronicleId,
          sessionId,
        ),
      )
    } catch (error: unknown) {
      setOperationError(
        operationErrorMessage(error),
      )
    } finally {
      setOperationId(null)
    }
  }

  function beginEdit(
    session: ChronicleSessionApiSnapshot,
  ) {
    if (session.status === 'archived') {
      return
    }

    setEditingSessionId(session.id)
    setEditForm(
      formFromSession(session),
    )
    setOperationError(null)
  }

  function cancelEdit() {
    setEditingSessionId(null)
    setEditForm(emptyForm)
  }

  async function updateSession(
    submitEvent:
      FormEvent<HTMLFormElement>,
    sessionId: string,
  ) {
    submitEvent.preventDefault()

    if (!validFormNumber(editForm)) {
      setOperationError(
        'El número debe ser un entero no negativo o quedar vacío.',
      )
      return
    }

    setOperationId(
      `session-update:${sessionId}`,
    )
    setOperationError(null)

    try {
      await gateway.updateSession(
        chronicleId,
        sessionId,
        requestFromForm(editForm),
      )
      cancelEdit()
      await refreshAfterWrite(sessionId)
    } catch (error: unknown) {
      setOperationError(
        operationErrorMessage(error),
      )
    } finally {
      setOperationId(null)
    }
  }

  async function completeSession(
    sessionId: string,
  ) {
    setOperationId(
      `session-complete:${sessionId}`,
    )
    setOperationError(null)

    try {
      await gateway.completeSession(
        chronicleId,
        sessionId,
      )
      await refreshAfterWrite(sessionId)
    } catch (error: unknown) {
      setOperationError(
        operationErrorMessage(error),
      )
    } finally {
      setOperationId(null)
    }
  }

  async function archiveSession(
    sessionId: string,
  ) {
    setOperationId(
      `session-archive:${sessionId}`,
    )
    setOperationError(null)

    try {
      await gateway.archiveSession(
        chronicleId,
        sessionId,
      )

      if (
        editingSessionId === sessionId
      ) {
        cancelEdit()
      }

      await refreshAfterWrite(sessionId)
    } catch (error: unknown) {
      setOperationError(
        operationErrorMessage(error),
      )
    } finally {
      setOperationId(null)
    }
  }

  function formFields(
    form: SessionFormState,
    updateField: (
      field: keyof SessionFormState,
      value: string,
    ) => void,
    prefix: string,
  ) {
    return (
      <div className="chronicle-session-panel__fields">
        <label>
          <span>Número opcional</span>
          <input
            type="number"
            min="0"
            step="1"
            name={`${prefix}-number`}
            value={form.sessionNumber}
            placeholder="Interludios pueden quedar sin número"
            onChange={(event) =>
              updateField(
                'sessionNumber',
                event.target.value,
              )
            }
          />
        </label>

        <label>
          <span>Título opcional</span>
          <input
            name={`${prefix}-title`}
            value={form.title}
            onChange={(event) =>
              updateField(
                'title',
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

        <label className="chronicle-session-panel__wide-field">
          <span>Resumen narrativo</span>
          <textarea
            name={`${prefix}-summary`}
            rows={3}
            value={form.summary}
            onChange={(event) =>
              updateField(
                'summary',
                event.target.value,
              )
            }
          />
        </label>

        <label className="chronicle-session-panel__wide-field">
          <span>Notas privadas del Narrador</span>
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
      className="chronicle-session-panel"
      aria-labelledby="chronicle-sessions-title"
    >
      <div className="chronicle-session-panel__heading">
        <div>
          <span>
            Preparación y memoria privada del Narrador
          </span>
          <h2 id="chronicle-sessions-title">
            Sesiones
          </h2>
        </div>

        <span className="chronicle-session-panel__count">
          {sessions.length}
        </span>
      </div>

      <form
        className="chronicle-session-panel__create"
        aria-labelledby="chronicle-session-create-title"
        onSubmit={createSession}
      >
        <h3 id="chronicle-session-create-title">
          Preparar Sesión
        </h3>

        {formFields(
          createForm,
          updateCreateField,
          'create-session',
        )}

        <button
          type="submit"
          disabled={
            operationId ===
            'session-create'
          }
        >
          {operationId ===
          'session-create'
            ? 'Creando…'
            : 'Crear Sesión'}
        </button>
      </form>

      {operationError !== null ? (
        <p
          className="chronicle-session-panel__error"
          role="alert"
          aria-live="assertive"
        >
          {operationError}
        </p>
      ) : null}

      {loading ? (
        <ViewStateStatus
          state="loading"
          className="chronicle-session-panel__message"
        >
          Cargando Sesiones…
        </ViewStateStatus>
      ) : sessions.length === 0 ? (
        <p className="chronicle-session-panel__empty">
          No hay Sesiones registradas en esta crónica.
        </p>
      ) : (
        <ul className="chronicle-session-panel__list">
          {sessions.map(
            (session) => {
              const consulting =
                operationId ===
                `session-detail:${session.id}`
              const updating =
                operationId ===
                `session-update:${session.id}`
              const completing =
                operationId ===
                `session-complete:${session.id}`
              const archiving =
                operationId ===
                `session-archive:${session.id}`
              const editing =
                editingSessionId ===
                session.id

              return (
                <li
                  key={session.id}
                  className={
                    'chronicle-session-panel__item ' +
                    `chronicle-session-panel__item--${session.status}`
                  }
                >
                  <div className="chronicle-session-panel__item-heading">
                    <div>
                      <strong>
                        {sessionTitle(session)}
                      </strong>
                      <span>
                        {sessionNumberLabel(
                          session.sessionNumber,
                        )}
                        {' · '}
                        {realDateLabel(
                          session.realDate,
                        )}
                      </span>
                    </div>

                    <span className="chronicle-session-panel__state">
                      {
                        sessionStatusLabels[
                          session.status
                        ]
                      }
                    </span>
                  </div>

                  {editing ? (
                    <form
                      className="chronicle-session-panel__edit"
                      onSubmit={(
                        submitEvent,
                      ) =>
                        void updateSession(
                          submitEvent,
                          session.id,
                        )
                      }
                    >
                      {formFields(
                        editForm,
                        updateEditField,
                        `edit-${session.id}`,
                      )}

                      <div className="chronicle-session-panel__actions">
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
                          className="chronicle-session-panel__compact-action"
                          disabled={updating}
                          onClick={cancelEdit}
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="chronicle-session-panel__actions">
                      <button
                        type="button"
                        className="chronicle-session-panel__compact-action"
                        disabled={consulting}
                        onClick={() =>
                          void consultSession(
                            session.id,
                          )
                        }
                      >
                        {consulting
                          ? 'Consultando…'
                          : 'Consultar'}
                      </button>

                      {session.status !==
                      'archived' ? (
                        <>
                          <button
                            type="button"
                            className="chronicle-session-panel__compact-action"
                            onClick={() =>
                              beginEdit(session)
                            }
                          >
                            Editar
                          </button>

                          {session.status ===
                          'preparation' ? (
                            <button
                              type="button"
                              className="chronicle-session-panel__compact-action"
                              disabled={completing}
                              onClick={() =>
                                void completeSession(
                                  session.id,
                                )
                              }
                            >
                              {completing
                                ? 'Completando…'
                                : 'Marcar completada'}
                            </button>
                          ) : null}

                          <button
                            type="button"
                            className="chronicle-session-panel__compact-action"
                            disabled={archiving}
                            onClick={() =>
                              void archiveSession(
                                session.id,
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

      {sessionsNextOffset !== null ? (
        <button
          type="button"
          onClick={() => {
            void loadMoreSessions()
          }}
          disabled={loadingMoreSessions}
        >
          {loadingMoreSessions
            ? 'Cargando más sesiones…'
            : 'Cargar más sesiones'}
        </button>
      ) : null}

      {selectedSession !== null ? (
        <section className="chronicle-session-panel__detail">
          <div className="chronicle-session-panel__detail-heading">
            <div>
              <span>Consulta de Sesión</span>
              <h3>
                {sessionTitle(
                  selectedSession,
                )}
              </h3>
            </div>

            <button
              type="button"
              className="chronicle-session-panel__compact-action"
              onClick={() =>
                setSelectedSession(null)
              }
            >
              Cerrar
            </button>
          </div>

          <dl className="chronicle-session-panel__detail-grid">
            <div>
              <dt>Estado</dt>
              <dd>
                {
                  sessionStatusLabels[
                    selectedSession.status
                  ]
                }
              </dd>
            </div>

            <div>
              <dt>Numeración</dt>
              <dd>
                {sessionNumberLabel(
                  selectedSession.sessionNumber,
                )}
              </dd>
            </div>

            <div>
              <dt>Fecha real</dt>
              <dd>
                {realDateLabel(
                  selectedSession.realDate,
                )}
              </dd>
            </div>

            <div className="chronicle-session-panel__detail-wide">
              <dt>Resumen narrativo</dt>
              <dd>
                {selectedSession.summary ??
                  'Sin resumen narrativo'}
              </dd>
            </div>

            <div className="chronicle-session-panel__detail-wide">
              <dt>Notas privadas del Narrador</dt>
              <dd>
                {selectedSession.narratorNotes ??
                  'Sin notas privadas'}
              </dd>
            </div>

            <div>
              <dt>Creada</dt>
              <dd>
                {technicalDate(
                  selectedSession.createdAt,
                )}
              </dd>
            </div>

            <div>
              <dt>Actualizada</dt>
              <dd>
                {technicalDate(
                  selectedSession.updatedAt,
                )}
              </dd>
            </div>
          </dl>
        </section>
      ) : null}

      {selectedSession !== null ? (
        <div className="chronicle-session-panel__dice-context">
          <DiceRollPanel
            mode="manual"
            chronicleId={chronicleId}
            sessionId={selectedSession.id}
          />
          <DiceHistoryPanel
            chronicleId={chronicleId}
            sessionId={selectedSession.id}
            contextLabel="Historial de la sesión seleccionada"
          />
        </div>
      ) : null}

    </section>
  )
}
