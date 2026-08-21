import type {
  UseCharacterBlushOfLifeCommand,
  UseCharacterBlushOfLifeResult,
} from '../application/use-character-blush-of-life.use-case'

import {
  parseCharacterDraftIdParam,
} from './character-draft.dto'

import {
  toCharacterRouseCheckResponse,
} from './character-rouse-check.dto'

import type {
  CharacterRouseCheckResponseDto,
} from './character-rouse-check.dto'

export class InvalidCharacterBlushOfLifeRequestError
  extends Error {
  constructor(message: string) {
    super(message)
    this.name =
      'InvalidCharacterBlushOfLifeRequestError'
  }
}

type UnknownRecord =
  Record<string, unknown>

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function record(
  value: unknown,
): UnknownRecord {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new InvalidCharacterBlushOfLifeRequestError(
      'body must be an object',
    )
  }

  return value as UnknownRecord
}

function onlyKeys(
  body: UnknownRecord,
  allowed: readonly string[],
): void {
  for (
    const key of Object.keys(body)
  ) {
    if (
      !allowed.includes(key)
    ) {
      throw new InvalidCharacterBlushOfLifeRequestError(
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
    throw new InvalidCharacterBlushOfLifeRequestError(
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
    throw new InvalidCharacterBlushOfLifeRequestError(
      `${path} must be a UUID`,
    )
  }

  return value
}

export function parseUseCharacterBlushOfLifeRequest(
  characterIdInput: unknown,
  bodyInput: unknown,
): UseCharacterBlushOfLifeCommand {
  const body =
    record(bodyInput)

  onlyKeys(
    body,
    [
      'expectedRevision',
      'operationId',
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
  }
}

export type CharacterBlushOfLifeResponseDto =
  | {
      readonly outcome:
        'rouseResolved'
      readonly rouse:
        CharacterRouseCheckResponseDto
    }
  | {
      readonly outcome:
        'rouseExempted'
      readonly operationId: string
      readonly exemption: {
        readonly source:
          'dyscrasia'
        readonly dyscrasiaKey:
          string
        readonly sourceBloodOperationId:
          string
      }
      readonly hungerBefore: number
      readonly hungerAfter: number
      readonly characterRevision: number
      readonly createdAt: string
    }

export function toCharacterBlushOfLifeResponse(
  result:
    UseCharacterBlushOfLifeResult,
): CharacterBlushOfLifeResponseDto {
  if (
    result.outcome ===
      'rouseResolved'
  ) {
    return {
      outcome:
        'rouseResolved',
      rouse:
        toCharacterRouseCheckResponse(
          result.operation,
        ),
    }
  }

  return {
    outcome:
      'rouseExempted',
    operationId:
      result.operation.operationId,
    exemption: {
      source:
        'dyscrasia',
      dyscrasiaKey:
        result.operation.dyscrasiaKey,
      sourceBloodOperationId:
        result.operation
          .sourceBloodOperationId,
    },
    hungerBefore:
      result.operation.hungerBefore,
    hungerAfter:
      result.operation.hungerAfter,
    characterRevision:
      result.operation.characterRevision,
    createdAt:
      result.operation.createdAt
        .toISOString(),
  }
}
