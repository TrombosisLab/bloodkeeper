import type {
  DiceRollHistoryCursor,
  DiceRollHistoryPage,
  ListDiceRollHistoryCommand,
} from '../domain/dice-history.types'

import {
  toDiceRollResponse,
} from './dice.dto'

import type {
  DiceRollResponseDto,
} from './dice.dto'

export class InvalidDiceHistoryRequestError
  extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidDiceHistoryRequestError'
  }
}

export interface DiceRollHistoryPageResponseDto {
  readonly items: readonly DiceRollResponseDto[]
  readonly nextCursor: string | null
}

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new InvalidDiceHistoryRequestError('query must be an object')
  }
  return value as Record<string, unknown>
}

function uuid(value: unknown, field: string): string {
  if (
    typeof value !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  ) {
    throw new InvalidDiceHistoryRequestError(`${field} must be a UUID`)
  }
  return value
}

function optionalUuid(
  value: unknown,
  field: string,
): string | undefined {
  return value === undefined ? undefined : uuid(value, field)
}

function limit(value: unknown): number {
  if (value === undefined) return 20
  if (
    typeof value !== 'string' ||
    !/^[1-9][0-9]*$/.test(value)
  ) {
    throw new InvalidDiceHistoryRequestError(
      'limit must be an integer from 1 to 50',
    )
  }
  const parsed = Number(value)
  if (parsed > 50) {
    throw new InvalidDiceHistoryRequestError(
      'limit must be an integer from 1 to 50',
    )
  }
  return parsed
}

export function encodeDiceHistoryCursor(
  cursor: DiceRollHistoryCursor,
): string {
  return Buffer.from(JSON.stringify({
    createdAt: cursor.createdAt.toISOString(),
    id: cursor.id,
  })).toString('base64url')
}

export function decodeDiceHistoryCursor(
  value: unknown,
): DiceRollHistoryCursor | null {
  if (value === undefined) return null
  if (typeof value !== 'string' || value.length > 512) {
    throw new InvalidDiceHistoryRequestError('cursor is invalid')
  }
  try {
    const parsed = JSON.parse(
      Buffer.from(value, 'base64url').toString('utf8'),
    ) as unknown
    const item = record(parsed)
    if (
      Object.keys(item).length !== 2 ||
      typeof item.createdAt !== 'string' ||
      Number.isNaN(Date.parse(item.createdAt))
    ) {
      throw new Error('invalid cursor shape')
    }
    return {
      createdAt: new Date(item.createdAt),
      id: uuid(item.id, 'cursor.id'),
    }
  } catch (error: unknown) {
    if (error instanceof InvalidDiceHistoryRequestError) throw error
    throw new InvalidDiceHistoryRequestError('cursor is invalid')
  }
}

export function parseDiceHistoryQuery(
  input: unknown,
): ListDiceRollHistoryCommand {
  const query = record(input)
  const allowed = new Set([
    'actorId', 'characterId', 'chronicleId', 'sessionId',
    'source', 'description', 'limit', 'cursor',
  ])
  if (Object.keys(query).some((key) => !allowed.has(key))) {
    throw new InvalidDiceHistoryRequestError(
      'query contains unsupported fields',
    )
  }
  const source = query.source
  if (
    source !== undefined &&
    source !== 'manual' &&
    source !== 'character' &&
    source !== 'action'
  ) {
    throw new InvalidDiceHistoryRequestError('source is invalid')
  }
  let description: string | undefined
  if (query.description !== undefined) {
    if (typeof query.description !== 'string') {
      throw new InvalidDiceHistoryRequestError(
        'description must be text',
      )
    }
    description = query.description.trim()
    if (description.length === 0 || description.length > 160) {
      throw new InvalidDiceHistoryRequestError(
        'description must contain 1 to 160 characters',
      )
    }
  }

  return {
    ...(optionalUuid(query.actorId, 'actorId') === undefined
      ? {}
      : { actorId: optionalUuid(query.actorId, 'actorId') }),
    ...(optionalUuid(query.characterId, 'characterId') === undefined
      ? {}
      : { characterId: optionalUuid(query.characterId, 'characterId') }),
    ...(optionalUuid(query.chronicleId, 'chronicleId') === undefined
      ? {}
      : { chronicleId: optionalUuid(query.chronicleId, 'chronicleId') }),
    ...(optionalUuid(query.sessionId, 'sessionId') === undefined
      ? {}
      : { sessionId: optionalUuid(query.sessionId, 'sessionId') }),
    ...(source === undefined ? {} : { source }),
    ...(description === undefined ? {} : { description }),
    limit: limit(query.limit),
    cursor: decodeDiceHistoryCursor(query.cursor),
  }
}

export function parseDiceRollHistoryId(
  value: unknown,
): string {
  return uuid(value, 'rollId')
}

export function toDiceHistoryPageResponse(
  page: DiceRollHistoryPage,
): DiceRollHistoryPageResponseDto {
  return {
    items: page.items.map(toDiceRollResponse),
    nextCursor:
      page.nextCursor === null
        ? null
        : encodeDiceHistoryCursor(page.nextCursor),
  }
}
