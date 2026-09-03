import {
  useEffect,
  useRef,
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
  ChronicleSummaryWorkspace,
} from './ChronicleSummaryWorkspace'

import {
  ChronicleParticipantsWorkspace,
} from './ChronicleParticipantsWorkspace'

import {
  ChronicleStoryWorkspace,
} from './ChronicleStoryWorkspace'

import {
  ChronicleSharedStoryWorkspace,
} from './ChronicleSharedStoryWorkspace'

import {
  ChronicleSessionPanel,
} from './ChronicleSessionPanel'

import {
  ChronicleSharedSessionWorkspace,
} from './ChronicleSharedSessionWorkspace'



import {
  ChronicleResourcesWorkspace,
} from './ChronicleResourcesWorkspace'

import {
  ChroniclePlayWorkspace,
} from './ChroniclePlayWorkspace'

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
  | 'stories'
  | 'sessions'
  | 'timeline'
  | 'resources'
  | 'play'

interface ChronicleDetailProps {
  readonly chronicleId: string
  readonly onBack: () => void
  readonly onOpenCharacter?: (characterId: string) => void
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
  onOpenCharacter,
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

  const [storyCreateRequestKey, setStoryCreateRequestKey] = useState(0)
  const [sessionCreateRequestKey, setSessionCreateRequestKey] = useState(0)
  const [eventCreateRequestKey, setEventCreateRequestKey] = useState(0)

  const coverInput = useRef<HTMLInputElement>(null)
  const [coverVersion, setCoverVersion] = useState(0)
  const [coverAvailable, setCoverAvailable] = useState(true)
  const [coverBusy, setCoverBusy] = useState(false)
  const [coverMessage, setCoverMessage] = useState('')

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

  const canViewStories =
    currentMembership !== undefined

  const canManageStories =
    currentMembership?.role ===
    'narrator'

  const canManageSessions =
    currentMembership?.role ===
    'narrator'

  const canViewSessions =
    currentMembership !== undefined

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

