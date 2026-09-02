import type {
  ChronicleParticipantCandidateApiPage,
} from '../types/chronicle-api.types'

import type {
  ChronicleEventApiPage,
} from '../types/chronicle-api.types'

import type {
  ChronicleLocationApiPage,
} from '../types/chronicle-api.types'

import type {
  ChronicleNpcApiPage,
  ChronicleSessionAttendanceApiPage,
  ChronicleSessionAttendanceApiSnapshot,
  ChronicleSessionAttendanceRemovalApiResponse,
  AddChronicleSessionAttendanceApiRequest,
  ChronicleSessionApiPage,
  ChronicleSessionContextApiSnapshot,
  ReplaceChronicleSessionContextApiRequest,
} from '../types/chronicle-api.types'

import type {
  ChronicleCharacterApiPage,
  ChronicleParticipantApiPage,
} from '../types/chronicle-api.types'

import type {
  ChronicleApiPage,
  ChronicleListQuery,
} from '../types/chronicle-api.types'

import type {
  AddChronicleParticipantApiRequest,
  ChronicleApiSnapshot,
  ChronicleApiStatus,
  ChronicleCharacterApiSummary,
  ChronicleEventApiSnapshot,
  ChronicleSessionApiSnapshot,
  ChronicleLocationApiSnapshot,
  ChronicleNpcApiSnapshot,
  ChronicleParticipantApiRole,
  ChronicleParticipantApiSnapshot,
  ChronicleParticipantApiStatus,
  ChronicleParticipantCandidateApiSnapshot,
  CreateChronicleApiRequest,
  CreateChronicleEventApiRequest,
  CreateChronicleSessionApiRequest,
  CreateChronicleLocationApiRequest,
  CreateChronicleNpcApiRequest,
  ReorderChronicleEventsApiRequest,
  TransitionChronicleLifecycleApiRequest,
  UpdateChronicleEventApiRequest,
  UpdateChronicleSessionApiRequest,
  UpdateChronicleLocationApiRequest,
  UpdateChronicleNpcApiRequest,
} from '../types/chronicle-api.types.ts'

type FetchImplementation =
  typeof globalThis.fetch

type UnknownRecord =
  Record<string, unknown>

const statuses = [
  'preparation',
  'active',
  'archived',
] as const satisfies readonly ChronicleApiStatus[]

export class ChronicleApiError
  extends Error {
  readonly status: number
  readonly code: string

  constructor(
    status: number,
    code: string,
  ) {
    super(code)
    this.name = 'ChronicleApiError'
    this.status = status
    this.code = code
  }
}

export interface ChronicleGateway {
  listPage(
    query?: ChronicleListQuery,
  ): Promise<ChronicleApiPage>

  list(): Promise<
    readonly ChronicleApiSnapshot[]
  >

  create(
    request: CreateChronicleApiRequest,
  ): Promise<ChronicleApiSnapshot>
}

