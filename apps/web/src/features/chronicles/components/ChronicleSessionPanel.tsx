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
  ChronicleCharacterApiSummary,
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

import {
  ChronicleSessionAttendancePanel,
} from './ChronicleSessionAttendancePanel'

import {
  ChronicleSessionContextPanel,
} from './ChronicleSessionContextPanel'

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

type SessionWorkspaceSection =
  | 'summary'
  | 'preparation'
  | 'attendance'
  | 'dice'

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
  readonly associatedCharacters:
    readonly ChronicleCharacterApiSummary[]
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

function sessionSummaryLabel(
  session: ChronicleSessionApiSnapshot,
): string {
  return session.summary ??
    'Sin resumen narrativo.'
}

export function ChronicleSessionPanel({
  chronicleId,
  associatedCharacters,
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
    showCreateForm,
    setShowCreateForm,
  ] = useState(false)

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

  const [
    activeWorkspaceSection,
    setActiveWorkspaceSection,
  ] = useState<SessionWorkspaceSection>(
    'summary',
  )

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
      setShowCreateForm(false)
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
      setActiveWorkspaceSection(
        'summary',
      )
      setEditingSessionId(null)
      setEditForm(emptyForm)
    } catch (error: unknown) {
      setOperationError(
        operationErrorMessage(error),
      )
    } finally {
      setOperationId(null)
    }
  }

  function closeWorkspace() {
    setSelectedSession(null)
    setEditingSessionId(null)
    setEditForm(emptyForm)
    setActiveWorkspaceSection(
      'summary',
    )
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
    setActiveWorkspaceSection(
      'summary',
    )
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

  function workspaceTab(
    section: SessionWorkspaceSection,
    label: string,
  ) {
    const selected =
      activeWorkspaceSection === section

    return (
      <button
        type="button"
        role="tab"
        id={`chronicle-session-workspace-${section}-tab`}
        aria-controls={`chronicle-session-workspace-${section}-panel`}
        aria-selected={selected}
        className={
          'chronicle-session-panel__workspace-tab ' +
          (
            selected
              ? 'chronicle-session-panel__workspace-tab--active'
              : ''
          )
        }
        onClick={() =>
          setActiveWorkspaceSection(
            section,
          )
        }
      >
        {label}
      </button>
    )
  }

  const editingSelectedSession =
    selectedSession !== null &&
    editingSessionId ===
      selectedSession.id

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

      <button
        type="button"
        className="chronicle-session-panel__create-launcher"
        aria-expanded={showCreateForm}
        aria-controls="chronicle-session-create-panel"
        onClick={() =>
          setShowCreateForm(
            (current) => !current,
          )
        }
      >
        <span>
          <strong>
            Preparar nueva sesión
          </strong>
          <small>
            Crea la sesión y después organiza su preparación, asistencia y tiradas.
          </small>
        </span>

        <span aria-hidden="true">
          {showCreateForm ? '−' : '+'}
        </span>
      </button>

      {showCreateForm ? (
        <form
          id="chronicle-session-create-panel"
          className="chronicle-session-panel__create"
          aria-labelledby="chronicle-session-create-title"
          onSubmit={createSession}
        >
          <div className="chronicle-session-panel__create-heading">
            <h3 id="chronicle-session-create-title">
              Nueva sesión
            </h3>

            <button
              type="button"
              className="chronicle-session-panel__compact-action"
              onClick={() => {
                setShowCreateForm(false)
                setCreateForm(emptyForm)
              }}
            >
              Cancelar
            </button>
          </div>

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
      ) : null}

      {operationError !== null ? (
        <p
          className="chronicle-session-panel__error"
          role="alert"
          aria-live="assertive"
        >
          {operationError}
        </p>
      ) : null}

      <div className="chronicle-session-panel__workspace-layout">
        <aside
          className="chronicle-session-panel__browser"
          aria-label="Lista de sesiones"
        >
          <div className="chronicle-session-panel__browser-heading">
            <h3>Historial de sesiones</h3>
            <span>
              {sessions.length}
            </span>
          </div>

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

                  const selected =
                    selectedSession?.id ===
                    session.id

                  return (
                    <li
                      key={session.id}
                      className={
                        'chronicle-session-panel__item ' +
                        `chronicle-session-panel__item--${session.status} ` +
                        (
                          selected
                            ? 'chronicle-session-panel__item--selected'
                            : ''
                        )
                      }
                    >
                      <button
                        type="button"
                        className="chronicle-session-panel__select"
                        disabled={consulting}
                        aria-pressed={selected}
                        onClick={() =>
                          void consultSession(
                            session.id,
                          )
                        }
                      >
                        <span className="chronicle-session-panel__select-meta">
                          {realDateLabel(
                            session.realDate,
                          )}
                        </span>

                        <span className="chronicle-session-panel__select-title">
                          {sessionTitle(
                            session,
                          )}
                        </span>

                        <span className="chronicle-session-panel__select-summary">
                          {sessionSummaryLabel(
                            session,
                          )}
                        </span>

                        <span className="chronicle-session-panel__select-footer">
                          <span>
                            {sessionNumberLabel(
                              session.sessionNumber,
                            )}
                          </span>

                          <span className="chronicle-session-panel__state">
                            {
                              sessionStatusLabels[
                                session.status
                              ]
                            }
                          </span>
                        </span>
                      </button>
                    </li>
                  )
                },
              )}
            </ul>
          )}

          {sessionsNextOffset !== null ? (
            <button
              type="button"
              className="chronicle-session-panel__load-more"
              onClick={() => {
                void loadMoreSessions()
              }}
              disabled={
                loadingMoreSessions
              }
            >
              {loadingMoreSessions
                ? 'Cargando más sesiones…'
                : 'Cargar más sesiones'}
            </button>
          ) : null}
        </aside>

        <div className="chronicle-session-panel__workspace">
          {selectedSession === null ? (
            <div className="chronicle-session-panel__workspace-empty">
              <span>
                Sesión
              </span>
              <h3>
                Selecciona una sesión
              </h3>
              <p>
                Abre una sesión de la lista para consultar su resumen, preparar recursos, registrar asistencia o trabajar con sus tiradas.
              </p>
            </div>
          ) : (
            <>
              <header className="chronicle-session-panel__workspace-heading">
                <div>
                  <span>
                    {realDateLabel(
                      selectedSession.realDate,
                    )}
                  </span>
                  <h3>
                    {sessionTitle(
                      selectedSession,
                    )}
                  </h3>
                </div>

                <div className="chronicle-session-panel__workspace-heading-actions">
                  <span className="chronicle-session-panel__state">
                    {
                      sessionStatusLabels[
                        selectedSession.status
                      ]
                    }
                  </span>

                  <button
                    type="button"
                    className="chronicle-session-panel__compact-action"
                    onClick={closeWorkspace}
                  >
                    Cerrar
                  </button>
                </div>
              </header>

              <div
                className="chronicle-session-panel__workspace-tabs"
                role="tablist"
                aria-label="Áreas de trabajo de la sesión"
              >
                {workspaceTab(
                  'summary',
                  'Resumen',
                )}
                {workspaceTab(
                  'preparation',
                  'Preparación',
                )}
                {workspaceTab(
                  'attendance',
                  'Asistencia',
                )}
                {workspaceTab(
                  'dice',
                  'Tiradas',
                )}
              </div>

              <div
                id="chronicle-session-workspace-summary-panel"
                role="tabpanel"
                aria-labelledby="chronicle-session-workspace-summary-tab"
                hidden={
                  activeWorkspaceSection !==
                  'summary'
                }
                className="chronicle-session-panel__workspace-panel"
              >
                {editingSelectedSession ? (
                  <form
                    className="chronicle-session-panel__edit"
                    onSubmit={(
                      submitEvent,
                    ) =>
                      void updateSession(
                        submitEvent,
                        selectedSession.id,
                      )
                    }
                  >
                    {formFields(
                      editForm,
                      updateEditField,
                      `edit-${selectedSession.id}`,
                    )}

                    <div className="chronicle-session-panel__actions">
                      <button
                        type="submit"
                        disabled={
                          operationId ===
                          `session-update:${selectedSession.id}`
                        }
                      >
                        {operationId ===
                        `session-update:${selectedSession.id}`
                          ? 'Guardando…'
                          : 'Guardar cambios'}
                      </button>

                      <button
                        type="button"
                        className="chronicle-session-panel__compact-action"
                        onClick={cancelEdit}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <dl className="chronicle-session-panel__detail-grid">
                      <div className="chronicle-session-panel__detail-section chronicle-session-panel__detail-wide">
                        <div className="chronicle-session-panel__detail-section-heading">
                          Datos de sesión
                        </div>

                        <div className="chronicle-session-panel__detail-meta-grid">
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
                            <dt>Fecha real</dt>
                            <dd>
                              {realDateLabel(
                                selectedSession.realDate,
                              )}
                            </dd>
                          </div>

                          <div>
                            <dt>Número</dt>
                            <dd>
                              {selectedSession.sessionNumber === null
                                ? '—'
                                : selectedSession.sessionNumber}
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
                        </div>
                      </div>

                      <div className="chronicle-session-panel__detail-section chronicle-session-panel__detail-wide">
                        <div className="chronicle-session-panel__detail-section-heading">
                          Resumen narrativo
                        </div>
                        <dd className="chronicle-session-panel__detail-section-content">
                          {selectedSession.summary ??
                            'Sin resumen narrativo'}
                        </dd>
                      </div>

                      <div className="chronicle-session-panel__detail-section chronicle-session-panel__detail-wide">
                        <div className="chronicle-session-panel__detail-section-heading">
                          Notas del Narrador
                        </div>
                        <dd className="chronicle-session-panel__detail-section-content">
                          {selectedSession.narratorNotes ??
                            'Sin notas privadas'}
                        </dd>
                      </div>
                    </dl>

                    {selectedSession.status !==
                    'archived' ? (
                      <div className="chronicle-session-panel__actions">
                        <button
                          type="button"
                          className="chronicle-session-panel__compact-action"
                          onClick={() =>
                            beginEdit(
                              selectedSession,
                            )
                          }
                        >
                          Editar
                        </button>

                        {selectedSession.status ===
                        'preparation' ? (
                          <button
                            type="button"
                            className="chronicle-session-panel__compact-action"
                            disabled={
                              operationId ===
                              `session-complete:${selectedSession.id}`
                            }
                            onClick={() =>
                              void completeSession(
                                selectedSession.id,
                              )
                            }
                          >
                            {operationId ===
                            `session-complete:${selectedSession.id}`
                              ? 'Completando…'
                              : 'Marcar completada'}
                          </button>
                        ) : null}

                        <button
                          type="button"
                          className="chronicle-session-panel__compact-action"
                          disabled={
                            operationId ===
                            `session-archive:${selectedSession.id}`
                          }
                          onClick={() =>
                            void archiveSession(
                              selectedSession.id,
                            )
                          }
                        >
                          {operationId ===
                          `session-archive:${selectedSession.id}`
                            ? 'Archivando…'
                            : 'Archivar'}
                        </button>
                      </div>
                    ) : null}
                  </>
                )}
              </div>

              <div
                id="chronicle-session-workspace-preparation-panel"
                role="tabpanel"
                aria-labelledby="chronicle-session-workspace-preparation-tab"
                hidden={
                  activeWorkspaceSection !==
                  'preparation'
                }
                className="chronicle-session-panel__workspace-panel"
              >
                <ChronicleSessionContextPanel
                  key={`context:${selectedSession.id}`}
                  chronicleId={chronicleId}
                  session={selectedSession}
                />
              </div>

              <div
                id="chronicle-session-workspace-attendance-panel"
                role="tabpanel"
                aria-labelledby="chronicle-session-workspace-attendance-tab"
                hidden={
                  activeWorkspaceSection !==
                  'attendance'
                }
                className="chronicle-session-panel__workspace-panel"
              >
                <ChronicleSessionAttendancePanel
                  key={`attendance:${selectedSession.id}`}
                  chronicleId={chronicleId}
                  session={selectedSession}
                  associatedCharacters={
                    associatedCharacters
                  }
                />
              </div>

              <div
                id="chronicle-session-workspace-dice-panel"
                role="tabpanel"
                aria-labelledby="chronicle-session-workspace-dice-tab"
                hidden={
                  activeWorkspaceSection !==
                  'dice'
                }
                className="chronicle-session-panel__workspace-panel"
              >
                <div className="chronicle-session-panel__dice-context">
                  <DiceRollPanel
                    mode="manual"
                    chronicleId={chronicleId}
                    sessionId={
                      selectedSession.id
                    }
                  />

                  <DiceHistoryPanel
                    chronicleId={chronicleId}
                    sessionId={
                      selectedSession.id
                    }
                    contextLabel="Historial de la sesión seleccionada"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
