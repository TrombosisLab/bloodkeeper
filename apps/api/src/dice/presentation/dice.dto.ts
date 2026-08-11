import type {
  ExecuteCharacterDiceRollCommand,
} from '../application/execute-character-dice-roll.use-case'

import type {
  ExecuteManualDiceRollCommand,
} from '../application/execute-manual-dice-roll.use-case'

import type {
  ExecutedDiceRoll,
} from '../application/dice-execution'

export type DiceRollResponseDto = ExecutedDiceRoll

export class InvalidDiceRollRequestError
  extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidDiceRollRequestError'
  }
}

function record(input: unknown): Record<string, unknown> {
  if (
    typeof input !== 'object' ||
    input === null ||
    Array.isArray(input)
  ) {
    throw new InvalidDiceRollRequestError(
      'body must be an object',
    )
  }
  return input as Record<string, unknown>
}

function exactKeys(
  body: Record<string, unknown>,
  allowed: readonly string[],
): void {
  const unknown = Object.keys(body).filter(
    (key) => !allowed.includes(key),
  )
  if (unknown.length > 0) {
    throw new InvalidDiceRollRequestError(
      `unsupported fields: ${unknown.join(', ')}`,
    )
  }
}

function integer(
  value: unknown,
  field: string,
): number {
  if (
    typeof value !== 'number' ||
    !Number.isSafeInteger(value)
  ) {
    throw new InvalidDiceRollRequestError(
      `${field} must be a safe integer`,
    )
  }
  return value
}

function optionalInteger(
  value: unknown,
  field: string,
): number | undefined {
  return value === undefined
    ? undefined
    : integer(value, field)
}

function difficulty(
  value: unknown,
): number | null | undefined {
  return value === null || value === undefined
    ? value
    : integer(value, 'difficulty')
}

function selection(
  value: unknown,
  field: string,
): string {
  if (
    typeof value !== 'string' ||
    !/^[a-z][a-zA-Z0-9]*$/.test(value)
  ) {
    throw new InvalidDiceRollRequestError(
      `${field} contains an unsupported key`,
    )
  }
  return value
}

export function parseManualDiceRollRequest(
  input: unknown,
): ExecuteManualDiceRollCommand {
  const body = record(input)
  exactKeys(body, [
    'pool',
    'hunger',
    'modifier',
    'difficulty',
  ])

  return {
    pool: integer(body.pool, 'pool'),
    hunger: integer(body.hunger, 'hunger'),
    modifier: optionalInteger(
      body.modifier,
      'modifier',
    ),
    difficulty: difficulty(body.difficulty),
  }
}

export function parseCharacterDiceRollRequest(
  characterIdInput: unknown,
  input: unknown,
): ExecuteCharacterDiceRollCommand {
  if (
    typeof characterIdInput !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      characterIdInput,
    )
  ) {
    throw new InvalidDiceRollRequestError(
      'characterId must be a UUID',
    )
  }

  const body = record(input)
  exactKeys(body, [
    'attribute',
    'skill',
    'modifier',
    'difficulty',
  ])

  return {
    characterId: characterIdInput,
    attribute: selection(
      body.attribute,
      'attribute',
    ),
    skill:
      body.skill === undefined
        ? undefined
        : selection(body.skill, 'skill'),
    modifier: optionalInteger(
      body.modifier,
      'modifier',
    ),
    difficulty: difficulty(body.difficulty),
  }
}

export function toDiceRollResponse(
  result: ExecutedDiceRoll,
): DiceRollResponseDto {
  return {
    pool: result.pool,
    roll: result.roll,
  }
}