export interface ChronicleLifecycleGateway
  extends ChronicleGateway {
  get(
    chronicleId: string,
  ): Promise<ChronicleApiSnapshot>

  transition(
    chronicleId: string,
    request:
      TransitionChronicleLifecycleApiRequest,
  ): Promise<ChronicleApiSnapshot>

  participantsPage(
    chronicleId: string,
    query?: ChronicleListQuery,
  ): Promise<ChronicleParticipantApiPage>

  participants(
    chronicleId: string,
  ): Promise<
    readonly ChronicleParticipantApiSnapshot[]
  >

  participantCandidatesPage(
    chronicleId: string,
    query?: ChronicleListQuery,
  ): Promise<ChronicleParticipantCandidateApiPage>

  participantCandidates(
    chronicleId: string,
  ): Promise<
    readonly ChronicleParticipantCandidateApiSnapshot[]
  >

  addParticipant(
    chronicleId: string,
    request:
      AddChronicleParticipantApiRequest,
  ): Promise<ChronicleParticipantApiSnapshot>

  retireParticipant(
    chronicleId: string,
    participantId: string,
  ): Promise<ChronicleParticipantApiSnapshot>

  charactersPage(
    chronicleId: string,
    query?: ChronicleListQuery,
  ): Promise<ChronicleCharacterApiPage>

  characters(
    chronicleId: string,
  ): Promise<
    readonly ChronicleCharacterApiSummary[]
  >

  npcs(
    chronicleId: string,
    query?: ChronicleListQuery,
  ): Promise<ChronicleNpcApiPage>

  npc(
    chronicleId: string,
    npcId: string,
  ): Promise<ChronicleNpcApiSnapshot>

  createNpc(
    chronicleId: string,
    request: CreateChronicleNpcApiRequest,
  ): Promise<ChronicleNpcApiSnapshot>

  updateNpc(
    chronicleId: string,
    npcId: string,
    request: UpdateChronicleNpcApiRequest,
  ): Promise<ChronicleNpcApiSnapshot>

  archiveNpc(
    chronicleId: string,
    npcId: string,
  ): Promise<ChronicleNpcApiSnapshot>

  locationsPage(
    chronicleId: string,
    query?: ChronicleListQuery,
  ): Promise<ChronicleLocationApiPage>

  locations(
    chronicleId: string,
  ): Promise<
    readonly ChronicleLocationApiSnapshot[]
  >

  location(
    chronicleId: string,
    locationId: string,
  ): Promise<ChronicleLocationApiSnapshot>

  createLocation(
    chronicleId: string,
    request:
      CreateChronicleLocationApiRequest,
  ): Promise<ChronicleLocationApiSnapshot>

  updateLocation(
    chronicleId: string,
    locationId: string,
    request:
      UpdateChronicleLocationApiRequest,
  ): Promise<ChronicleLocationApiSnapshot>

  archiveLocation(
    chronicleId: string,
    locationId: string,
  ): Promise<ChronicleLocationApiSnapshot>

  eventsPage(
    chronicleId: string,
    query?: ChronicleListQuery,
  ): Promise<ChronicleEventApiPage>

  events(
    chronicleId: string,
  ): Promise<
    readonly ChronicleEventApiSnapshot[]
  >

  event(
    chronicleId: string,
    eventId: string,
  ): Promise<ChronicleEventApiSnapshot>

  createEvent(
    chronicleId: string,
    request:
      CreateChronicleEventApiRequest,
  ): Promise<ChronicleEventApiSnapshot>

  updateEvent(
    chronicleId: string,
    eventId: string,
    request:
      UpdateChronicleEventApiRequest,
  ): Promise<ChronicleEventApiSnapshot>

  reorderEvents(
    chronicleId: string,
    request:
      ReorderChronicleEventsApiRequest,
  ): Promise<
    readonly ChronicleEventApiSnapshot[]
  >

  archiveEvent(
    chronicleId: string,
    eventId: string,
  ): Promise<ChronicleEventApiSnapshot>


  sessionContext(
    chronicleId: string,
    sessionId: string,
  ): Promise<ChronicleSessionContextApiSnapshot>

  replaceSessionContext(
    chronicleId: string,
    sessionId: string,
    request:
      ReplaceChronicleSessionContextApiRequest,
  ): Promise<ChronicleSessionContextApiSnapshot>

  sessionAttendancesPage(
    chronicleId: string,
    sessionId: string,
    query?: ChronicleListQuery,
  ): Promise<ChronicleSessionAttendanceApiPage>
  sessionAttendances(
    chronicleId: string,
    sessionId: string,
  ): Promise<
    readonly ChronicleSessionAttendanceApiSnapshot[]
  >
  addSessionAttendance(
    chronicleId: string,
    sessionId: string,
    request:
      AddChronicleSessionAttendanceApiRequest,
  ): Promise<ChronicleSessionAttendanceApiSnapshot>
  removeSessionAttendance(
    chronicleId: string,
    sessionId: string,
    characterId: string,
  ): Promise<
    ChronicleSessionAttendanceRemovalApiResponse
  >
  sessions(
    chronicleId: string,
    query?: ChronicleListQuery,
  ): Promise<ChronicleSessionApiPage>

  session(
    chronicleId: string,
    sessionId: string,
  ): Promise<ChronicleSessionApiSnapshot>

  createSession(
    chronicleId: string,
    request:
      CreateChronicleSessionApiRequest,
  ): Promise<ChronicleSessionApiSnapshot>

  updateSession(
    chronicleId: string,
    sessionId: string,
    request:
      UpdateChronicleSessionApiRequest,
  ): Promise<ChronicleSessionApiSnapshot>

  completeSession(
    chronicleId: string,
    sessionId: string,
  ): Promise<ChronicleSessionApiSnapshot>

  archiveSession(
    chronicleId: string,
    sessionId: string,
  ): Promise<ChronicleSessionApiSnapshot>
}

function isRecord(
  value: unknown,
): value is UnknownRecord {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function isStringOrNull(
  value: unknown,
): value is string | null {
  return (
    value === null ||
    typeof value === 'string'
  )
}

function validTimestamp(
  value: unknown,
): value is string {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    !Number.isNaN(Date.parse(value))
  )
}

function validStatus(
  value: unknown,
): value is ChronicleApiStatus {
  return (
    typeof value === 'string' &&
    statuses.includes(
      value as ChronicleApiStatus,
    )
  )
}

function validParticipantRole(
  value: unknown,
): value is ChronicleParticipantApiRole {
  return (
    value === 'narrator' ||
    value === 'player'
  )
}

function validParticipantStatus(
  value: unknown,
): value is ChronicleParticipantApiStatus {
  return (
    value === 'active' ||
    value === 'retired'
  )
}

export function parseChronicleParticipantResponse(
  value: unknown,
): ChronicleParticipantApiSnapshot {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.chronicleId !== 'string' ||
    typeof value.userId !== 'string' ||
    typeof value.username !== 'string' ||
    typeof value.displayName !== 'string' ||
    !validParticipantRole(value.role) ||
    !validParticipantStatus(value.status) ||
    !validTimestamp(value.createdAt) ||
    !validTimestamp(value.updatedAt)
  ) {
    return invalidResponse()
  }

  return {
    id: value.id,
    chronicleId: value.chronicleId,
    userId: value.userId,
    username: value.username,
    displayName: value.displayName,
    role: value.role,
    status: value.status,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  }
}

