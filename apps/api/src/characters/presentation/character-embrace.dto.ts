import type {
  EmbraceCharacterCommand,
} from '../application/embrace-character.use-case'

import type {
  EmbraceCharacterResult,
} from '../domain/character-embrace.types'

import {
  parseCharacterDraftIdParam,
  toCharacterDraftResponse,
} from './character-draft.dto'

import type {
  CharacterDraftResponseDto,
} from './character-draft.dto'

export class InvalidCharacterEmbraceRequestError
  extends Error {
  constructor(message: string) {
    super(message)
    this.name =
      'InvalidCharacterEmbraceRequestError'
  }
}

function record(
  value: unknown,
): Record<string, unknown> {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new InvalidCharacterEmbraceRequestError(
      'body must be an object',
    )
  }

  return value as Record<string, unknown>
}

function expectedRevision(
  value: unknown,
): number {
  if (
    !Number.isSafeInteger(value) ||
    (value as number) < 1
  ) {
    throw new InvalidCharacterEmbraceRequestError(
      'body.expectedRevision must be a positive integer',
    )
  }

  return value as number
}

export function parseCharacterEmbraceRequest(
  characterIdInput: unknown,
  bodyInput: unknown,
): EmbraceCharacterCommand {
  const body = record(bodyInput)
  const keys = Object.keys(body)

  if (
    keys.length !== 1 ||
    keys[0] !== 'expectedRevision'
  ) {
    throw new InvalidCharacterEmbraceRequestError(
      'body only accepts expectedRevision',
    )
  }

  return {
    characterId:
      parseCharacterDraftIdParam(
        characterIdInput,
      ),
    expectedRevision:
      expectedRevision(
        body.expectedRevision,
      ),
  }
}

export interface CharacterEmbraceResponseDto {
  readonly character:
    CharacterDraftResponseDto
  readonly pendingDecisions:
    EmbraceCharacterResult['pendingDecisions']
}

export function toCharacterEmbraceResponse(
  result: EmbraceCharacterResult,
): CharacterEmbraceResponseDto {
  return {
    character:
      toCharacterDraftResponse(
        result.character,
      ),
    pendingDecisions: [
      ...result.pendingDecisions,
    ],
  }
}
