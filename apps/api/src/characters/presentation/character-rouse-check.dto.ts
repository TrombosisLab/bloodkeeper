import type {
  ExecuteCharacterRouseCheckCommand,
} from '../application/execute-character-rouse-check.use-case'

import type {
  PersistedCharacterRouseCheckOperation,
} from '../domain/character-rouse-check-operation.types'

import type {
  CharacterRouseCheckReason,
} from '../domain/character-rouse-check.rules'

import {
  parseCharacterDraftIdParam,
} from './character-draft.dto'

export class InvalidCharacterRouseCheckRequestError
  extends Error {
  constructor(message: string) {
    super(message)
    this.name =
      'InvalidCharacterRouseCheckRequestError'
  }
}

type UnknownRecord =
  Record<string, unknown>

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const publicReasons =
  [
    'awakening',
    'bloodSurge',
    'healing',
    'ritualOrCeremony',
    'other',
  ] as const satisfies
    readonly CharacterRouseCheckReason[]

function record(
  value: unknown,
): UnknownRecord {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new InvalidCharacterRouseCheckRequestError(
      'body must be an object',
    )
  }

  return value as UnknownRecord
}

function onlyKeys(
  body: UnknownRecord,
  allowed: readonly string[],
): void {
  for (const key of Object.keys(body)) {
    if (!allowed.includes(key)) {
      throw new InvalidCharacterRouseCheckRequestError(
        `body.${key} is not allowed`,
      )
    }
  }
}

function positiveInteger(
  value: unknown,
  path: string,
): number {
  if (
    !Number.isSafeInteger(value) ||
    (value as number) < 1
  ) {
    throw new InvalidCharacterRouseCheckRequestError(
      `${path} must be a positive integer`,
    )
  }

  return value as number
}

function uuid(
  value: unknown,
  path: string,
): string {
  if (
    typeof value !== 'string' ||
    !uuidPattern.test(value)
  ) {
    throw new InvalidCharacterRouseCheckRequestError(
      `${path} must be a UUID`,
    )
  }

  return value
}

function publicReason(
  value: unknown,
): CharacterRouseCheckReason {
  if (
    typeof value !== 'string' ||
    !publicReasons.includes(
      value as typeof publicReasons[number],
    )
  ) {
    throw new InvalidCharacterRouseCheckRequestError(
      'body.reason is not available as a public Rouse action',
    )
  }

  return value as CharacterRouseCheckReason
}

export function parseExecuteCharacterRouseCheckRequest(
  characterIdInput: unknown,
  bodyInput: unknown,
): ExecuteCharacterRouseCheckCommand {
  const body = record(bodyInput)

  onlyKeys(
    body,
    [
      'expectedRevision',
      'operationId',
      'reason',
    ],
  )

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
    operationId:
      uuid(
        body.operationId,
        'body.operationId',
      ),
    reason:
      publicReason(body.reason),
  }
}

export interface CharacterRouseCheckResponseDto {
  readonly operationId: string
  readonly reason: CharacterRouseCheckReason
  readonly rolls: readonly number[]
  readonly selectedResult: number
  readonly success: boolean
  readonly hungerBefore: number
  readonly hungerAfter: number
  readonly consequence:
    | {
        readonly kind: 'none'
      }
    | {
        readonly kind:
          'hungerFrenzyTestRequired'
        readonly difficulty: 4
      }
    | {
        readonly kind: 'torporTriggered'
      }
  readonly rollHistoryId: string
  readonly characterRevision: number
  readonly createdAt: string
}

export function toCharacterRouseCheckResponse(
  operation:
    PersistedCharacterRouseCheckOperation,
): CharacterRouseCheckResponseDto {
  const consequence =
    operation.consequence ===
      'hungerFrenzyTestRequired'
      ? {
          kind:
            'hungerFrenzyTestRequired' as const,
          difficulty: 4 as const,
        }
      : operation.consequence ===
          'torporTriggered'
        ? {
            kind:
              'torporTriggered' as const,
          }
        : {
            kind: 'none' as const,
          }

  return {
    operationId:
      operation.operationId,
    reason: operation.reason,
    rolls: [...operation.rolls],
    selectedResult:
      operation.selectedResult,
    success: operation.success,
    hungerBefore:
      operation.hungerBefore,
    hungerAfter:
      operation.hungerAfter,
    consequence,
    rollHistoryId:
      operation.rollHistoryId,
    characterRevision:
      operation.characterRevision,
    createdAt:
      operation.createdAt.toISOString(),
  }
}
