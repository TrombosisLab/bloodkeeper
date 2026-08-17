import {
  parseCharacterDraftApiSnapshotResponse,
} from '../../character-creation/infrastructure/character-draft.api.ts'

import type {
  CharacterDraftApiSnapshot,
} from '../../character-creation/types/character-draft-api.types.ts'

export const characterEmbracePendingDecisions = [
  'clan',
  'generation',
  'sire',
  'bloodState',
  'thinBloodState',
  'predatorType',
  'initialDisciplines',
  'initialPowers',
  'advantagesReview',
] as const

export type CharacterEmbracePendingDecision =
  typeof characterEmbracePendingDecisions[number]

export interface CharacterEmbraceResult {
  readonly character: CharacterDraftApiSnapshot
  readonly pendingDecisions:
    readonly CharacterEmbracePendingDecision[]
}

export interface CharacterEmbraceGateway {
  embrace(
    characterId: string,
    expectedRevision: number,
  ): Promise<CharacterEmbraceResult>
}

export class CharacterEmbraceApiError
  extends Error {
  readonly status: number
  readonly code: string

  constructor(
    status: number,
    code: string,
  ) {
    super(code)
    this.name = 'CharacterEmbraceApiError'
    this.status = status
    this.code = code
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

function isPendingDecision(
  value: unknown,
): value is CharacterEmbracePendingDecision {
  return (
    typeof value === 'string' &&
    characterEmbracePendingDecisions.includes(
      value as CharacterEmbracePendingDecision,
    )
  )
}

export function parseCharacterEmbraceResponse(
  value: unknown,
): CharacterEmbraceResult {
  if (
    !isRecord(value) ||
    !Array.isArray(value.pendingDecisions) ||
    !value.pendingDecisions.every(
      isPendingDecision,
    )
  ) {
    throw new CharacterEmbraceApiError(
      502,
      'INVALID_CHARACTER_EMBRACE_RESPONSE',
    )
  }

  const character =
    parseCharacterDraftApiSnapshotResponse(
      value.character,
    )

  if (
    character.nature !== 'vampire' ||
    character.creation.creationMode !==
      'sessionZero'
  ) {
    throw new CharacterEmbraceApiError(
      502,
      'INVALID_CHARACTER_EMBRACE_RESPONSE',
    )
  }

  return {
    character,
    pendingDecisions: [
      ...value.pendingDecisions,
    ],
  }
}

async function responseError(
  response: Response,
): Promise<CharacterEmbraceApiError> {
  let code =
    'CHARACTER_EMBRACE_REQUEST_FAILED'

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
    // El estado HTTP sigue siendo útil sin JSON.
  }

  return new CharacterEmbraceApiError(
    response.status,
    code,
  )
}

export function createCharacterEmbraceGateway(
  fetchImplementation: FetchImplementation =
    globalThis.fetch,
): CharacterEmbraceGateway {
  return {
    async embrace(
      characterId,
      expectedRevision,
    ) {
      const response =
        await fetchImplementation(
          `/api/characters/${encodeURIComponent(characterId)}/embrace`,
          {
            method: 'POST',
            credentials: 'include',
            headers: {
              Accept: 'application/json',
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              expectedRevision,
            }),
          },
        )

      if (!response.ok) {
        throw await responseError(response)
      }

      try {
        return parseCharacterEmbraceResponse(
          await response.json(),
        )
      } catch (error: unknown) {
        if (
          error instanceof
            CharacterEmbraceApiError
        ) {
          throw error
        }

        throw new CharacterEmbraceApiError(
          502,
          'INVALID_CHARACTER_EMBRACE_RESPONSE',
        )
      }
    },
  }
}
