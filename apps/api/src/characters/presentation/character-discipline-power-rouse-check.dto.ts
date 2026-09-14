import type {
  ExecuteCharacterDisciplinePowerRouseCheckCommand,
} from '../application/execute-character-discipline-power-rouse-check.use-case'

import {
  parseCharacterDraftIdParam,
} from './character-draft.dto'

import {
  InvalidCharacterRouseCheckRequestError,
} from './character-rouse-check.dto'

type UnknownRecord = Record<string, unknown>

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function record(value: unknown): UnknownRecord {
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

function powerKey(value: unknown): string {
  if (
    typeof value !== 'string' ||
    value.trim().length === 0 ||
    value.length > 160
  ) {
    throw new InvalidCharacterRouseCheckRequestError(
      'body.powerKey must be a non-empty power key',
    )
  }

  return value
}

export function parseExecuteCharacterDisciplinePowerRouseCheckRequest(
  characterIdInput: unknown,
  bodyInput: unknown,
): ExecuteCharacterDisciplinePowerRouseCheckCommand {
  const body = record(bodyInput)

  onlyKeys(
    body,
    [
      'expectedRevision',
      'operationId',
      'powerKey',
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
    powerKey: powerKey(body.powerKey),
  }
}

