import {
  useEffect,
  useState,
} from 'react'

import type {
  FormEvent,
} from 'react'

import {
  CharacterDraftApiError,
  createCharacterDraftGateway,
} from '../../character-creation/infrastructure/character-draft.api.ts'

import type {
  CharacterDraftApiSnapshot,
} from '../../character-creation/types/character-draft-api.types.ts'

import {
  useAuthenticatedUser,
} from '../../authentication/context/authentication.context'

import {
  ChronicleApiError,
  createChronicleGateway,
} from '../infrastructure/chronicle.api.ts'

import type {
  ChronicleApiSnapshot,
  ChronicleApiStatus,
  ChronicleCharacterApiSummary,
  ChronicleParticipantApiRole,
  ChronicleParticipantApiSnapshot,
  ChronicleParticipantCandidateApiSnapshot,
} from '../types/chronicle-api.types.ts'

import {
  ViewStateStatus,
} from '../../../components/ui/ViewStateStatus'

import {
  ChronicleEventPanel,
} from './ChronicleEventPanel'

import {
  ChronicleSessionPanel,
} from './ChronicleSessionPanel'



import {
  ChronicleResourcesWorkspace,
} from './ChronicleResourcesWorkspace'

import './chronicle-detail.css'

const gateway =
  createChronicleGateway()

const characterGateway =
  createCharacterDraftGateway()

const statusLabels:
  Readonly<Record<ChronicleApiStatus, string>> = {
    preparation: 'Preparación',
    active: 'Activa',
    archived: 'Archivada',
  }

const participantStatusLabels = {
  active: 'Activo',
  retired: 'Retirado',
} as const

const characterStatusLabels = {
  draft: 'Borrador',
  active: 'Activo',
  archived: 'Archivado',
} as const

type ChronicleDetailSection =
  | 'summary'
  | 'participants'
  | 'sessions'
  | 'story'
  | 'resources'

interface ChronicleDetailProps {
  readonly chronicleId: string
  readonly onBack: () => void
  readonly onChronicleUpdated?: (
    chronicle: ChronicleApiSnapshot,
  ) => void
}

function detailErrorMessage(
  error: unknown,
): string {
  if (
    error instanceof ChronicleApiError
  ) {
    if (
      error.code ===
      'CHRONICLE_NOT_FOUND'
    ) {
      return 'La crónica no está disponible.'
    }

    if (
      error.code ===
        'AUTHENTICATION_REQUIRED' ||
      error.code ===
        'CHRONICLE_PERMISSION_DENIED' ||
      error.code ===
        'CHRONICLE_PARTICIPANT_PERMISSION_DENIED' ||
      error.code ===
        'CHRONICLE_CHARACTER_PERMISSION_DENIED'
    ) {
      return 'No tienes permiso para consultar esta crónica.'
    }
  }

  return 'No se pudo cargar la crónica.'
}