export function parseChronicleParticipantCandidateResponse(
  value: unknown,
): ChronicleParticipantCandidateApiSnapshot {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.username !== 'string' ||
    typeof value.displayName !== 'string'
  ) {
    return invalidResponse()
  }

  return {
    id: value.id,
    username: value.username,
    displayName: value.displayName,
  }
}

export function parseChronicleCharacterSummaryResponse(
  value: unknown,
): ChronicleCharacterApiSummary {
  if (
    !isRecord(value) ||
    typeof value.characterId !== 'string' ||
    typeof value.ownerId !== 'string' ||
    typeof value.chronicleId !== 'string' ||
    !(
      value.status === 'draft' ||
      value.status === 'active' ||
      value.status === 'archived'
    ) ||
    typeof value.name !== 'string' ||
    !isStringOrNull(value.concept) ||
    !validTimestamp(value.updatedAt)
  ) {
    return invalidResponse()
  }

  return {
    characterId: value.characterId,
    ownerId: value.ownerId,
    chronicleId: value.chronicleId,
    status: value.status,
    name: value.name,
    concept: value.concept,
    updatedAt: value.updatedAt,
  }
}

export function parseChronicleLocationResponse(
  value: unknown,
): ChronicleLocationApiSnapshot {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.chronicleId !== 'string' ||
    !isStringOrNull(value.parentLocationId) ||
    typeof value.name !== 'string' ||
    !isStringOrNull(value.category) ||
    !isStringOrNull(value.description) ||
    !isStringOrNull(value.narratorNotes) ||
    !(
      value.status === 'active' ||
      value.status === 'archived'
    ) ||
    !validTimestamp(value.createdAt) ||
    !validTimestamp(value.updatedAt)
  ) {
    return invalidResponse()
  }

  return {
    id: value.id,
    chronicleId: value.chronicleId,
    parentLocationId:
      value.parentLocationId,
    name: value.name,
    category: value.category,
    description: value.description,
    narratorNotes:
      value.narratorNotes,
    status: value.status,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  }
}

export function parseChronicleEventResponse(
  value: unknown,
): ChronicleEventApiSnapshot {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.chronicleId !== 'string' ||
    typeof value.title !== 'string' ||
    !isStringOrNull(value.description) ||
    !isStringOrNull(value.narratorNotes) ||
    !isStringOrNull(value.narrativeTimeLabel) ||
    !(
      value.realDate === null ||
      validTimestamp(value.realDate)
    ) ||
    typeof value.timelineOrder !== 'number' ||
    !Number.isInteger(value.timelineOrder) ||
    value.timelineOrder < 0 ||
    !(
      value.status === 'active' ||
      value.status === 'archived'
    ) ||
    !validTimestamp(value.createdAt) ||
    !validTimestamp(value.updatedAt)
  ) {
    return invalidResponse()
  }

  return {
    id: value.id,
    chronicleId: value.chronicleId,
    title: value.title,
    description: value.description,
    narratorNotes: value.narratorNotes,
    narrativeTimeLabel:
      value.narrativeTimeLabel,
    realDate: value.realDate,
    timelineOrder: value.timelineOrder,
    status: value.status,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  }
}

export function parseChronicleSessionAttendanceResponse(
  value: unknown,
): ChronicleSessionAttendanceApiSnapshot {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.sessionId !== 'string' ||
    typeof value.characterId !== 'string' ||
    !validTimestamp(value.createdAt) ||
    !validTimestamp(value.updatedAt)
  ) {
    return invalidResponse()
  }

  return {
    id: value.id,
    sessionId: value.sessionId,
    characterId: value.characterId,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  }
}

export function parseChronicleSessionAttendanceRemovalResponse(
  value: unknown,
): ChronicleSessionAttendanceRemovalApiResponse {
  if (
    !isRecord(value) ||
    typeof value.sessionId !== 'string' ||
    typeof value.characterId !== 'string' ||
    value.attending !== false
  ) {
    return invalidResponse()
  }

  return {
    sessionId: value.sessionId,
    characterId: value.characterId,
    attending: false,
  }
}

function validContextResourceStatus(
  value: unknown,
): value is 'active' | 'archived' {
  return (
    value === 'active' ||
    value === 'archived'
  )
}

function parseChronicleSessionContextEventResponse(
  value: unknown,
) {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.title !== 'string' ||
    !validContextResourceStatus(
      value.status,
    ) ||
    !isStringOrNull(
      value.narrativeTimeLabel,
    ) ||
    !(
      value.realDate === null ||
      validTimestamp(value.realDate)
    ) ||
    typeof value.timelineOrder !== 'number' ||
    !Number.isInteger(
      value.timelineOrder,
    ) ||
    value.timelineOrder < 0
  ) {
    return invalidResponse()
  }

  return {
    id: value.id,
    title: value.title,
    status: value.status,
    narrativeTimeLabel:
      value.narrativeTimeLabel,
    realDate: value.realDate,
    timelineOrder:
      value.timelineOrder,
  }
}

function parseChronicleSessionContextNpcResponse(
  value: unknown,
) {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.name !== 'string' ||
    !validContextResourceStatus(
      value.status,
    ) ||
    !isStringOrNull(
      value.category,
    ) ||
    !isStringOrNull(
      value.narrativeRole,
    )
  ) {
    return invalidResponse()
  }

  return {
    id: value.id,
    name: value.name,
    status: value.status,
    category: value.category,
    narrativeRole:
      value.narrativeRole,
  }
}

