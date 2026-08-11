import type {
  CharacterAdvancementKind,
  CharacterAdvancementPreview,
  CharacterAdvancementPurchaseResult,
  CharacterAdvancementRequest,
  CharacterExperienceGateway,
  CharacterExperienceLedger,
  CharacterExperienceMovement,
} from '../types/character-experience.types.ts'

type FetchImplementation = typeof globalThis.fetch
type UnknownRecord = Record<string, unknown>

export class CharacterExperienceApiError extends Error {
  readonly status: number
  readonly code: string
  readonly payload: unknown

  constructor(status: number, code: string, payload: unknown = null) {
    super(code)
    this.name = 'CharacterExperienceApiError'
    this.status = status
    this.code = code
    this.payload = payload
  }
}

function record(value: unknown): UnknownRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new CharacterExperienceApiError(502, 'INVALID_CHARACTER_EXPERIENCE_RESPONSE')
  }
  return value as UnknownRecord
}

function string(value: unknown): string {
  if (typeof value !== 'string') {
    throw new CharacterExperienceApiError(502, 'INVALID_CHARACTER_EXPERIENCE_RESPONSE')
  }
  return value
}

function nullableString(value: unknown): string | null {
  return value === null ? null : string(value)
}

function integer(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) {
    throw new CharacterExperienceApiError(502, 'INVALID_CHARACTER_EXPERIENCE_RESPONSE')
  }
  return value
}

function boolean(value: unknown): boolean {
  if (typeof value !== 'boolean') {
    throw new CharacterExperienceApiError(502, 'INVALID_CHARACTER_EXPERIENCE_RESPONSE')
  }
  return value
}

function movement(value: unknown): CharacterExperienceMovement {
  const item = record(value)
  const type = string(item.type)
  const component = string(item.component)
  if (!['grant', 'spend', 'correction'].includes(type)) {
    throw new CharacterExperienceApiError(502, 'INVALID_CHARACTER_EXPERIENCE_RESPONSE')
  }
  if (!['earned', 'spent'].includes(component)) {
    throw new CharacterExperienceApiError(502, 'INVALID_CHARACTER_EXPERIENCE_RESPONSE')
  }
  return {
    id: string(item.id),
    characterId: string(item.characterId),
    actorId: string(item.actorId),
    sessionId: nullableString(item.sessionId),
    type: type as CharacterExperienceMovement['type'],
    component: component as CharacterExperienceMovement['component'],
    amount: integer(item.amount),
    reason: string(item.reason),
    acquisitionType: nullableString(item.acquisitionType),
    acquisitionKey: nullableString(item.acquisitionKey),
    correctsMovementId: nullableString(item.correctsMovementId),
    createdAt: string(item.createdAt),
  }
}

export function parseCharacterExperienceLedger(value: unknown): CharacterExperienceLedger {
  const item = record(value)
  if (!Array.isArray(item.movements)) {
    throw new CharacterExperienceApiError(502, 'INVALID_CHARACTER_EXPERIENCE_RESPONSE')
  }
  return {
    characterId: string(item.characterId),
    total: integer(item.total),
    spent: integer(item.spent),
    available: integer(item.available),
    movements: item.movements.map(movement),
  }
}

export function parseCharacterAdvancementPreview(value: unknown): CharacterAdvancementPreview {
  const item = record(value)
  const kind = string(item.kind)
  const allowedKinds: readonly CharacterAdvancementKind[] = [
    'attribute', 'skill', 'specialty', 'discipline', 'ritual',
    'formula', 'ceremony', 'advantage', 'bloodPotency',
  ]
  if (!allowedKinds.includes(kind as CharacterAdvancementKind)) {
    throw new CharacterExperienceApiError(502, 'INVALID_CHARACTER_ADVANCEMENT_RESPONSE')
  }
  if (!Array.isArray(item.issues) || !Array.isArray(item.consequences)) {
    throw new CharacterExperienceApiError(502, 'INVALID_CHARACTER_ADVANCEMENT_RESPONSE')
  }
  return {
    characterId: string(item.characterId),
    revision: integer(item.revision),
    kind: kind as CharacterAdvancementKind,
    key: string(item.key),
    currentRating: item.currentRating === null ? null : integer(item.currentRating),
    newRating: item.newRating === null ? null : integer(item.newRating),
    cost: item.cost === null ? null : integer(item.cost),
    available: integer(item.available),
    eligible: boolean(item.eligible),
    issues: item.issues.map((issue) => {
      const parsed = record(issue)
      return { code: string(parsed.code), message: string(parsed.message) }
    }),
    consequences: item.consequences.map(string),
  }
}

async function payload(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return null
  }
}

async function successfulPayload(response: Response): Promise<unknown> {
  const value = await payload(response)
  if (!response.ok) {
    const body = typeof value === 'object' && value !== null
      ? value as UnknownRecord
      : {}
    throw new CharacterExperienceApiError(
      response.status,
      typeof body.code === 'string' ? body.code : 'CHARACTER_EXPERIENCE_REQUEST_FAILED',
      value,
    )
  }
  return value
}

export function createCharacterExperienceGateway(
  fetchImplementation: FetchImplementation = globalThis.fetch,
): CharacterExperienceGateway {
  const endpoint = (characterId: string, suffix = '') =>
    `/api/characters/${encodeURIComponent(characterId)}/experience${suffix}`

  return {
    async load(characterId) {
      const response = await fetchImplementation(endpoint(characterId), {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      })
      return parseCharacterExperienceLedger(await successfulPayload(response))
    },

    async preview(characterId, advancement) {
      const response = await fetchImplementation(endpoint(characterId, '/preview'), {
        method: 'POST',
        credentials: 'include',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(advancement),
      })
      return parseCharacterAdvancementPreview(await successfulPayload(response))
    },

    async purchase(characterId, expectedRevision, operationId, advancement) {
      const response = await fetchImplementation(endpoint(characterId, '/purchase'), {
        method: 'POST',
        credentials: 'include',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ expectedRevision, operationId, advancement }),
      })
      const body = record(await successfulPayload(response))
      return {
        experience: parseCharacterExperienceLedger(body.experience),
        preview: parseCharacterAdvancementPreview(body.preview),
      } satisfies CharacterAdvancementPurchaseResult
    },
  }
}
