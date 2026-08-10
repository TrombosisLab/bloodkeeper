import type {
  AddChronicleParticipantApiRequest,
  ChronicleApiSnapshot,
  ChronicleApiStatus,
  ChronicleCharacterApiSummary,
  ChronicleParticipantApiRole,
  ChronicleParticipantApiSnapshot,
  ChronicleParticipantApiStatus,
  ChronicleParticipantCandidateApiSnapshot,
  CreateChronicleApiRequest,
  TransitionChronicleLifecycleApiRequest,
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

  participants(
    chronicleId: string,
  ): Promise<
    readonly ChronicleParticipantApiSnapshot[]
  >

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

  characters(
    chronicleId: string,
  ): Promise<
    readonly ChronicleCharacterApiSummary[]
  >
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

      return parseChronicleApiListResponse(
        await jsonResponse(response),
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

    async participants(chronicleId) {
      const response =
        await fetchImplementation(
          `/api/chronicles/${chronicleId}/participants`,
          {
            credentials: 'include',
            headers: {
              Accept: 'application/json',
            },
          },
        )

      return parseList(
        await jsonResponse(response),
        parseChronicleParticipantResponse,
      )
    },

    async participantCandidates(
      chronicleId,
    ) {
      const response =
        await fetchImplementation(
          `/api/chronicles/${chronicleId}/participant-candidates`,
          {
            credentials: 'include',
            headers: {
              Accept: 'application/json',
            },
          },
        )

      return parseList(
        await jsonResponse(response),
        parseChronicleParticipantCandidateResponse,
      )
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

    async characters(chronicleId) {
      const response =
        await fetchImplementation(
          `/api/chronicles/${chronicleId}/characters`,
          {
            credentials: 'include',
            headers: {
              Accept: 'application/json',
            },
          },
        )

      return parseList(
        await jsonResponse(response),
        parseChronicleCharacterSummaryResponse,
      )
    },
  }
}