function parseChronicleSessionContextLocationResponse(
  value: unknown,
) {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.name !== 'string' ||
    !validContextResourceStatus(
      value.status,
    ) ||
    !isStringOrNull(
      value.category,
    ) ||
    !isStringOrNull(
      value.parentLocationId,
    )
  ) {
    return invalidResponse()
  }

  return {
    id: value.id,
    name: value.name,
    status: value.status,
    category: value.category,
    parentLocationId:
      value.parentLocationId,
  }
}

export function parseChronicleSessionContextResponse(
  value: unknown,
): ChronicleSessionContextApiSnapshot {
  if (
    !isRecord(value) ||
    typeof value.sessionId !== 'string' ||
    !Array.isArray(value.events) ||
    !Array.isArray(value.npcs) ||
    !Array.isArray(value.locations)
  ) {
    return invalidResponse()
  }

  return {
    sessionId: value.sessionId,
    events:
      value.events.map(
        parseChronicleSessionContextEventResponse,
      ),
    npcs:
      value.npcs.map(
        parseChronicleSessionContextNpcResponse,
      ),
    locations:
      value.locations.map(
        parseChronicleSessionContextLocationResponse,
      ),
  }
}

export function parseChronicleSessionResponse(
  value: unknown,
): ChronicleSessionApiSnapshot {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.chronicleId !== 'string' ||
    !(
      value.sessionNumber === null ||
      (
        typeof value.sessionNumber === 'number' &&
        Number.isInteger(value.sessionNumber) &&
        value.sessionNumber >= 0
      )
    ) ||
    !isStringOrNull(value.title) ||
    !(
      value.realDate === null ||
      validTimestamp(value.realDate)
    ) ||
    !(
      value.status === 'preparation' ||
      value.status === 'completed' ||
      value.status === 'archived'
    ) ||
    !isStringOrNull(value.summary) ||
    !isStringOrNull(value.narratorNotes) ||
    !validTimestamp(value.createdAt) ||
    !validTimestamp(value.updatedAt)
  ) {
    return invalidResponse()
  }

  return {
    id: value.id,
    chronicleId: value.chronicleId,
    sessionNumber: value.sessionNumber,
    title: value.title,
    realDate: value.realDate,
    status: value.status,
    summary: value.summary,
    narratorNotes: value.narratorNotes,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  }
}

export function parseChronicleNpcResponse(
  value: unknown,
): ChronicleNpcApiSnapshot {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.chronicleId !== 'string' ||
    typeof value.name !== 'string' ||
    !isStringOrNull(value.category) ||
    !isStringOrNull(value.description) ||
    !isStringOrNull(value.narrativeRole) ||
    !isStringOrNull(value.notes) ||
    !(
      value.status === 'active' ||
      value.status === 'archived'
    ) ||
    !(value.detailLevel === 'simple' || value.detailLevel === 'deep') ||
    !(value.deepProfile === undefined || value.deepProfile === null || isRecord(value.deepProfile)) ||
    !validTimestamp(value.createdAt) ||
    !validTimestamp(value.updatedAt)
  ) {
    return invalidResponse()
  }

  return {
    id: value.id,
    chronicleId: value.chronicleId,
    name: value.name,
    category: value.category,
    description: value.description,
    narrativeRole: value.narrativeRole,
    notes: value.notes,
    status: value.status,
    detailLevel: value.detailLevel,
    deepProfile: value.deepProfile === undefined ? null : value.deepProfile as ChronicleNpcApiSnapshot['deepProfile'],
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  }
}

function parseList<T>(
  value: unknown,
  parser: (item: unknown) => T,
): readonly T[] {
  if (!Array.isArray(value)) {
    return invalidResponse()
  }

  return value.map(parser)
}

function invalidResponse(): never {
  throw new ChronicleApiError(
    502,
    'INVALID_CHRONICLE_RESPONSE',
  )
}

export function parseChronicleApiSnapshotResponse(
  value: unknown,
): ChronicleApiSnapshot {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.narratorId !== 'string' ||
    typeof value.name !== 'string' ||
    !isStringOrNull(value.description) ||
    !validStatus(value.status) ||
    !validTimestamp(value.createdAt) ||
    !validTimestamp(value.updatedAt)
  ) {
    return invalidResponse()
  }

  return {
    id: value.id,
    narratorId: value.narratorId,
    name: value.name,
    description: value.description,
    status: value.status,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  }
}

export function parseChronicleApiListResponse(
  value: unknown,
): readonly ChronicleApiSnapshot[] {
  if (!Array.isArray(value)) {
    return invalidResponse()
  }

  return value.map(
    parseChronicleApiSnapshotResponse,
  )
}

export function parseChronicleApiPageResponse(
  value: unknown,
): ChronicleApiPage {
  if (
    !isRecord(value) ||
    !Array.isArray(value.items) ||
    !(
      value.nextOffset === null ||
      (
        Number.isInteger(
          value.nextOffset,
        ) &&
        (value.nextOffset as number) >= 0
      )
    )
  ) {
    return invalidResponse()
  }

  return {
    items:
      parseChronicleApiListResponse(
        value.items,
      ),
    nextOffset:
      value.nextOffset as number | null,
  }
}

