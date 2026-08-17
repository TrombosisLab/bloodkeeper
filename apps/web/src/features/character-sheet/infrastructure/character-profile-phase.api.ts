import type {
  CharacterProfilePhase,
} from '../types/character-sheet-model.types.ts'

import type {
  CharacterInitialVampirePendingDecision,
} from '../types/character-transition-read-model.types.ts'

import {
  characterEmbracePendingDecisions,
} from './character-embrace.api.ts'

export type {
  CharacterProfilePhase,
} from '../types/character-sheet-model.types.ts'

export interface CharacterProfilePhaseSnapshot {
  readonly phase: CharacterProfilePhase
  readonly pendingDecisions:
    readonly CharacterInitialVampirePendingDecision[]
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

const profilePhases:
  readonly CharacterProfilePhase[] = [
    'HUMAN',
    'TRANSITIONAL_VAMPIRE',
    'ESTABLISHED_VAMPIRE',
  ]

function isProfilePhase(
  value: unknown,
): value is CharacterProfilePhase {
  return (
    typeof value === 'string' &&
    profilePhases.includes(
      value as CharacterProfilePhase,
    )
  )
}

function isPendingDecision(
  value: unknown,
): value is CharacterInitialVampirePendingDecision {
  return (
    typeof value === 'string' &&
    characterEmbracePendingDecisions.some(
      (decision) =>
        decision === value,
    )
  )
}

function parsePendingDecisions(
  value: unknown,
): readonly CharacterInitialVampirePendingDecision[] {
  if (value === undefined) {
    return []
  }

  if (
    !Array.isArray(value) ||
    !value.every(isPendingDecision)
  ) {
    throw new CharacterProfilePhaseApiError(
      502,
      'INVALID_CHARACTER_PROFILE_PHASE_RESPONSE',
    )
  }

  const decisions = [
    ...value,
  ]

  if (
    new Set(decisions).size !==
      decisions.length
  ) {
    throw new CharacterProfilePhaseApiError(
      502,
      'INVALID_CHARACTER_PROFILE_PHASE_RESPONSE',
    )
  }

  return decisions
}

export class CharacterProfilePhaseApiError
  extends Error {
  readonly status: number
  readonly code: string

  constructor(
    status: number,
    code: string,
  ) {
    super(code)
    this.name =
      'CharacterProfilePhaseApiError'
    this.status = status
    this.code = code
  }
}

export function parseCharacterProfilePhaseResponse(
  value: unknown,
): CharacterProfilePhaseSnapshot {
  if (
    !isRecord(value) ||
    !isProfilePhase(value.phase)
  ) {
    throw new CharacterProfilePhaseApiError(
      502,
      'INVALID_CHARACTER_PROFILE_PHASE_RESPONSE',
    )
  }

  const pendingDecisions =
    parsePendingDecisions(
      value.pendingDecisions,
    )

  if (
    value.phase !==
      'TRANSITIONAL_VAMPIRE' &&
    pendingDecisions.length > 0
  ) {
    throw new CharacterProfilePhaseApiError(
      502,
      'INVALID_CHARACTER_PROFILE_PHASE_RESPONSE',
    )
  }

  return {
    phase: value.phase,
    pendingDecisions,
  }
}

async function responseError(
  response: Response,
): Promise<CharacterProfilePhaseApiError> {
  let code =
    'CHARACTER_PROFILE_PHASE_REQUEST_FAILED'

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
    // HTTP status remains useful without JSON.
  }

  return new CharacterProfilePhaseApiError(
    response.status,
    code,
  )
}

export interface CharacterProfilePhaseGateway {
  load(
    characterId: string,
  ): Promise<CharacterProfilePhaseSnapshot>
}

export function createCharacterProfilePhaseGateway(
  fetchImplementation: FetchImplementation =
    globalThis.fetch,
): CharacterProfilePhaseGateway {
  return {
    async load(characterId) {
      const response =
        await fetchImplementation(
          `/api/characters/${encodeURIComponent(characterId)}/profile-phase`,
          {
            credentials: 'include',
            headers: {
              Accept: 'application/json',
            },
          },
        )

      if (!response.ok) {
        throw await responseError(
          response,
        )
      }

      try {
        return parseCharacterProfilePhaseResponse(
          await response.json(),
        )
      } catch (error: unknown) {
        if (
          error instanceof
            CharacterProfilePhaseApiError
        ) {
          throw error
        }

        throw new CharacterProfilePhaseApiError(
          502,
          'INVALID_CHARACTER_PROFILE_PHASE_RESPONSE',
        )
      }
    },
  }
}
