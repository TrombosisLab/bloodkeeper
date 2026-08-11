import type {
  CharacterExperienceGrantReason,
  CharacterExperienceLedger,
  CharacterExperienceMovement,
  CorrectCharacterExperienceCommand,
  GrantCharacterExperienceCommand,
} from '../domain/character-experience.types'

type UnknownRecord = Record<string, unknown>

export interface CharacterExperienceMovementResponseDto {
  readonly id: string
  readonly characterId: string
  readonly actorId: string
  readonly sessionId: string | null
  readonly type: 'grant' | 'spend' | 'correction'
  readonly component: 'earned' | 'spent'
  readonly amount: number
  readonly reason: string
  readonly acquisitionType: string | null
  readonly acquisitionKey: string | null
  readonly correctsMovementId: string | null
  readonly createdAt: string
}

export interface CharacterExperienceResponseDto {
  readonly characterId: string
  readonly total: number
  readonly spent: number
  readonly available: number
  readonly movements:
    readonly CharacterExperienceMovementResponseDto[]
}

export class InvalidCharacterExperienceRequestError
  extends Error {
  constructor(
    path: string,
    expectation: string,
  ) {
    super(`${path} ${expectation}`)
    this.name =
      'InvalidCharacterExperienceRequestError'
  }
}

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function record(
  value: unknown,
  path: string,
): UnknownRecord {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new InvalidCharacterExperienceRequestError(
      path,
      'must be an object',
    )
  }

  return value as UnknownRecord
}

function onlyKeys(
  value: UnknownRecord,
  keys: readonly string[],
  path: string,
): void {
  const allowed = new Set(keys)
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new InvalidCharacterExperienceRequestError(
        `${path}.${key}`,
        'is not allowed',
      )
    }
  }
}

function required(
  value: UnknownRecord,
  key: string,
  path: string,
): unknown {
  if (!Object.hasOwn(value, key)) {
    throw new InvalidCharacterExperienceRequestError(
      `${path}.${key}`,
      'is required',
    )
  }
  return value[key]
}

function uuid(
  value: unknown,
  path: string,
): string {
  if (
    typeof value !== 'string' ||
    !uuidPattern.test(value)
  ) {
    throw new InvalidCharacterExperienceRequestError(
      path,
      'must be a UUID',
    )
  }
  return value
}

function reason(
  value: unknown,
  path: string,
): string {
  if (typeof value !== 'string') {
    throw new InvalidCharacterExperienceRequestError(
      path,
      'must be a string',
    )
  }
  const normalized = value.trim()
  if (
    normalized.length === 0 ||
    normalized.length > 500
  ) {
    throw new InvalidCharacterExperienceRequestError(
      path,
      'must contain between 1 and 500 characters',
    )
  }
  return normalized
}

export function parseCharacterExperienceUserId(
  value: unknown,
): string {
  return uuid(value, 'request.user.id')
}

export function parseCharacterExperienceIdParam(
  value: unknown,
): string {
  return uuid(value, 'params.characterId')
}

export function parseGrantCharacterExperienceRequest(
  characterIdInput: unknown,
  input: unknown,
): GrantCharacterExperienceCommand {
  const characterId =
    parseCharacterExperienceIdParam(
      characterIdInput,
    )
  const body = record(input, 'body')
  onlyKeys(
    body,
    ['reason', 'sessionId', 'operationId'],
    'body',
  )

  const grantReason = required(
    body,
    'reason',
    'body',
  )
  if (
    grantReason !== 'session_played' &&
    grantReason !== 'story_end' &&
    grantReason !== 'fast_session'
  ) {
    throw new InvalidCharacterExperienceRequestError(
      'body.reason',
      'must be session_played, story_end or fast_session',
    )
  }

  const sessionInput = Object.hasOwn(
    body,
    'sessionId',
  )
    ? body.sessionId
    : null

  return {
    characterId,
    reason:
      grantReason as CharacterExperienceGrantReason,
    sessionId:
      sessionInput === null
        ? null
        : uuid(
            sessionInput,
            'body.sessionId',
          ),
    operationId: uuid(
      required(body, 'operationId', 'body'),
      'body.operationId',
    ),
  }
}

export function parseCorrectCharacterExperienceRequest(
  characterIdInput: unknown,
  input: unknown,
): CorrectCharacterExperienceCommand {
  const characterId =
    parseCharacterExperienceIdParam(
      characterIdInput,
    )
  const body = record(input, 'body')
  onlyKeys(
    body,
    [
      'targetMovementId',
      'amount',
      'reason',
      'operationId',
    ],
    'body',
  )

  const amount = required(
    body,
    'amount',
    'body',
  )
  if (
    typeof amount !== 'number' ||
    !Number.isSafeInteger(amount) ||
    amount === 0
  ) {
    throw new InvalidCharacterExperienceRequestError(
      'body.amount',
      'must be a non-zero safe integer',
    )
  }

  return {
    characterId,
    targetMovementId: uuid(
      required(
        body,
        'targetMovementId',
        'body',
      ),
      'body.targetMovementId',
    ),
    amount,
    reason: reason(
      required(body, 'reason', 'body'),
      'body.reason',
    ),
    operationId: uuid(
      required(body, 'operationId', 'body'),
      'body.operationId',
    ),
  }
}

function toMovementResponse(
  movement: CharacterExperienceMovement,
): CharacterExperienceMovementResponseDto {
  return {
    ...movement,
    createdAt: movement.createdAt.toISOString(),
  }
}

export function toCharacterExperienceResponse(
  ledger: CharacterExperienceLedger,
): CharacterExperienceResponseDto {
  return {
    characterId: ledger.characterId,
    total: ledger.total,
    spent: ledger.spent,
    available: ledger.available,
    movements: ledger.movements.map(
      toMovementResponse,
    ),
  }
}