async function responseError(
  response: Response,
): Promise<ChronicleApiError> {
  let code =
    'CHRONICLE_REQUEST_FAILED'

  try {
    const body: unknown =
      await response.json()

    if (
      isRecord(body) &&
      typeof body.code === 'string'
    ) {
      code = body.code
    }
  } catch {
    // El estado HTTP sigue disponible.
  }

  return new ChronicleApiError(
    response.status,
    code,
  )
}

async function jsonResponse(
  response: Response,
): Promise<unknown> {
  if (!response.ok) {
    throw await responseError(response)
  }

  try {
    return await response.json()
  } catch {
    return invalidResponse()
  }
}

async function chroniclePageFromResponse(
  fetchImplementation:
    FetchImplementation,
  query: ChronicleListQuery = {},
): Promise<ChronicleApiPage> {
  const limit =
    query.limit ?? 25
  const offset =
    query.offset ?? 0

  const response =
    await fetchImplementation(
      `/api/chronicles?limit=${encodeURIComponent(
        String(limit),
      )}&offset=${encodeURIComponent(
        String(offset),
      )}`,
      {
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
      },
    )

  return parseChronicleApiPageResponse(
    await jsonResponse(response),
  )
}

function parseNestedOffsetPage<T>(
  value: unknown,
  itemParser: (value: unknown) => T,
): {
  readonly items: readonly T[]
  readonly nextOffset: number | null
} {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new TypeError(
      'Invalid paginated chronicle response',
    )
  }

  const record =
    value as Record<string, unknown>

  if (!Array.isArray(record.items)) {
    throw new TypeError(
      'Paginated chronicle items must be an array',
    )
  }

  const nextOffset =
    record.nextOffset

  if (
    nextOffset !== null &&
    (
      typeof nextOffset !== 'number' ||
      !Number.isInteger(nextOffset) ||
      nextOffset < 0
    )
  ) {
    throw new TypeError(
      'Paginated chronicle nextOffset is invalid',
    )
  }

  return {
    items: record.items.map(
      itemParser,
    ),
    nextOffset,
  }
}

