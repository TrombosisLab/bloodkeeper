import {
  CharacterValidationApiError,
  parseCharacterValidationReportResponse,
} from './character-validation.api.ts'

import type {
  CharacterLifecycleSnapshot,
  CharacterLifecycleTargetStatus,
} from '../types/character-lifecycle.types.ts'

export class CharacterLifecycleApiError
  extends Error {
  readonly status: number
  readonly code: string
  readonly issues: readonly unknown[]

  constructor(
    status: number,
    code: string,
    issues: readonly unknown[] = [],
  ) {
    super(code)
    this.name = 'CharacterLifecycleApiError'
    this.status = status
    this.code = code
    this.issues = [...issues]
  }
}

export interface CharacterLifecycleGateway {
  transition(
    characterId: string,
    expectedRevision: number,
    nextStatus: CharacterLifecycleTargetStatus,
    confirmed: boolean,
  ): Promise<CharacterLifecycleSnapshot>
}

type FetchImplementation = typeof globalThis.fetch

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function invalidResponse(): never {
  throw new CharacterLifecycleApiError(
    502,
    'INVALID_CHARACTER_LIFECYCLE_RESPONSE',
  )
}

function parseSnapshot(
  value: unknown,
): CharacterLifecycleSnapshot {
  if (
    !isRecord(value) ||
    !isRecord(value.character) ||
    typeof value.character.characterId !== 'string' ||
    !['draft', 'active', 'archived'].includes(
      value.character.status as string,
    ) ||
    typeof value.character.revision !== 'number' ||
    !Number.isSafeInteger(value.character.revision) ||
    value.character.revision < 1 ||
    (value.validation !== null &&
      !isRecord(value.validation))
  ) {
    return invalidResponse()
  }

  let validation = null

  if (value.validation !== null) {
    try {
      validation =
        parseCharacterValidationReportResponse(
          value.validation,
        )
    } catch (error: unknown) {
      if (
        error instanceof CharacterValidationApiError
      ) {
        return invalidResponse()
      }

      throw error
    }
  }

  return {
    characterId: value.character.characterId,
    status: value.character.status as
      CharacterLifecycleSnapshot['status'],
    revision: value.character.revision,
    validation,
  }
}

async function responseError(
  response: Response,
): Promise<CharacterLifecycleApiError> {
  let code = 'CHARACTER_LIFECYCLE_REQUEST_FAILED'
  let issues: readonly unknown[] = []

  try {
    const body: unknown = await response.json()

    if (isRecord(body)) {
      if (typeof body.code === 'string') {
        code = body.code
      }

      if (Array.isArray(body.issues)) {
        issues = body.issues
      }
    }
  } catch {
    // The HTTP status remains useful without a JSON body.
  }

  return new CharacterLifecycleApiError(
    response.status,
    code,
    issues,
  )
}

export function createCharacterLifecycleGateway(
  fetchImplementation: FetchImplementation =
    globalThis.fetch,
): CharacterLifecycleGateway {
  return {
    async transition(
      characterId,
      expectedRevision,
      nextStatus,
      confirmed,
    ) {
      const response = await fetchImplementation(
        `/api/characters/${encodeURIComponent(characterId)}/lifecycle`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            expectedRevision,
            nextStatus,
            confirmed,
          }),
        },
      )

      if (!response.ok) {
        throw await responseError(response)
      }

      try {
        return parseSnapshot(await response.json())
      } catch (error: unknown) {
        if (
          error instanceof CharacterLifecycleApiError
        ) {
          throw error
        }

        return invalidResponse()
      }
    },
  }
}
