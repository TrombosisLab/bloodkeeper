import type {
  RecordCharacterDiceRollCommand,
} from '../application/record-character-dice-roll.use-case'

import type {
  RecordManualDiceRollCommand,
} from '../application/record-manual-dice-roll.use-case'

import type {
  DiceRollRecord,
  DiceRollContextCommand,
} from '../domain/dice-history.types'

import type {
  BuiltDicePool,
  DicePoolModifier,
} from '../domain/dice-pool.types'

import type {
  DiceRollResolution,
} from '../domain/dice-roll.types'

export interface DiceRollResponseDto {
  readonly id: string
  readonly actorId: string
  readonly actorDisplayName: string
  readonly characterId: string | null
  readonly chronicleId: string | null
  readonly sessionId: string | null
  readonly rerollParentId: string | null
  readonly source: 'manual' | 'character' | 'action'
  readonly visibility: 'contextual' | 'private'
  readonly description: string | null
  readonly rulesVersion: string
  readonly createdAt: string
  readonly pool: BuiltDicePool
  readonly roll: DiceRollResolution
}

export type DicePoolResponseDto = BuiltDicePool

export class InvalidDiceRollRequestError
  extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidDiceRollRequestError'
  }
}

function record(input: unknown): Record<string, unknown> {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new InvalidDiceRollRequestError('body must be an object')
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

function integer(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) {
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
  return value === undefined ? undefined : integer(value, field)
}

function difficulty(value: unknown): number | null | undefined {
  return value === null || value === undefined
    ? value
    : integer(value, 'difficulty')
}

function uuid(value: unknown, field: string): string {
  if (
    typeof value !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  ) {
    throw new InvalidDiceRollRequestError(`${field} must be a UUID`)
  }
  return value
}

function selection(value: unknown, field: string): string {
  if (typeof value !== 'string' || !/^[a-z][a-zA-Z0-9]*$/.test(value)) {
    throw new InvalidDiceRollRequestError(
      `${field} contains an unsupported key`,
    )
  }
  return value
}

function text(value: unknown, field: string): string {
  if (typeof value !== 'string') {
    throw new InvalidDiceRollRequestError(`${field} must be text`)
  }
  return value
}

function optionalDescription(
  value: unknown,
): string | null | undefined {
  return value === null || value === undefined
    ? value
    : text(value, 'description')
}

function modifier(input: unknown, index: number): DicePoolModifier {
  const body = record(input)
  exactKeys(body, ['key', 'label', 'value'])
  return {
    key: selection(body.key, `modifiers[${index}].key`),
    label: text(body.label, `modifiers[${index}].label`),
    value: integer(body.value, `modifiers[${index}].value`),
  }
}

function optionalModifiers(
  value: unknown,
): readonly DicePoolModifier[] | undefined {
  if (value === undefined) return undefined
  if (!Array.isArray(value)) {
    throw new InvalidDiceRollRequestError('modifiers must be an array')
  }
  return value.map(modifier)
}

function contextFields(
  body: Record<string, unknown>,
): DiceRollContextCommand {
  const visibility = body.visibility
  if (
    visibility !== undefined &&
    visibility !== 'contextual' &&
    visibility !== 'private'
  ) {
    throw new InvalidDiceRollRequestError(
      'visibility must be contextual or private',
    )
  }

  return {
    ...(body.chronicleId === undefined
      ? {}
      : { chronicleId: uuid(body.chronicleId, 'chronicleId') }),
    ...(body.sessionId === undefined
      ? {}
      : { sessionId: uuid(body.sessionId, 'sessionId') }),
    ...(visibility === undefined ? {} : { visibility }),
    ...(body.rerollParentId === undefined
      ? {}
      : {
          rerollParentId: uuid(
            body.rerollParentId,
            'rerollParentId',
          ),
        }),
  }
}

const contextKeys = [
  'chronicleId',
  'sessionId',
  'visibility',
  'rerollParentId',
] as const

export function parseManualDiceRollRequest(
  input: unknown,
): RecordManualDiceRollCommand {
  const body = record(input)
  exactKeys(body, [
    'pool', 'hunger', 'modifier', 'modifiers',
    'difficulty', 'description', ...contextKeys,
  ])
  const modifiers = optionalModifiers(body.modifiers)
  const description = optionalDescription(body.description)

  return {
    pool: integer(body.pool, 'pool'),
    hunger: integer(body.hunger, 'hunger'),
    modifier: optionalInteger(body.modifier, 'modifier'),
    ...(modifiers === undefined ? {} : { modifiers }),
    difficulty: difficulty(body.difficulty),
    ...(description === undefined ? {} : { description }),
    ...contextFields(body),
  }
}

export function parseCharacterDiceRollRequest(
  characterIdInput: unknown,
  input: unknown,
): RecordCharacterDiceRollCommand {
  const characterId = uuid(characterIdInput, 'characterId')
  const body = record(input)
  exactKeys(body, [
    'attribute', 'skill', 'modifier', 'modifiers',
    'difficulty', 'description', ...contextKeys,
  ])
  const modifiers = optionalModifiers(body.modifiers)
  const description = optionalDescription(body.description)

  return {
    characterId,
    attribute: selection(body.attribute, 'attribute'),
    skill:
      body.skill === undefined
        ? undefined
        : selection(body.skill, 'skill'),
    modifier: optionalInteger(body.modifier, 'modifier'),
    ...(modifiers === undefined ? {} : { modifiers }),
    difficulty: difficulty(body.difficulty),
    ...(description === undefined ? {} : { description }),
    ...contextFields(body),
  }
}

export function toDicePoolResponse(
  pool: BuiltDicePool,
): DicePoolResponseDto {
  return pool
}

export function toDiceRollResponse(
  record: DiceRollRecord,
): DiceRollResponseDto {
  return {
    id: record.id,
    actorId: record.actorId,
    actorDisplayName: record.actorDisplayName,
    characterId: record.characterId,
    chronicleId: record.chronicleId,
    sessionId: record.sessionId,
    rerollParentId: record.rerollParentId,
    source: record.source,
    visibility: record.visibility,
    description: record.description,
    rulesVersion: record.rulesVersion,
    createdAt: record.createdAt.toISOString(),
    pool: record.pool,
    roll: record.roll,
  }
}
