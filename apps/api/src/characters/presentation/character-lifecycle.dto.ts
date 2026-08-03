import type {
  TransitionCharacterLifecycleCommand,
  TransitionCharacterLifecycleResult,
} from '../application/transition-character-lifecycle.use-case'

import type {
  CharacterLifecycleStatus,
} from '../domain/persisted-character.types'

import {
  toCharacterDraftResponse,
} from './character-draft.dto'

import type {
  CharacterDraftResponseDto,
} from './character-draft.dto'

import {
  toCharacterValidationResponse,
} from './character-validation.dto'

import type {
  CharacterValidationResponseDto,
} from './character-validation.dto'

type LifecycleTargetStatus = Extract<
  CharacterLifecycleStatus,
  'active' | 'archived'
>

export interface CharacterLifecycleResponseDto {
  readonly character: CharacterDraftResponseDto
  readonly validation:
    CharacterValidationResponseDto | null
}

export class InvalidCharacterLifecycleRequestError
  extends Error {
  constructor(message: string) {
    super(message)
    this.name =
      'InvalidCharacterLifecycleRequestError'
  }
}

function record(value: unknown):
  Record<string, unknown> {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    throw new InvalidCharacterLifecycleRequestError(
      'Character lifecycle body must be an object',
    )
  }

  return value as Record<string, unknown>
}

function assertOnlyLifecycleKeys(
  body: Record<string, unknown>,
): void {
  const allowed = new Set([
    'expectedRevision',
    'nextStatus',
    'confirmed',
  ])

  for (const key of Object.keys(body)) {
    if (!allowed.has(key)) {
      throw new InvalidCharacterLifecycleRequestError(
        `Unknown character lifecycle field ${key}`,
      )
    }
  }
}

function expectedRevision(value: unknown): number {
  if (
    typeof value !== 'number' ||
    !Number.isSafeInteger(value) ||
    value < 1
  ) {
    throw new InvalidCharacterLifecycleRequestError(
      'expectedRevision must be a positive integer',
    )
  }

  return value
}

function nextStatus(
  value: unknown,
): LifecycleTargetStatus {
  if (value !== 'active' && value !== 'archived') {
    throw new InvalidCharacterLifecycleRequestError(
      'nextStatus must be active or archived',
    )
  }

  return value
}

function confirmation(value: unknown): boolean {
  if (typeof value !== 'boolean') {
    throw new InvalidCharacterLifecycleRequestError(
      'confirmed must be a boolean',
    )
  }

  return value
}

export function parseCharacterLifecycleRequest(
  characterId: string,
  input: unknown,
): TransitionCharacterLifecycleCommand {
  const body = record(input)
  assertOnlyLifecycleKeys(body)

  return {
    characterId,
    expectedRevision: expectedRevision(
      body.expectedRevision,
    ),
    nextStatus: nextStatus(body.nextStatus),
    confirmed: confirmation(body.confirmed),
  }
}

export function toCharacterLifecycleResponse(
  result: TransitionCharacterLifecycleResult,
): CharacterLifecycleResponseDto {
  return {
    character: toCharacterDraftResponse(
      result.character,
    ),
    validation:
      result.validation === null
        ? null
        : toCharacterValidationResponse(
            result.validation,
          ),
  }
}
