import type {
  ChronicleApiSnapshot,
  ChronicleApiStatus,
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
  }
}
