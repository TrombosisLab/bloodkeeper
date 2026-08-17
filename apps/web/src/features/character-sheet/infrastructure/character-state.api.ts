import {
  validateCharacterHumanityState,
} from '../domain/humanity-state-rules.ts'

import {
  validateCharacterHunger,
} from '../../character/domain/hunger-rules.ts'

import type {
  CharacterOperationalStateSnapshot,
  CharacterOperationalStateUpdate,
} from '../types/character-state-persistence.types.ts'

export class CharacterStateApiError
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
    this.name = 'CharacterStateApiError'
    this.status = status
    this.code = code
    this.violations = [...violations]
  }
}

export interface CharacterStateGateway {
  update(
    characterId: string,
    expectedRevision: number,
    changes: CharacterOperationalStateUpdate,
  ): Promise<CharacterOperationalStateSnapshot>
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

function isInteger(
  value: unknown,
): value is number {
  return Number.isSafeInteger(value)
}

function validDamageTrack(
  value: unknown,
): boolean {
  return (
    isRecord(value) &&
    isInteger(value.superficial) &&
    value.superficial >= 0 &&
    isInteger(value.aggravated) &&
    value.aggravated >= 0
  )
}

function invalidResponse(): never {
  throw new CharacterStateApiError(
    502,
    'INVALID_CHARACTER_STATE_RESPONSE',
  )
}

export function parseCharacterStateResponse(
  value: unknown,
): CharacterOperationalStateSnapshot {
  if (
    !isRecord(value) ||
    typeof value.characterId !== 'string' ||
    !isInteger(value.revision) ||
    value.revision < 1 ||
    !['draft', 'active', 'archived'].includes(
      value.status as string,
    ) ||
    (
      value.hunger !== null &&
      !isInteger(value.hunger)
    ) ||
    !isRecord(value.damage) ||
    !isRecord(value.humanity)
  ) {
    return invalidResponse()
  }

  const damage = value.damage
  const humanityValue = value.humanity

  if (
    !validDamageTrack(damage.health) ||
    !validDamageTrack(damage.willpower) ||
    !isInteger(humanityValue.value) ||
    !isInteger(humanityValue.stains)
  ) {
    return invalidResponse()
  }

  const humanity = {
    value: humanityValue.value,
    stains: humanityValue.stains,
  }

  if (
    validateCharacterHumanityState(humanity)
      .length > 0 ||
    (
      value.hunger !== null &&
      !validateCharacterHunger(
        value.hunger,
      ).valid
    )
  ) {
    return invalidResponse()
  }

  const health = damage.health
  const willpower = damage.willpower

  if (
    !isRecord(health) ||
    !isRecord(willpower)
  ) {
    return invalidResponse()
  }

  return {
    characterId: value.characterId,
    revision: value.revision,
    status:
      value.status as CharacterOperationalStateSnapshot['status'],
    hunger:
      value.hunger as number | null,
    damage: {
      health: {
        superficial:
          health.superficial as number,
        aggravated:
          health.aggravated as number,
      },
      willpower: {
        superficial:
          willpower.superficial as number,
        aggravated:
          willpower.aggravated as number,
      },
    },
    humanity,
  }
}

async function responseError(
  response: Response,
): Promise<CharacterStateApiError> {
  let code = 'CHARACTER_STATE_REQUEST_FAILED'
  let violations: readonly unknown[] = []

  try {
    const body: unknown = await response.json()

    if (isRecord(body)) {
      if (typeof body.code === 'string') {
        code = body.code
      }

      if (Array.isArray(body.violations)) {
        violations = body.violations
      }
    }
  } catch {
    // HTTP status remains useful without JSON body.
  }

  return new CharacterStateApiError(
    response.status,
    code,
    violations,
  )
}

export function createCharacterStateGateway(
  fetchImplementation: FetchImplementation =
    globalThis.fetch,
): CharacterStateGateway {
  return {
    async update(
      characterId,
      expectedRevision,
      changes,
    ) {
      const response =
        await fetchImplementation(
          `/api/characters/${encodeURIComponent(characterId)}/state`,
          {
            method: 'PATCH',
            credentials: 'include',
            headers: {
              Accept: 'application/json',
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              expectedRevision,
              ...changes,
            }),
          },
        )

      if (!response.ok) {
        throw await responseError(response)
      }

      try {
        return parseCharacterStateResponse(
          await response.json(),
        )
      } catch (error: unknown) {
        if (
          error instanceof CharacterStateApiError
        ) {
          throw error
        }

        return invalidResponse()
      }
    },
  }
}