export function createChronicleGateway(
  fetchImplementation: FetchImplementation =
    globalThis.fetch,
): ChronicleLifecycleGateway {
  return {
    async list() {
      const response =
        await fetchImplementation(
          '/api/chronicles',
          {
            credentials: 'include',
            headers: {
              Accept: 'application/json',
            },
          },
        )

      const body =
        await jsonResponse(response)

      if (Array.isArray(body)) {
        return parseChronicleApiListResponse(
          body,
        )
      }

      const first =
        parseChronicleApiPageResponse(
          body,
        )

      const items = [
        ...first.items,
      ]
      let nextOffset =
        first.nextOffset

      while (nextOffset !== null) {
        const page =
          await chroniclePageFromResponse(
            fetchImplementation,
            {
              limit: 50,
              offset: nextOffset,
            },
          )

        items.push(...page.items)
        nextOffset =
          page.nextOffset
      }

      return items
    },

    async listPage(query = {}) {
      return chroniclePageFromResponse(
        fetchImplementation,
        query,
      )
    },

    async create(request) {
      const response =
        await fetchImplementation(
          '/api/chronicles',
          {
            method: 'POST',
            credentials: 'include',
            headers: {
              Accept: 'application/json',
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify(request),
          },
        )

      return parseChronicleApiSnapshotResponse(
        await jsonResponse(response),
      )
    },

    async get(chronicleId) {
      const response =
        await fetchImplementation(
          `/api/chronicles/${chronicleId}`,
          {
            credentials: 'include',
            headers: {
              Accept: 'application/json',
            },
          },
        )

      return parseChronicleApiSnapshotResponse(
        await jsonResponse(response),
      )
    },

    async transition(
      chronicleId,
      request,
    ) {
      const response =
        await fetchImplementation(
          `/api/chronicles/${chronicleId}/lifecycle`,
          {
            method: 'PATCH',
            credentials: 'include',
            headers: {
              Accept: 'application/json',
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify(request),
          },
        )

      return parseChronicleApiSnapshotResponse(
        await jsonResponse(response),
      )
    },

    async participantsPage(
      chronicleId,
      query = {},
    ) {
      const limit =
        query.limit ?? 25
      const offset =
        query.offset ?? 0

      const response =
        await fetchImplementation(
          `/api/chronicles/${chronicleId}/participants?limit=${limit}&offset=${offset}`,
          {
            credentials: 'include',
            headers: {
              Accept: 'application/json',
            },
          },
        )

      return parseNestedOffsetPage(
        await jsonResponse(response),
        parseChronicleParticipantResponse,
      )
    },

    async participants(chronicleId) {
      const items:
        ChronicleParticipantApiSnapshot[] = []

      let nextOffset: number | null = 0

      while (nextOffset !== null) {
        const page =
          await this.participantsPage(
            chronicleId,
            {
              limit: 50,
              offset: nextOffset,
            },
          )

        items.push(...page.items)
        nextOffset = page.nextOffset
      }

      return items
    },

    async participantCandidatesPage(
      chronicleId,
      query = {},
    ) {
      const limit =
        query.limit ?? 25
      const offset =
        query.offset ?? 0

      const response =
        await fetchImplementation(
          `/api/chronicles/${chronicleId}/participant-candidates?limit=${limit}&offset=${offset}`,
          {
            credentials: 'include',
            headers: {
              Accept: 'application/json',
            },
          },
        )

      return parseNestedOffsetPage(
        await jsonResponse(response),
        parseChronicleParticipantCandidateResponse,
      )
    },

    async participantCandidates(
      chronicleId,
    ) {
      const items:
        ChronicleParticipantCandidateApiSnapshot[] = []

      let nextOffset:
        number | null = 0

      while (nextOffset !== null) {
        const page =
          await this.participantCandidatesPage(
            chronicleId,
            {
              limit: 50,
              offset:
                nextOffset,
            },
          )

        items.push(
          ...page.items,
        )

        nextOffset =
          page.nextOffset
      }

      return items
    },

    async addParticipant(
      chronicleId,
      request,
    ) {
      const response =
        await fetchImplementation(
          `/api/chronicles/${chronicleId}/participants`,
          {
            method: 'POST',
            credentials: 'include',
            headers: {
              Accept: 'application/json',
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify(request),
          },
        )

      return parseChronicleParticipantResponse(
        await jsonResponse(response),
      )
    },

    async retireParticipant(
      chronicleId,
      participantId,
    ) {
      const response =
        await fetchImplementation(
          `/api/chronicles/${chronicleId}/participants/${participantId}/retire`,
          {
            method: 'PATCH',
            credentials: 'include',
            headers: {
              Accept: 'application/json',
            },
          },
        )

      return parseChronicleParticipantResponse(
        await jsonResponse(response),
      )
    },

    async charactersPage(
      chronicleId,
      query = {},
    ) {
      const limit =
        query.limit ?? 25
      const offset =
        query.offset ?? 0

      const response =
        await fetchImplementation(
          `/api/chronicles/${chronicleId}/characters?limit=${limit}&offset=${offset}`,
          {
            credentials: 'include',
            headers: {
              Accept: 'application/json',
            },
          },
        )

      return parseNestedOffsetPage(
        await jsonResponse(response),
        parseChronicleCharacterSummaryResponse,
      )
    },

    async characters(chronicleId) {
      const items:
        ChronicleCharacterApiSummary[] = []

      let nextOffset: number | null = 0

      while (nextOffset !== null) {
        const page =
          await this.charactersPage(
            chronicleId,
            {
              limit: 50,
              offset: nextOffset,
            },
          )

        items.push(...page.items)
        nextOffset = page.nextOffset
      }

      return items
    },

    async npcs(
      chronicleId,
      query = {},
    ) {
      const limit =
        query.limit ?? 25
      const offset =
        query.offset ?? 0

      const response =
        await fetchImplementation(
          `/api/chronicles/${chronicleId}/npcs?limit=${limit}&offset=${offset}`,
          {
            credentials: 'include',
            headers: {
              Accept: 'application/json',
            },
          },
        )

      return parseNestedOffsetPage(
        await jsonResponse(response),
        parseChronicleNpcResponse,
      )
    },

    async npc(
      chronicleId,
      npcId,
    ) {
      const response =
        await fetchImplementation(
          `/api/chronicles/${chronicleId}/npcs/${npcId}`,
          {
            credentials: 'include',
            headers: {
              Accept: 'application/json',
            },
          },
        )

      return parseChronicleNpcResponse(
        await jsonResponse(response),
      )
    },

    async createNpc(
      chronicleId,
      request,
    ) {
      const response =
        await fetchImplementation(
          `/api/chronicles/${chronicleId}/npcs`,
          {
            method: 'POST',
            credentials: 'include',
            headers: {
              Accept: 'application/json',
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify(request),
          },
        )

      return parseChronicleNpcResponse(
        await jsonResponse(response),
      )
    },

    async updateNpc(
      chronicleId,
      npcId,
      request,
    ) {
      const response =
        await fetchImplementation(
          `/api/chronicles/${chronicleId}/npcs/${npcId}`,
          {
            method: 'PATCH',
            credentials: 'include',
            headers: {
              Accept: 'application/json',
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify(request),
          },
        )

      return parseChronicleNpcResponse(
        await jsonResponse(response),
      )
    },

    async archiveNpc(
      chronicleId,
      npcId,
    ) {
      const response =
        await fetchImplementation(
          `/api/chronicles/${chronicleId}/npcs/${npcId}/archive`,
          {
            method: 'PATCH',
            credentials: 'include',
            headers: {
              Accept: 'application/json',
            },
          },
        )

      return parseChronicleNpcResponse(
        await jsonResponse(response),
      )
    },

    async locationsPage(
      chronicleId,
      query = {},
    ) {
      const limit =
        query.limit ?? 25
      const offset =
        query.offset ?? 0

      const response =
        await fetchImplementation(
          `/api/chronicles/${chronicleId}/locations?limit=${limit}&offset=${offset}`,
          {
            credentials: 'include',
            headers: {
              Accept: 'application/json',
            },
          },
        )

      return parseNestedOffsetPage(
        await jsonResponse(response),
        parseChronicleLocationResponse,
      )
    },

    async locations(chronicleId) {
      const items:
        ChronicleLocationApiSnapshot[] = []

      let nextOffset:
        number | null = 0

      while (nextOffset !== null) {
        const page =
          await this.locationsPage(
            chronicleId,
            {
              limit: 50,
              offset:
                nextOffset,
            },
          )

        items.push(
          ...page.items,
        )

        nextOffset =
          page.nextOffset
      }

      return items
    },

    async location(
      chronicleId,
      locationId,
    ) {
      const response =
        await fetchImplementation(
          `/api/chronicles/${chronicleId}/locations/${locationId}`,
          {
            credentials: 'include',
            headers: {
              Accept: 'application/json',
            },
          },
        )

      return parseChronicleLocationResponse(
        await jsonResponse(response),
      )
    },

    async createLocation(
      chronicleId,
      request,
    ) {
      const response =
        await fetchImplementation(
          `/api/chronicles/${chronicleId}/locations`,
          {
            method: 'POST',
            credentials: 'include',
            headers: {
              Accept: 'application/json',
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify(request),
          },
        )

      return parseChronicleLocationResponse(
        await jsonResponse(response),
      )
    },

    async updateLocation(
      chronicleId,
      locationId,
      request,
    ) {
      const response =
        await fetchImplementation(
          `/api/chronicles/${chronicleId}/locations/${locationId}`,
          {
            method: 'PATCH',
            credentials: 'include',
            headers: {
              Accept: 'application/json',
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify(request),
          },
        )

      return parseChronicleLocationResponse(
        await jsonResponse(response),
      )
    },

    async archiveLocation(
      chronicleId,
      locationId,
    ) {
      const response =
        await fetchImplementation(
          `/api/chronicles/${chronicleId}/locations/${locationId}/archive`,
          {
            method: 'PATCH',
            credentials: 'include',
            headers: {
              Accept: 'application/json',
            },
          },
        )

      return parseChronicleLocationResponse(
        await jsonResponse(response),
      )
    },

    async eventsPage(
      chronicleId,
      query = {},
    ) {
      const limit =
        query.limit ?? 25
      const offset =
        query.offset ?? 0

      const response =
        await fetchImplementation(
          `/api/chronicles/${chronicleId}/events?limit=${limit}&offset=${offset}`,
          {
            credentials: 'include',
            headers: {
              Accept: 'application/json',
            },
          },
        )

      return parseNestedOffsetPage(
        await jsonResponse(response),
        parseChronicleEventResponse,
      )
    },

    async events(chronicleId) {
      const items:
        ChronicleEventApiSnapshot[] = []

      let nextOffset:
        number | null = 0

      while (nextOffset !== null) {
        const page =
          await this.eventsPage(
            chronicleId,
            {
              limit: 50,
              offset:
                nextOffset,
            },
          )

        items.push(
          ...page.items,
        )

        nextOffset =
          page.nextOffset
      }

      return items
    },

    async event(
      chronicleId,
      eventId,
    ) {
      const response =
        await fetchImplementation(
          `/api/chronicles/${chronicleId}/events/${eventId}`,
          {
            credentials: 'include',
            headers: {
              Accept: 'application/json',
            },
          },
        )

      return parseChronicleEventResponse(
        await jsonResponse(response),
      )
    },

    async createEvent(
      chronicleId,
      request,
    ) {
      const response =
        await fetchImplementation(
          `/api/chronicles/${chronicleId}/events`,
          {
            method: 'POST',
            credentials: 'include',
            headers: {
              Accept: 'application/json',
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify(request),
          },
        )

      return parseChronicleEventResponse(
        await jsonResponse(response),
      )
    },

    async updateEvent(
      chronicleId,
      eventId,
      request,
    ) {
      const response =
        await fetchImplementation(
          `/api/chronicles/${chronicleId}/events/${eventId}`,
          {
            method: 'PATCH',
            credentials: 'include',
            headers: {
              Accept: 'application/json',
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify(request),
          },
        )

      return parseChronicleEventResponse(
        await jsonResponse(response),
      )
    },

    async reorderEvents(
      chronicleId,
      request,
    ) {
      const response =
        await fetchImplementation(
          `/api/chronicles/${chronicleId}/events/reorder`,
          {
            method: 'PATCH',
            credentials: 'include',
            headers: {
              Accept: 'application/json',
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify(request),
          },
        )

      return parseList(
        await jsonResponse(response),
        parseChronicleEventResponse,
      )
    },

    async archiveEvent(
      chronicleId,
      eventId,
    ) {
      const response =
        await fetchImplementation(
          `/api/chronicles/${chronicleId}/events/${eventId}/archive`,
          {
            method: 'PATCH',
            credentials: 'include',
            headers: {
              Accept: 'application/json',
            },
          },
        )

      return parseChronicleEventResponse(
        await jsonResponse(response),
      )
    },


    async sessionContext(
      chronicleId,
      sessionId,
    ) {
      const response =
        await fetchImplementation(
          `/api/chronicles/${chronicleId}/sessions/${sessionId}/context`,
          {
            credentials: 'include',
            headers: {
              Accept: 'application/json',
            },
          },
        )

      return parseChronicleSessionContextResponse(
        await jsonResponse(response),
      )
    },

    async replaceSessionContext(
      chronicleId,
      sessionId,
      request,
    ) {
      const response =
        await fetchImplementation(
          `/api/chronicles/${chronicleId}/sessions/${sessionId}/context`,
          {
            method: 'PATCH',
            credentials: 'include',
            headers: {
              Accept: 'application/json',
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify(request),
          },
        )

      return parseChronicleSessionContextResponse(
        await jsonResponse(response),
      )
    },


    async sessionAttendancesPage(
      chronicleId,
      sessionId,
      query = {},
    ) {
      const limit =
        query.limit ?? 25
      const offset =
        query.offset ?? 0

      const response =
        await fetchImplementation(
          `/api/chronicles/${chronicleId}/sessions/${sessionId}/attendances?limit=${limit}&offset=${offset}`,
          {
            credentials: 'include',
            headers: {
              Accept: 'application/json',
            },
          },
        )

      return parseNestedOffsetPage(
        await jsonResponse(response),
        parseChronicleSessionAttendanceResponse,
      )
    },

    async sessionAttendances(
      chronicleId,
      sessionId,
    ) {
      const items:
        ChronicleSessionAttendanceApiSnapshot[] = []

      let nextOffset:
        number | null = 0

      while (nextOffset !== null) {
        const page =
          await this.sessionAttendancesPage(
            chronicleId,
            sessionId,
            {
              limit: 50,
              offset: nextOffset,
            },
          )

        items.push(...page.items)
        nextOffset = page.nextOffset
      }

      return items
    },

    async addSessionAttendance(
      chronicleId,
      sessionId,
      request,
    ) {
      const response =
        await fetchImplementation(
          `/api/chronicles/${chronicleId}/sessions/${sessionId}/attendances`,
          {
            method: 'POST',
            credentials: 'include',
            headers: {
              Accept: 'application/json',
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify(request),
          },
        )

      return parseChronicleSessionAttendanceResponse(
        await jsonResponse(response),
      )
    },

    async removeSessionAttendance(
      chronicleId,
      sessionId,
      characterId,
    ) {
      const response =
        await fetchImplementation(
          `/api/chronicles/${chronicleId}/sessions/${sessionId}/attendances/${characterId}/remove`,
          {
            method: 'PATCH',
            credentials: 'include',
            headers: {
              Accept: 'application/json',
            },
          },
        )

      return parseChronicleSessionAttendanceRemovalResponse(
        await jsonResponse(response),
      )
    },

    async sessions(
      chronicleId,
      query = {},
    ) {
      const limit =
        query.limit ?? 25
      const offset =
        query.offset ?? 0

      const response =
        await fetchImplementation(
          `/api/chronicles/${chronicleId}/sessions?limit=${limit}&offset=${offset}`,
          {
            credentials: 'include',
            headers: {
              Accept: 'application/json',
            },
          },
        )

      return parseNestedOffsetPage(
        await jsonResponse(response),
        parseChronicleSessionResponse,
      )
    },

    async session(
      chronicleId,
      sessionId,
    ) {
      const response =
        await fetchImplementation(
          `/api/chronicles/${chronicleId}/sessions/${sessionId}`,
          {
            credentials: 'include',
            headers: {
              Accept: 'application/json',
            },
          },
        )

      return parseChronicleSessionResponse(
        await jsonResponse(response),
      )
    },

    async createSession(
      chronicleId,
      request,
    ) {
      const response =
        await fetchImplementation(
          `/api/chronicles/${chronicleId}/sessions`,
          {
            method: 'POST',
            credentials: 'include',
            headers: {
              Accept: 'application/json',
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify(request),
          },
        )

      return parseChronicleSessionResponse(
        await jsonResponse(response),
      )
    },

    async updateSession(
      chronicleId,
      sessionId,
      request,
    ) {
      const response =
        await fetchImplementation(
          `/api/chronicles/${chronicleId}/sessions/${sessionId}`,
          {
            method: 'PATCH',
            credentials: 'include',
            headers: {
              Accept: 'application/json',
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify(request),
          },
        )

      return parseChronicleSessionResponse(
        await jsonResponse(response),
      )
    },

    async completeSession(
      chronicleId,
      sessionId,
    ) {
      const response =
        await fetchImplementation(
          `/api/chronicles/${chronicleId}/sessions/${sessionId}/complete`,
          {
            method: 'PATCH',
            credentials: 'include',
            headers: {
              Accept: 'application/json',
            },
          },
        )

      return parseChronicleSessionResponse(
        await jsonResponse(response),
      )
    },

    async archiveSession(
      chronicleId,
      sessionId,
    ) {
      const response =
        await fetchImplementation(
          `/api/chronicles/${chronicleId}/sessions/${sessionId}/archive`,
          {
            method: 'PATCH',
            credentials: 'include',
            headers: {
              Accept: 'application/json',
            },
          },
        )

      return parseChronicleSessionResponse(
        await jsonResponse(response),
      )
    },
  }
}
