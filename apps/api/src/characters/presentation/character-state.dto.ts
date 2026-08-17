import {
  parseCharacterDraftIdParam,
} from './character-draft.dto'

import type {
  PersistedCharacterDraft,
} from '../domain/persisted-character.types'

import type {
  UpdateCharacterStateData,
} from '../domain/character-state.types'

export class InvalidCharacterStateRequestError
  extends Error {
  constructor(message: string) {
    super(message)
    this.name =
      'InvalidCharacterStateRequestError'
  }
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function onlyKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
): void {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) {
      throw new InvalidCharacterStateRequestError(
        `${path}.${key} is not allowed`,
      )
    }
  }
}

function integer(
  value: unknown,
  path: string,
): number {
  if (!Number.isSafeInteger(value)) {
    throw new InvalidCharacterStateRequestError(
      `${path} must be an integer`,
    )
  }

  return value as number
}

function positiveInteger(
  value: unknown,
  path: string,
): number {
  const parsed = integer(value, path)

  if (parsed < 1) {
    throw new InvalidCharacterStateRequestError(
      `${path} must be positive`,
    )
  }

  return parsed
}

function damageTrack(
  value: unknown,
  path: string,
) {
  if (!isRecord(value)) {
    throw new InvalidCharacterStateRequestError(
      `${path} must be an object`,
    )
  }

  onlyKeys(
    value,
    ['superficial', 'aggravated'],
    path,
  )

  if (
    !Object.hasOwn(value, 'superficial') ||
    !Object.hasOwn(value, 'aggravated')
  ) {
    throw new InvalidCharacterStateRequestError(
      `${path} requires superficial and aggravated`,
    )
  }

  return {
    superficial:
      integer(
        value.superficial,
        `${path}.superficial`,
      ),
    aggravated:
      integer(
        value.aggravated,
        `${path}.aggravated`,
      ),
  }
}

function damage(
  value: unknown,
) {
  if (!isRecord(value)) {
    throw new InvalidCharacterStateRequestError(
      'body.damage must be an object',
    )
  }

  onlyKeys(
    value,
    ['health', 'willpower'],
    'body.damage',
  )

  if (
    !Object.hasOwn(value, 'health') ||
    !Object.hasOwn(value, 'willpower')
  ) {
    throw new InvalidCharacterStateRequestError(
      'body.damage requires health and willpower',
    )
  }

  return {
    health:
      damageTrack(
        value.health,
        'body.damage.health',
      ),
    willpower:
      damageTrack(
        value.willpower,
        'body.damage.willpower',
      ),
  }
}

export function parseUpdateCharacterStateRequest(
  characterIdInput: unknown,
  body: unknown,
): UpdateCharacterStateData {
  if (!isRecord(body)) {
    throw new InvalidCharacterStateRequestError(
      'body must be an object',
    )
  }

  onlyKeys(
    body,
    [
      'expectedRevision',
      'damage',
      'humanityValue',
      'humanityStains',
      'hunger',
    ],
    'body',
  )

  if (!Object.hasOwn(body, 'expectedRevision')) {
    throw new InvalidCharacterStateRequestError(
      'body.expectedRevision is required',
    )
  }

  const hasDamage =
    Object.hasOwn(body, 'damage')
  const hasHumanityValue =
    Object.hasOwn(body, 'humanityValue')
  const hasHumanityStains =
    Object.hasOwn(body, 'humanityStains')
  const hasHunger =
    Object.hasOwn(body, 'hunger')

  if (
    !hasDamage &&
    !hasHumanityValue &&
    !hasHumanityStains &&
    !hasHunger
  ) {
    throw new InvalidCharacterStateRequestError(
      'body must contain a state change',
    )
  }

  return {
    characterId:
      parseCharacterDraftIdParam(
        characterIdInput,
      ),
    expectedRevision:
      positiveInteger(
        body.expectedRevision,
        'body.expectedRevision',
      ),
    ...(hasDamage
      ? {
          damage: damage(body.damage),
        }
      : {}),
    ...(hasHumanityValue
      ? {
          humanityValue:
            integer(
              body.humanityValue,
              'body.humanityValue',
            ),
        }
      : {}),
    ...(hasHumanityStains
      ? {
          humanityStains:
            integer(
              body.humanityStains,
              'body.humanityStains',
            ),
        }
      : {}),
    ...(hasHunger
      ? {
          hunger:
            integer(
              body.hunger,
              'body.hunger',
            ),
        }
      : {}),
  }
}

export interface CharacterStateResponseDto {
  characterId: string
  revision: number
  status: 'draft' | 'active' | 'archived'
  hunger: number | null
  damage: {
    health: {
      superficial: number
      aggravated: number
    }
    willpower: {
      superficial: number
      aggravated: number
    }
  }
  humanity: {
    value: number
    stains: number
  }
}

export function toCharacterStateResponse(
  character: PersistedCharacterDraft,
): CharacterStateResponseDto {
  return {
    characterId: character.characterId,
    revision: character.revision,
    status: character.status,
    hunger:
      character.nature === 'human'
        ? null
        : character.blood?.hunger ?? null,
    damage: {
      health: {
        ...character.damage.health,
      },
      willpower: {
        ...character.damage.willpower,
      },
    },
    humanity: {
      value: character.humanity.value,
      stains: character.humanity.stains,
    },
  }
}
