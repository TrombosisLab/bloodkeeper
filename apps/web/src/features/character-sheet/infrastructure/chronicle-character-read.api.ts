import {
  CharacterDraftApiError,
  parseCharacterDraftApiSnapshotResponse,
} from '../../character-creation/infrastructure/character-draft.api.ts'

import type {
  CharacterDraftGateway,
} from '../../character-creation/infrastructure/character-draft.api.ts'

import {
  CharacterProfilePhaseApiError,
  parseCharacterProfilePhaseResponse,
} from './character-profile-phase.api.ts'

import type {
  CharacterProfilePhaseGateway,
} from './character-profile-phase.api.ts'

type FetchImplementation = typeof globalThis.fetch

async function responseError(
  response: Response,
): Promise<CharacterDraftApiError> {
  let code =
    'CHRONICLE_CHARACTER_READ_REQUEST_FAILED'

  try {
    const body: unknown = await response.json()
    if (
      typeof body === 'object' &&
      body !== null &&
      !Array.isArray(body) &&
      typeof (body as Record<string, unknown>).code ===
        'string'
    ) {
      code = (body as Record<string, unknown>)
        .code as string
    }
  } catch {
    // El estado HTTP sigue siendo útil para el llamador.
  }

  return new CharacterDraftApiError(
    response.status,
    code,
  )
}

export interface ChronicleCharacterReadGateways {
  readonly character: Pick<
    CharacterDraftGateway,
    'load'
  >
  readonly profilePhase: CharacterProfilePhaseGateway
}

export function createChronicleCharacterReadGateways(
  chronicleId: string,
  fetchImplementation: FetchImplementation =
    globalThis.fetch,
): ChronicleCharacterReadGateways {
  return {
    character: {
      async load(characterId) {
        const response = await fetchImplementation(
          `/api/chronicles/${encodeURIComponent(chronicleId)}/characters/${encodeURIComponent(characterId)}`,
          {
            credentials: 'include',
            headers: { Accept: 'application/json' },
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
          if (error instanceof CharacterDraftApiError) {
            throw error
          }
          throw new CharacterDraftApiError(
            502,
            'INVALID_CHARACTER_DRAFT_RESPONSE',
          )
        }
      },
    },
    profilePhase: {
      async load(characterId) {
        const response = await fetchImplementation(
          `/api/chronicles/${encodeURIComponent(chronicleId)}/characters/${encodeURIComponent(characterId)}/profile-phase`,
          {
            credentials: 'include',
            headers: { Accept: 'application/json' },
          },
        )

        if (!response.ok) {
          const failure = await responseError(response)
          throw new CharacterProfilePhaseApiError(
            failure.status,
            failure.code,
          )
        }

        try {
          return parseCharacterProfilePhaseResponse(
            await response.json(),
          )
        } catch (error: unknown) {
          if (
            error instanceof CharacterProfilePhaseApiError
          ) {
            throw error
          }
          throw new CharacterProfilePhaseApiError(
            502,
            'INVALID_CHARACTER_PROFILE_PHASE_RESPONSE',
          )
        }
      },
    },
  }
}