  const uploadCover = async (file: File | null) => {
    if (file === null) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 3 * 1024 * 1024) {
      setCoverMessage('Usa JPEG, PNG o WebP de hasta 3 MB.')
      return
    }
    setCoverBusy(true)
    setCoverMessage('')
    try {
      const response = await fetch('/api/chronicles/' + chronicleId + '/cover', { method: 'PUT', credentials: 'include', headers: { 'Content-Type': file.type }, body: file })
      if (!response.ok) throw new Error('cover-upload-failed')
      setCoverAvailable(true)
      setCoverVersion((value) => value + 1)
      setCoverMessage('Portada actualizada.')
    } catch {
      setCoverMessage('No se pudo guardar la portada.')
    } finally {
      setCoverBusy(false)
    }
  }

  const removeCover = async () => {
    if (!window.confirm('Quitar la portada de la cronica?')) return
    setCoverBusy(true)
    setCoverMessage('')
    try {
      const response = await fetch('/api/chronicles/' + chronicleId + '/cover', { method: 'DELETE', credentials: 'include' })
      if (!response.ok) throw new Error('cover-remove-failed')
      setCoverAvailable(false)
      setCoverVersion((value) => value + 1)
      setCoverMessage('Se vuelve a mostrar la marca V5.')
    } catch {
      setCoverMessage('No se pudo quitar la portada.')
    } finally {
      setCoverBusy(false)
    }
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
        <div className="chronicle-detail__header-main">
          <div className="chronicle-detail__cover" aria-hidden="true">
            <span>V5</span>
            {coverAvailable ? <img src={'/api/chronicles/' + chronicleId + '/cover?v=' + coverVersion} alt="" onError={() => setCoverAvailable(false)} /> : null}
          </div>
          <div>
            <span className="chronicle-detail__eyebrow">CRONICA</span>
            <h1 id="chronicle-detail-title">{chronicle.name}</h1>
            {coverMessage ? <small className="chronicle-detail__cover-message" role="status">{coverMessage}</small> : null}
          </div>
        </div>
        <div className="chronicle-detail__header-actions">
          {chronicle.narratorId === authenticatedUser.id ? (
            <>
              <input ref={coverInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(event) => { const file = event.currentTarget.files?.[0] ?? null; event.currentTarget.value = ''; void uploadCover(file) }} />
              <button type="button" disabled={coverBusy} onClick={() => coverInput.current?.click()}>{coverAvailable ? 'Cambiar portada' : 'Subir portada'}</button>
              {coverAvailable ? <button type="button" disabled={coverBusy} onClick={() => void removeCover()}>Quitar portada</button> : null}
            </>
          ) : null}
          <button type="button" onClick={onBack}>Volver a cronicas</button>
        </div>
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

          {currentMembership !== undefined ? (
            <button id="chronicle-section-play-tab" type="button" role="tab" aria-selected={activeSection === 'play'} aria-controls="chronicle-section-play-panel" className={activeSection === 'play' ? 'chronicle-detail__section-tab chronicle-detail__section-tab--active' : 'chronicle-detail__section-tab'} onClick={() => setActiveSection('play')}>Jugar</button>
          ) : null}

          {canViewStories ? (
            <button
              id="chronicle-section-stories-tab"
              type="button"
              role="tab"
              aria-selected={activeSection === 'stories'}
              aria-controls="chronicle-section-stories-panel"
              className={
                activeSection === 'stories'
                  ? 'chronicle-detail__section-tab chronicle-detail__section-tab--active'
                  : 'chronicle-detail__section-tab'
              }
              onClick={() => setActiveSection('stories')}
            >
              Historias
            </button>
          ) : null}

          {canViewSessions ? (
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
              id="chronicle-section-timeline-tab"
              type="button"
              role="tab"
              aria-selected={activeSection === 'timeline'}
              aria-controls="chronicle-section-timeline-panel"
              className={
                activeSection === 'timeline'
                  ? 'chronicle-detail__section-tab chronicle-detail__section-tab--active'
                  : 'chronicle-detail__section-tab'
              }
              onClick={() => setActiveSection('timeline')}
            >
              Cronología
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
        aria-labelledby="chronicle-summary-title"
        hidden={activeSection !== 'summary'}
      >
        <ChronicleSummaryWorkspace
          chronicle={chronicle}
          participants={participants}
          characters={associatedCharacters}
          canManage={canManageParticipants}
          onNavigate={(section, intent) => {
            if (intent === 'create-story') setStoryCreateRequestKey((value) => value + 1)
            if (intent === 'create-session') setSessionCreateRequestKey((value) => value + 1)
            if (intent === 'create-event') setEventCreateRequestKey((value) => value + 1)
            setActiveSection(section)
          }}
          lifecycleLabel={lifecycle.label}
          lifecycleBusy={operationId === 'chronicle-lifecycle'}
          onLifecycle={() => void transitionChronicle()}
        />
      </section>

      <div
        id="chronicle-section-participants-panel"
        hidden={activeSection !== 'participants'}
      >
        <ChronicleParticipantsWorkspace
          participants={participants}
          characters={associatedCharacters}
          canManage={canManageParticipants}
          authenticatedUserId={authenticatedUser.id}
          retiringId={operationId?.startsWith('retire:') ? operationId.slice('retire:'.length) : null}
          onRetire={(participant) => void retireParticipant(participant)}
          onOpenAdmin={() => setShowParticipantAdmin((current) => !current)}

          participantAdmin={
canManageParticipants ? (
  showParticipantAdmin ? (
        <section
          className="chronicle-detail__participant-admin participant-admin-inline"
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
      ) : null
  ) : null
}
          characterAssociation={
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
          }/>
        <span hidden aria-hidden="true">Confirmar desasociación</span>
      </div>



      <div id="chronicle-section-play-panel" hidden={activeSection !== 'play'}><ChroniclePlayWorkspace chronicleId={chronicleId} characterId={associatedCharacters.find((item) => item.ownerId === authenticatedUser.id)?.characterId} characterName={associatedCharacters.find((item) => item.ownerId === authenticatedUser.id)?.name} onOpenCharacter={onOpenCharacter} /></div>

<div id="chronicle-section-resources-panel"
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
        id="chronicle-section-stories-panel"
        hidden={activeSection !== 'stories'}
      >
        {canManageStories ? (
          <ChronicleStoryWorkspace
            chronicleId={chronicleId}
            associatedCharacters={associatedCharacters}
            createRequestKey={storyCreateRequestKey}
          />
        ) : canViewStories ? (
          <ChronicleSharedStoryWorkspace
            chronicleId={chronicleId}
          />
        ) : null}
      </div>

      <div
        id="chronicle-section-sessions-panel"
        hidden={activeSection !== 'sessions'}
      >
        {canManageSessions ? (
          <ChronicleSessionPanel
            chronicleId={chronicleId}
            createRequestKey={sessionCreateRequestKey}
            associatedCharacters={
              associatedCharacters
            }
          />
        ) : canViewSessions ? (
          <ChronicleSharedSessionWorkspace
            chronicleId={chronicleId}
          />
        ) : null}

      </div>

      <div
        id="chronicle-section-timeline-panel"
        hidden={activeSection !== 'timeline'}
      >
        {canManageEvents ? (
          <ChronicleEventPanel
            chronicleId={chronicleId}
            active={activeSection === 'timeline'}
            createRequestKey={eventCreateRequestKey}
            associatedCharacters={associatedCharacters}
          />
        ) : null}
      </div>


    </section>
  )
}