function operationErrorMessage(
  error: unknown,
): string {
  if (
    error instanceof ChronicleApiError
  ) {
    switch (error.code) {
      case 'CHRONICLE_PARTICIPANT_DUPLICATE':
        return 'Ese usuario ya tiene o tuvo una relación con esta crónica.'

      case 'CHRONICLE_LAST_NARRATOR_REQUIRED':
        return 'La crónica debe conservar al menos un Narrador activo.'

      case 'CHRONICLE_PARTICIPANT_ACTIVE_CHARACTER_RELATION':
        return 'Antes de retirar a este participante debes resolver sus personajes no archivados asociados.'

      case 'CHRONICLE_PARTICIPANT_PERMISSION_DENIED':
      case 'CHRONICLE_PERMISSION_DENIED':
        return 'Tu rol contextual no permite realizar esta acción.'

      case 'CHRONICLE_LIFECYCLE_TRANSITION_REJECTED':
        return 'El cambio de estado solicitado no está permitido.'

      case 'CHRONICLE_LIFECYCLE_WRITE_CONFLICT':
        return 'La crónica cambió mientras realizabas la operación. Actualiza el panel.'
    }
  }

  if (
    error instanceof CharacterDraftApiError
  ) {
    switch (error.code) {
      case 'CHARACTER_CHRONICLE_MEMBERSHIP_REQUIRED':
        return 'El propietario debe participar activamente en la crónica.'

      case 'CHARACTER_CHRONICLE_CONFIRMATION_REQUIRED':
        return 'Este personaje tiene historial. Confirma explícitamente la desasociación.'

      case 'CHARACTER_DRAFT_WRITE_CONFLICT':
        return 'El personaje cambió mientras realizabas la operación. Actualiza el panel.'
    }
  }

  return 'No se pudo completar la operación.'
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

function lifecycleAction(
  status: ChronicleApiStatus,
): {
  readonly label: string
  readonly nextStatus:
    | 'active'
    | 'archived'
} {
  if (status === 'preparation') {
    return {
      label: 'Activar crónica',
      nextStatus: 'active',
    }
  }

  if (status === 'active') {
    return {
      label: 'Archivar crónica',
      nextStatus: 'archived',
    }
  }

  return {
    label: 'Reactivar crónica',
    nextStatus: 'active',
  }
}

function characterName(
  character: CharacterDraftApiSnapshot,
): string {
  const name =
    character.identity.name.trim()

  return name.length > 0
    ? name
    : 'Personaje sin nombre'
}

function readableUsername(
  username: string,
): string | null {
  const normalized =
    username.trim()

  if (
    normalized.length === 0 ||
    normalized.length > 32
  ) {
    return null
  }

  return `@${normalized}`
}

export function ChronicleDetail({
  chronicleId,
  onBack,
  onChronicleUpdated,
}: ChronicleDetailProps) {
  const authenticatedUser =
    useAuthenticatedUser()

  const [
    chronicle,
    setChronicle,
  ] = useState<
    ChronicleApiSnapshot | null
  >(null)

  const [
    participants,
    setParticipants,
  ] = useState<
    readonly ChronicleParticipantApiSnapshot[]
  >([])

  const [
    associatedCharacters,
    setAssociatedCharacters,
  ] = useState<
    readonly ChronicleCharacterApiSummary[]
  >([])

  const [
    ownCharacters,
    setOwnCharacters,
  ] = useState<
    readonly CharacterDraftApiSnapshot[]
  >([])

  const [
    candidates,
    setCandidates,
  ] = useState<
    readonly ChronicleParticipantCandidateApiSnapshot[]
  >([])

  const [
    selectedCandidateId,
    setSelectedCandidateId,
  ] = useState('')

  const [
    selectedRole,
    setSelectedRole,
  ] = useState<
    ChronicleParticipantApiRole
  >('player')

  const [
    showParticipantAdmin,
    setShowParticipantAdmin,
  ] = useState(false)

  const [
    showCharacterAssociation,
    setShowCharacterAssociation,
  ] = useState(false)

  const [loading, setLoading] =
    useState(true)

  const [
    error,
    setError,
  ] = useState<string | null>(null)

  const [
    operationError,
    setOperationError,
  ] = useState<string | null>(null)

  const [
    operationId,
    setOperationId,
  ] = useState<string | null>(null)

  const [
    pendingConfirmationCharacterId,
    setPendingConfirmationCharacterId,
  ] = useState<string | null>(null)

  const [
    activeSection,
    setActiveSection,
  ] = useState<ChronicleDetailSection>(
    'summary',
  )

  async function load() {
    setLoading(true)
    setError(null)
    setOperationError(null)

    try {
      const [
        loadedChronicle,
        loadedParticipants,
        loadedAssociatedCharacters,
        loadedOwnCharacters,
      ] = await Promise.all([
        gateway.get(
          chronicleId,
        ),
        gateway.participants(
          chronicleId,
        ),
        gateway.characters(
          chronicleId,
        ),
        characterGateway.list(),
      ])

      const membership =
        loadedParticipants.find(
          (participant) =>
            participant.userId ===
              authenticatedUser.id &&
            participant.status ===
              'active',
        )

      const loadedCandidates =
        membership?.role === 'narrator'
          ? await gateway
              .participantCandidates(
                chronicleId,
              )
          : []

      setChronicle(
        loadedChronicle,
      )
      setParticipants(
        loadedParticipants,
      )
      setAssociatedCharacters(
        loadedAssociatedCharacters,
      )
      setOwnCharacters(
        loadedOwnCharacters,
      )
      setCandidates(
        loadedCandidates,
      )
      setSelectedCandidateId(
        loadedCandidates[0]?.id ??
          '',
      )
    } catch (loadError: unknown) {
      setChronicle(null)
      setError(
        detailErrorMessage(
          loadError,
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [
    chronicleId,
    authenticatedUser.id,
  ])

  const currentMembership =
    participants.find(
      (participant) =>
        participant.userId ===
          authenticatedUser.id &&
        participant.status ===
          'active',
    )

  const canManageParticipants =
    currentMembership?.role ===
    'narrator'

  const canManageNpcs =
    currentMembership?.role ===
    'narrator'

  const canManageLocations =
    currentMembership?.role ===
    'narrator'

  const canManageEvents =
    currentMembership?.role ===
    'narrator'

  const canManageSessions =
    currentMembership?.role ===
    'narrator'

  const narrators =
    participants.filter(
      (participant) =>
        participant.role ===
        'narrator',
    )

  const players =
    participants.filter(
      (participant) =>
        participant.role ===
        'player',
    )

  const activeNarratorCount =
    narrators.filter(
      (participant) =>
        participant.status === 'active',
    ).length

  const activePlayerCount =
    players.filter(
      (participant) =>
        participant.status === 'active',
    ).length

  const independentOwnCharacters =
    ownCharacters.filter(
      (character) =>
        character.chronicleId ===
        null,
    )

  function ownCharacter(
    characterId: string,
  ) {
    return ownCharacters.find(
      (character) =>
        character.characterId ===
        characterId,
    )
  }

  async function refreshParticipants() {
    const updated =
      await gateway.participants(
        chronicleId,
      )

    setParticipants(updated)

    const membership =
      updated.find(
        (participant) =>
          participant.userId ===
            authenticatedUser.id &&
          participant.status ===
            'active',
      )

    if (
      membership?.role === 'narrator'
    ) {
      const updatedCandidates =
        await gateway
          .participantCandidates(
            chronicleId,
          )

      setCandidates(
        updatedCandidates,
      )
      setSelectedCandidateId(
        (current) =>
          updatedCandidates.some(
            (candidate) =>
              candidate.id === current,
          )
            ? current
            : updatedCandidates[0]
                ?.id ?? '',
      )
    } else {
      setCandidates([])
      setSelectedCandidateId('')
    }
  }

  async function refreshCharacters() {
    const [
      updatedAssociated,
      updatedOwn,
    ] = await Promise.all([
      gateway.characters(
        chronicleId,
      ),
      characterGateway.list(),
    ])

    setAssociatedCharacters(
      updatedAssociated,
    )
    setOwnCharacters(
      updatedOwn,
    )
  }

  async function transitionChronicle() {
    if (
      chronicle === null ||
      !canManageParticipants
    ) {
      return
    }

    const action =
      lifecycleAction(
        chronicle.status,
      )

    setOperationId(
      'chronicle-lifecycle',
    )
    setOperationError(null)

    try {
      const updated =
        await gateway.transition(
          chronicle.id,
          {
            nextStatus:
              action.nextStatus,
          },
        )

      setChronicle(updated)
      onChronicleUpdated?.(
        updated,
      )
    } catch (transitionError: unknown) {
      setOperationError(
        operationErrorMessage(
          transitionError,
        ),
      )
    } finally {
      setOperationId(null)
    }
  }

  async function addParticipant(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (
      !canManageParticipants ||
      selectedCandidateId.length === 0
    ) {
      return
    }

    setOperationId(
      'add-participant',
    )
    setOperationError(null)

    try {
      await gateway.addParticipant(
        chronicleId,
        {
          userId:
            selectedCandidateId,
          role: selectedRole,
        },
      )

      await refreshParticipants()
      setShowParticipantAdmin(false)
    } catch (addError: unknown) {
      setOperationError(
        operationErrorMessage(
          addError,
        ),
      )
    } finally {
      setOperationId(null)
    }
  }

  async function retireParticipant(
    participant:
      ChronicleParticipantApiSnapshot,
  ) {
    if (
      !canManageParticipants ||
      participant.status !== 'active'
    ) {
      return
    }

    setOperationId(
      `retire:${participant.id}`,
    )
    setOperationError(null)

    try {
      await gateway.retireParticipant(
        chronicleId,
        participant.id,
      )

      await refreshParticipants()
    } catch (retireError: unknown) {
      setOperationError(
        operationErrorMessage(
          retireError,
        ),
      )
    } finally {
      setOperationId(null)
    }
  }

  async function associateCharacter(
    character:
      CharacterDraftApiSnapshot,
  ) {
    setOperationId(
      `associate:${character.characterId}`,
    )
    setOperationError(null)

    try {
      await characterGateway
        .updateChronicleAssociation(
          character.characterId,
          {
            expectedRevision:
              character.revision,
            chronicleId,
            confirmChange: false,
          },
        )

      await refreshCharacters()
    } catch (associationError: unknown) {
      setOperationError(
        operationErrorMessage(
          associationError,
        ),
      )
    } finally {
      setOperationId(null)
    }
  }

  async function disassociateCharacter(
    character:
      CharacterDraftApiSnapshot,
    confirmChange: boolean,
  ) {
    setOperationId(
      `disassociate:${character.characterId}`,
    )
    setOperationError(null)

    try {
      await characterGateway
        .updateChronicleAssociation(
          character.characterId,
          {
            expectedRevision:
              character.revision,
            chronicleId: null,
            confirmChange,
          },
        )

      setPendingConfirmationCharacterId(
        null,
      )

      await refreshCharacters()
    } catch (associationError: unknown) {
      if (
        associationError instanceof
          CharacterDraftApiError &&
        associationError.code ===
          'CHARACTER_CHRONICLE_CONFIRMATION_REQUIRED'
      ) {
        setPendingConfirmationCharacterId(
          character.characterId,
        )
      }

      setOperationError(
        operationErrorMessage(
          associationError,
        ),
      )
    } finally {
      setOperationId(null)
    }
  }

  function renderParticipant(
    participant:
      ChronicleParticipantApiSnapshot,
  ) {
    const retiring =
      operationId ===
      `retire:${participant.id}`

    return (
      <li
        key={participant.id}
        className="chronicle-detail__participant"
      >
        <div>
          <strong>
            {participant.displayName}
          </strong>
          {readableUsername(
            participant.username,
          ) !== null ? (
            <span>
              {readableUsername(
                participant.username,
              )}
            </span>
          ) : null}
        </div>

        <div className="chronicle-detail__participant-meta">
          <span
            className={
              'chronicle-detail__state ' +
              `chronicle-detail__state--${participant.status}`
            }
          >
            {
              participantStatusLabels[
                participant.status
              ]
            }
          </span>

          {canManageParticipants &&
          participant.status ===
            'active' ? (
            <button
              type="button"
              className="chronicle-detail__compact-action"
              disabled={retiring}
              onClick={() =>
                void retireParticipant(
                  participant,
                )
              }
            >
              {retiring
                ? 'Retirando…'
                : 'Retirar'}
            </button>
          ) : null}
        </div>
      </li>
    )
  }

  if (loading) {
    return (
      <section className="chronicle-detail">
        <ViewStateStatus
          state="loading"
          className="chronicle-detail__message"
        >
          Cargando crónica…
        </ViewStateStatus>
      </section>
    )
  }

  if (
    error !== null ||
    chronicle === null
  ) {
    return (
      <section className="chronicle-detail">
        <div
          className="chronicle-detail__message chronicle-detail__message--error"
          data-view-state="error"
          role="alert"
          aria-live="assertive"
        >
          <p>
            {error ??
              'No se pudo cargar la crónica.'}
          </p>

          <button
            type="button"
            onClick={onBack}
          >
            Volver a crónicas
          </button>
        </div>
      </section>
    )
  }

  const lifecycle =
    lifecycleAction(
      chronicle.status,
    )

  return (
    <section
      className="chronicle-detail"
      aria-labelledby="chronicle-detail-title"
      data-view-state="content"
    >
      <header className="chronicle-detail__header">
        <div>
          <span className="chronicle-detail__eyebrow">
            Crónica
          </span>

          <h1 id="chronicle-detail-title">
            {chronicle.name}
          </h1>
        </div>

        <button
          type="button"
          onClick={onBack}
        >
          Volver a crónicas
        </button>
      </header>

      {operationError !== null ? (
        <p
          className="chronicle-detail__operation-error"
          role="alert"
          aria-live="assertive"
        >
          {operationError}
        </p>
      ) : null}

      <nav
        className="chronicle-detail__sections"
        aria-label="Secciones de la crónica"
      >
        <div
          className="chronicle-detail__section-tabs"
          role="tablist"
          aria-label="Contenido de la crónica"
        >
          <button
            id="chronicle-section-summary-tab"
            type="button"
            role="tab"
            aria-selected={activeSection === 'summary'}
            aria-controls="chronicle-section-summary-panel"
            className={
              activeSection === 'summary'
                ? 'chronicle-detail__section-tab chronicle-detail__section-tab--active'
                : 'chronicle-detail__section-tab'
            }
            onClick={() => setActiveSection('summary')}
          >
            Resumen
          </button>

          <button
            id="chronicle-section-participants-tab"
            type="button"
            role="tab"
            aria-selected={activeSection === 'participants'}
            aria-controls="chronicle-section-participants-panel"
            className={
              activeSection === 'participants'
                ? 'chronicle-detail__section-tab chronicle-detail__section-tab--active'
                : 'chronicle-detail__section-tab'
            }
            onClick={() => setActiveSection('participants')}
          >
            Participantes
          </button>

          {canManageSessions ? (
            <button
              id="chronicle-section-sessions-tab"
              type="button"
              role="tab"
              aria-selected={activeSection === 'sessions'}
              aria-controls="chronicle-section-sessions-panel"
              className={
                activeSection === 'sessions'
                  ? 'chronicle-detail__section-tab chronicle-detail__section-tab--active'
                  : 'chronicle-detail__section-tab'
              }
              onClick={() => setActiveSection('sessions')}
            >
              Sesiones
            </button>
          ) : null}

          {canManageEvents ? (
            <button
              id="chronicle-section-story-tab"
              type="button"
              role="tab"
              aria-selected={activeSection === 'story'}
              aria-controls="chronicle-section-story-panel"
              className={
                activeSection === 'story'
                  ? 'chronicle-detail__section-tab chronicle-detail__section-tab--active'
                  : 'chronicle-detail__section-tab'
              }
              onClick={() => setActiveSection('story')}
            >
              Historia
            </button>
          ) : null}

          {canManageNpcs || canManageLocations ? (
            <button
              id="chronicle-section-resources-tab"
              type="button"
              role="tab"
              aria-selected={activeSection === 'resources'}
              aria-controls="chronicle-section-resources-panel"
              className={
                activeSection === 'resources'
                  ? 'chronicle-detail__section-tab chronicle-detail__section-tab--active'
                  : 'chronicle-detail__section-tab'
              }
              onClick={() => setActiveSection('resources')}
            >
              Recursos
            </button>
          ) : null}
        </div>
      </nav>

      <section
        id="chronicle-section-summary-panel"
        className="chronicle-detail__summary"
        aria-labelledby="chronicle-summary-title"
        hidden={activeSection !== 'summary'}
      >
        <div className="chronicle-detail__summary-heading">
          <h2 id="chronicle-summary-title">
            Resumen
          </h2>

          <span className="chronicle-detail__status">
            {
              statusLabels[
                chronicle.status
              ]
            }
          </span>
        </div>

        {chronicle.description !==
        null ? (
          <p className="chronicle-detail__description">
            {chronicle.description}
          </p>
        ) : (
          <p className="chronicle-detail__empty">
            Sin descripción o premisa.
          </p>
        )}

        <dl
          className="chronicle-detail__overview"
          aria-label="Situación actual de la crónica"
        >
          <div>
            <dt>Tu papel</dt>
            <dd>
              {currentMembership?.role ===
              'narrator'
                ? 'Narrador'
                : 'Jugador'}
            </dd>
          </div>

          <div>
            <dt>Narradores activos</dt>
            <dd>{activeNarratorCount}</dd>
          </div>

          <div>
            <dt>Jugadores activos</dt>
            <dd>{activePlayerCount}</dd>
          </div>

          <div>
            <dt>Personajes asociados</dt>
            <dd>
              {associatedCharacters.length}
            </dd>
          </div>
        </dl>

        <dl className="chronicle-detail__metadata">
          <div>
            <dt>Creada</dt>
            <dd>
              {technicalDate(
                chronicle.createdAt,
              )}
            </dd>
          </div>

          <div>
            <dt>Última actualización</dt>
            <dd>
              {technicalDate(
                chronicle.updatedAt,
              )}
            </dd>
          </div>
        </dl>

        {canManageParticipants ? (
          <button
            type="button"
            className="chronicle-detail__primary-action"
            disabled={
              operationId ===
              'chronicle-lifecycle'
            }
            onClick={() =>
              void transitionChronicle()
            }
          >
            {operationId ===
            'chronicle-lifecycle'
              ? 'Actualizando…'
              : lifecycle.label}
          </button>
        ) : null}
      </section>

      <div
        id="chronicle-section-participants-panel"
        className="chronicle-detail__grid"
        hidden={activeSection !== 'participants'}
      >
        <section
          className="chronicle-detail__panel"
          aria-labelledby="chronicle-narrators-title"
        >
          <div className="chronicle-detail__panel-heading">
            <div>
              <span>Participantes</span>
              <h2 id="chronicle-narrators-title">
                Narradores
              </h2>
            </div>

            <span className="chronicle-detail__count">
              {narrators.length}
            </span>
          </div>

          {narrators.length === 0 ? (
            <p className="chronicle-detail__empty">
              No hay Narradores registrados.
            </p>
          ) : (
            <ul className="chronicle-detail__participants">
              {narrators.map(
                renderParticipant,
              )}
            </ul>
          )}
        </section>

        <section
          className="chronicle-detail__panel"
          aria-labelledby="chronicle-players-title"
        >
          <div className="chronicle-detail__panel-heading">
            <div>
              <span>Participantes</span>
              <h2 id="chronicle-players-title">
                Jugadores
              </h2>
            </div>

            <span className="chronicle-detail__count">
              {players.length}
            </span>
          </div>

          {players.length === 0 ? (
            <p className="chronicle-detail__empty">
              No hay Jugadores registrados.
            </p>
          ) : (
            <ul className="chronicle-detail__participants">
              {players.map(
                renderParticipant,
              )}
            </ul>
          )}
        </section>
      </div>

      {canManageParticipants ? (
        <section
          className="chronicle-detail__participant-admin"
          hidden={activeSection !== 'participants'}
          aria-label="Administración contextual de participantes"
        >
          <button
            type="button"
            className="chronicle-detail__fold-launcher"
            aria-expanded={showParticipantAdmin}
            aria-controls="chronicle-participant-admin-panel"
            onClick={() =>
              setShowParticipantAdmin(
                (current) => !current,
              )
            }
          >
            <span>
              <strong>
                Incorporar participante
              </strong>
              <small>
                Añade un usuario a la crónica con su rol contextual.
              </small>
            </span>

            <span aria-hidden="true">
              {showParticipantAdmin
                ? '−'
                : '+'}
            </span>
          </button>

          {showParticipantAdmin ? (
            <div
              id="chronicle-participant-admin-panel"
              className="chronicle-detail__fold-content"
            >
              {candidates.length === 0 ? (
                <p className="chronicle-detail__empty">
                  No hay usuarios disponibles para incorporar.
                </p>
              ) : (
                <form
                  className="chronicle-detail__participant-form"
                  onSubmit={addParticipant}
                >
                  <label>
                    <span>Usuario</span>
                    <select
                      value={
                        selectedCandidateId
                      }
                      onChange={(event) =>
                        setSelectedCandidateId(
                          event.target.value,
                        )
                      }
                    >
                      {candidates.map(
                        (candidate) => (
                          <option
                            key={candidate.id}
                            value={candidate.id}
                          >
                            {candidate.displayName}
                          </option>
                        ),
                      )}
                    </select>
                  </label>

                  <label>
                    <span>Rol contextual</span>
                    <select
                      value={selectedRole}
                      onChange={(event) =>
                        setSelectedRole(
                          event.target.value as
                            ChronicleParticipantApiRole,
                        )
                      }
                    >
                      <option value="player">
                        Jugador
                      </option>
                      <option value="narrator">
                        Narrador
                      </option>
                    </select>
                  </label>

                  <button
                    type="submit"
                    disabled={
                      operationId ===
                      'add-participant'
                    }
                  >
                    {operationId ===
                    'add-participant'
                      ? 'Incorporando…'
                      : 'Incorporar'}
                  </button>
                </form>
              )}
            </div>
          ) : null}
        </section>
      ) : null}

      <div
        id="chronicle-section-resources-panel"
        hidden={activeSection !== 'resources'}
      >
        {canManageNpcs ||
        canManageLocations ? (
          <ChronicleResourcesWorkspace
            chronicleId={chronicleId}
            canManageNpcs={canManageNpcs}
            canManageLocations={
              canManageLocations
            }
          />
        ) : null}
      </div>

      <div
        id="chronicle-section-story-panel"
        hidden={activeSection !== 'story'}
      >
        {canManageEvents ? (
        <ChronicleEventPanel
          chronicleId={chronicleId}
        />
      ) : null}

      </div>

      <div
        id="chronicle-section-sessions-panel"
        hidden={activeSection !== 'sessions'}
      >
        {canManageSessions ? (
        <>
          <ChronicleSessionPanel
            chronicleId={chronicleId}
            associatedCharacters={
              associatedCharacters
            }
          />
</>
      ) : null}

      </div>

      <section
        className="chronicle-detail__panel chronicle-detail__characters"
        hidden={activeSection !== 'participants'}
        aria-labelledby="chronicle-characters-title"
      >
        <div className="chronicle-detail__panel-heading">
          <div>
            <span>Crónica</span>
            <h2 id="chronicle-characters-title">
              Personajes asociados
            </h2>
          </div>

          <span className="chronicle-detail__count">
            {associatedCharacters.length}
          </span>
        </div>

        {associatedCharacters.length ===
        0 ? (
          <p className="chronicle-detail__empty">
            No hay personajes asociados.
          </p>
        ) : (
          <ul className="chronicle-detail__character-list">
            {associatedCharacters.map(
              (character) => {
                const owned =
                  ownCharacter(
                    character.characterId,
                  )

                const pendingConfirmation =
                  pendingConfirmationCharacterId ===
                  character.characterId

                const changing =
                  operationId ===
                  `disassociate:${character.characterId}`

                return (
                  <li
                    key={
                      character.characterId
                    }
                    className="chronicle-detail__character"
                  >
                    <div>
                      <div className="chronicle-detail__character-heading">
                        <strong>
                          {character.name.trim()
                            .length > 0
                            ? character.name
                            : 'Personaje sin nombre'}
                        </strong>

                        <span className="chronicle-detail__state">
                          {
                            characterStatusLabels[
                              character.status
                            ]
                          }
                        </span>
                      </div>

                      {character.concept !==
                      null ? (
                        <p>
                          {character.concept}
                        </p>
                      ) : null}

                      {character.ownerId ===
                      authenticatedUser.id ? (
                        <small>
                          Tu personaje
                        </small>
                      ) : null}
                    </div>

                    {owned !==
                    undefined ? (
                      <div className="chronicle-detail__character-actions">
                        <button
                          type="button"
                          className="chronicle-detail__compact-action"
                          disabled={changing}
                          onClick={() =>
                            void disassociateCharacter(
                              owned,
                              false,
                            )
                          }
                        >
                          {changing
                            ? 'Actualizando…'
                            : 'Desasociar'}
                        </button>

                        {pendingConfirmation ? (
                          <button
                            type="button"
                            className="chronicle-detail__compact-action"
                            disabled={changing}
                            onClick={() =>
                              void disassociateCharacter(
                                owned,
                                true,
                              )
                            }
                          >
                            Confirmar desasociación
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                )
              },
            )}
          </ul>
        )}

        <div className="chronicle-detail__association">
          <button
            type="button"
            className="chronicle-detail__fold-launcher"
            aria-expanded={showCharacterAssociation}
            aria-controls="chronicle-character-association-panel"
            onClick={() =>
              setShowCharacterAssociation(
                (current) => !current,
              )
            }
          >
            <span>
              <strong>
                Asociar uno de tus personajes
              </strong>
              <small>
                Añade uno de tus personajes independientes a esta crónica.
              </small>
            </span>

            <span aria-hidden="true">
              {showCharacterAssociation
                ? '−'
                : '+'}
            </span>
          </button>

          {showCharacterAssociation ? (
            <div
              id="chronicle-character-association-panel"
              className="chronicle-detail__fold-content"
            >
              <p>
                Sólo se muestran personajes independientes.
                Para mover uno desde otra crónica debes
                resolver primero su relación allí.
              </p>

              {independentOwnCharacters.length ===
              0 ? (
                <p className="chronicle-detail__empty">
                  No tienes personajes independientes disponibles.
                </p>
              ) : (
                <ul className="chronicle-detail__association-list">
                  {independentOwnCharacters.map(
                    (character) => {
                      const associating =
                        operationId ===
                        `associate:${character.characterId}`

                      return (
                        <li
                          key={
                            character.characterId
                          }
                        >
                          <div>
                            <strong>
                              {characterName(
                                character,
                              )}
                            </strong>
                            <span>
                              {
                                characterStatusLabels[
                                  character.status
                                ]
                              }
                            </span>
                          </div>

                          <button
                            type="button"
                            className="chronicle-detail__compact-action"
                            disabled={associating}
                            onClick={() =>
                              void associateCharacter(
                                character,
                              )
                            }
                          >
                            {associating
                              ? 'Asociando…'
                              : 'Asociar'}
                          </button>
                        </li>
                      )
                    },
                  )}
                </ul>
              )}
            </div>
          ) : null}
        </div>
      </section>
    </section>
  )
}
