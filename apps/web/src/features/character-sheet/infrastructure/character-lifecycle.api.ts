import {
  CharacterValidationApiError,
  parseCharacterValidationReportResponse,
} from './character-validation.api.ts'

import type {
  CharacterLifecycleSnapshot,
  CharacterLifecycleState,
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
  load(
    characterId: string,
  ): Promise<CharacterLifecycleState>

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

function parseState(
  value: unknown,
): CharacterLifecycleState {
  if (
    !isRecord(value) ||
    typeof value.characterId !== 'string' ||
    !['draft', 'active', 'archived'].includes(
      value.status as string,
    ) ||
    typeof value.revision !== 'number' ||
    !Number.isSafeInteger(value.revision) ||
    value.revision < 1
  ) {
    return invalidResponse()
  }

  return {
    characterId: value.characterId,
    status:
      value.status as CharacterLifecycleState['status'],
    revision: value.revision,
  }
}

function parseSnapshot(
  value: unknown,
): CharacterLifecycleSnapshot {
  if (
    !isRecord(value) ||
    !isRecord(value.character) ||
    (value.validation !== null &&
      !isRecord(value.validation))
  ) {
    return invalidResponse()
  }

  const state = parseState(value.character)

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
    ...state,
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
    async load(characterId) {
      const response = await fetchImplementation(
        `/api/characters/drafts/${encodeURIComponent(characterId)}`,
        { credentials: 'include' },
      )

      if (!response.ok) {
        throw await responseError(response)
      }

      try {
        return parseState(await response.json())
      } catch (error: unknown) {
        if (
          error instanceof CharacterLifecycleApiError
        ) {
          throw error
        }

        return invalidResponse()
      }
    },

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
