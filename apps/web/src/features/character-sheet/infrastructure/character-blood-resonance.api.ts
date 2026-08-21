import {
  parseCharacterDraftApiSnapshotResponse,
} from '../../character-creation/infrastructure/character-draft.api.ts'

import type {
  CharacterDraftApiSnapshot,
} from '../../character-creation/types/character-draft-api.types.ts'

import type {
  CharacterBloodResonanceApplyRequest,
  CharacterBloodResonanceGateway,
} from '../types/character-blood-resonance-persistence.types.ts'

export class CharacterBloodResonanceApiError
  extends Error {
  readonly status: number
  readonly code: string
  readonly violations: readonly unknown[]

  constructor(
    status: number,
    code: string,
    violations: readonly unknown[] = [],
  ) {
    super(code)
    this.name =
      'CharacterBloodResonanceApiError'
    this.status = status
    this.code = code
    this.violations = [...violations]
  }
}

type FetchImplementation =
  typeof globalThis.fetch

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

async function responseError(
  response: Response,
): Promise<CharacterBloodResonanceApiError> {
  let code =
    'CHARACTER_BLOOD_RESONANCE_REQUEST_FAILED'
  let violations: readonly unknown[] = []

  try {
    const body: unknown =
      await response.json()

    if (isRecord(body)) {
      if (typeof body.code === 'string') {
        code = body.code
      }

      if (Array.isArray(body.violations)) {
        violations = body.violations
      }
    }
  } catch {
    // El status HTTP sigue siendo útil.
  }

  return new CharacterBloodResonanceApiError(
    response.status,
    code,
    violations,
  )
}

export function createCharacterBloodResonanceOperationId():
  string {
  const cryptoApi = globalThis.crypto

  if (cryptoApi === undefined) {
    throw new CharacterBloodResonanceApiError(
      0,
      'BLOOD_RESONANCE_OPERATION_ID_UNAVAILABLE',
    )
  }

  if (
    typeof cryptoApi.randomUUID ===
      'function'
  ) {
    return cryptoApi.randomUUID()
  }

  if (
    typeof cryptoApi.getRandomValues !==
      'function'
  ) {
    throw new CharacterBloodResonanceApiError(
      0,
      'BLOOD_RESONANCE_OPERATION_ID_UNAVAILABLE',
    )
  }

  const bytes = cryptoApi.getRandomValues(
    new Uint8Array(16),
  )

  bytes[6] =
    (bytes[6] & 0x0f) | 0x40
  bytes[8] =
    (bytes[8] & 0x3f) | 0x80

  const hex = Array.from(
    bytes,
    (value) =>
      value.toString(16).padStart(2, '0'),
  ).join('')

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-')
}

export function createCharacterBloodResonanceGateway(
  fetchImplementation: FetchImplementation =
    globalThis.fetch,
): CharacterBloodResonanceGateway {
  return {
    async apply(
      characterId: string,
      request:
        CharacterBloodResonanceApplyRequest,
    ): Promise<CharacterDraftApiSnapshot> {
      const response =
        await fetchImplementation(
          `/api/characters/${encodeURIComponent(characterId)}/blood/resonance`,
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

      if (!response.ok) {
        throw await responseError(response)
      }

      try {
        return parseCharacterDraftApiSnapshotResponse(
          await response.json(),
        )
      } catch (error: unknown) {
        if (
          error instanceof
            CharacterBloodResonanceApiError
        ) {
          throw error
        }

        throw new CharacterBloodResonanceApiError(
          502,
          'INVALID_CHARACTER_BLOOD_RESONANCE_RESPONSE',
        )
      }
    },
  }
}
