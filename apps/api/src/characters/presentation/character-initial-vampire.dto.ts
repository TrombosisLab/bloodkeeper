import type {
  AdoptInitialPredatorTypeCommand,
  ConsolidateInitialVampireProfileCommand,
  InitialVampireProfileConsolidationResult,
  EstablishInitialBloodCommand,
  ManifestInitialDisciplineCommand,
  ManifestInitialPowerCommand,
  ReviewInitialAdvantagesCommand,
  ResolveInitialThinBloodStateCommand,
  ResolveInitialClanCommand,
  ResolveInitialGenerationCommand,
} from '../application/resolve-initial-vampire-state.use-case'

import type {
  InitialVampireResolutionResult,
} from '../domain/character-initial-vampire-resolution.types'

import {
  InvalidCharacterDraftRequestError,
  parseCharacterDraftIdParam,
  parseUpdateCharacterDraftRequest,
  toCharacterDraftResponse,
} from './character-draft.dto'

import type {
  CharacterDraftResponseDto,
} from './character-draft.dto'

export class InvalidInitialVampireResolutionRequestError
  extends Error {
  constructor(message: string) {
    super(message)
    this.name =
      'InvalidInitialVampireResolutionRequestError'
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
    throw new InvalidInitialVampireResolutionRequestError(
      'body must be an object',
    )
  }

  return value as Record<string, unknown>
}

function onlyKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
): void {
  const unexpected =
    Object.keys(value).filter(
      (key) => !allowed.includes(key),
    )

  if (unexpected.length > 0) {
    throw new InvalidInitialVampireResolutionRequestError(
      `body.${unexpected[0]} is not allowed`,
    )
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
    throw new InvalidInitialVampireResolutionRequestError(
      `${path} must be a positive integer`,
    )
  }

  return value as number
}

function integer(
  value: unknown,
  path: string,
): number {
  if (!Number.isSafeInteger(value)) {
    throw new InvalidInitialVampireResolutionRequestError(
      `${path} must be an integer`,
    )
  }

  return value as number
}

function nonEmptyString(
  value: unknown,
  path: string,
): string {
  if (
    typeof value !== 'string' ||
    value.trim().length === 0
  ) {
    throw new InvalidInitialVampireResolutionRequestError(
      `${path} must be a non-empty string`,
    )
  }

  return value.trim()
}

function base(
  characterIdInput: unknown,
  bodyInput: unknown,
  allowed: readonly string[],
) {
  const body = record(bodyInput)
  onlyKeys(body, allowed)

  if (
    !Object.hasOwn(
      body,
      'expectedRevision',
    )
  ) {
    throw new InvalidInitialVampireResolutionRequestError(
      'body.expectedRevision is required',
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
    body,
  }
}

export function parseConsolidateInitialVampireProfileRequest(
  characterIdInput: unknown,
  bodyInput: unknown,
): ConsolidateInitialVampireProfileCommand {
  const parsed = base(
    characterIdInput,
    bodyInput,
    ['expectedRevision'],
  )

  return {
    characterId: parsed.characterId,
    expectedRevision:
      parsed.expectedRevision,
  }
}

export function parseResolveInitialClanRequest(
  characterIdInput: unknown,
  bodyInput: unknown,
): ResolveInitialClanCommand {
  const parsed = base(
    characterIdInput,
    bodyInput,
    ['expectedRevision', 'clanKey'],
  )

  if (
    !Object.hasOwn(
      parsed.body,
      'clanKey',
    )
  ) {
    throw new InvalidInitialVampireResolutionRequestError(
      'body.clanKey is required',
    )
  }

  return {
    characterId: parsed.characterId,
    expectedRevision:
      parsed.expectedRevision,
    clanKey:
      nonEmptyString(
        parsed.body.clanKey,
        'body.clanKey',
      ),
  }
}

export function parseResolveInitialGenerationRequest(
  characterIdInput: unknown,
  bodyInput: unknown,
): ResolveInitialGenerationCommand {
  const parsed = base(
    characterIdInput,
    bodyInput,
    ['expectedRevision', 'generation'],
  )

  if (
    !Object.hasOwn(
      parsed.body,
      'generation',
    )
  ) {
    throw new InvalidInitialVampireResolutionRequestError(
      'body.generation is required',
    )
  }

  return {
    characterId: parsed.characterId,
    expectedRevision:
      parsed.expectedRevision,
    generation:
      integer(
        parsed.body.generation,
        'body.generation',
      ),
  }
}

export function parseEstablishInitialBloodRequest(
  characterIdInput: unknown,
  bodyInput: unknown,
): EstablishInitialBloodCommand {
  const parsed = base(
    characterIdInput,
    bodyInput,
    [
      'expectedRevision',
      'bloodPotency',
      'hunger',
    ],
  )

  for (
    const key of
      ['bloodPotency', 'hunger'] as const
  ) {
    if (!Object.hasOwn(parsed.body, key)) {
      throw new InvalidInitialVampireResolutionRequestError(
        `body.${key} is required`,
      )
    }
  }

  return {
    characterId: parsed.characterId,
    expectedRevision:
      parsed.expectedRevision,
    bloodPotency:
      integer(
        parsed.body.bloodPotency,
        'body.bloodPotency',
      ),
    hunger:
      integer(
        parsed.body.hunger,
        'body.hunger',
      ),
  }
}


export function parseManifestInitialDisciplineRequest(
  characterIdInput: unknown,
  bodyInput: unknown,
): ManifestInitialDisciplineCommand {
  const parsed = base(
    characterIdInput,
    bodyInput,
    [
      'expectedRevision',
      'disciplineKey',
      'rating',
    ],
  )

  for (
    const key of
      ['disciplineKey', 'rating'] as const
  ) {
    if (!Object.hasOwn(parsed.body, key)) {
      throw new InvalidInitialVampireResolutionRequestError(
        `body.${key} is required`,
      )
    }
  }

  return {
    characterId: parsed.characterId,
    expectedRevision:
      parsed.expectedRevision,
    disciplineKey:
      nonEmptyString(
        parsed.body.disciplineKey,
        'body.disciplineKey',
      ),
    rating:
      integer(
        parsed.body.rating,
        'body.rating',
      ),
  }
}

export function parseManifestInitialPowerRequest(
  characterIdInput: unknown,
  bodyInput: unknown,
): ManifestInitialPowerCommand {
  const parsed = base(
    characterIdInput,
    bodyInput,
    [
      'expectedRevision',
      'disciplineKey',
      'powerKey',
    ],
  )

  for (
    const key of
      ['disciplineKey', 'powerKey'] as const
  ) {
    if (!Object.hasOwn(parsed.body, key)) {
      throw new InvalidInitialVampireResolutionRequestError(
        `body.${key} is required`,
      )
    }
  }

  return {
    characterId: parsed.characterId,
    expectedRevision:
      parsed.expectedRevision,
    disciplineKey:
      nonEmptyString(
        parsed.body.disciplineKey,
        'body.disciplineKey',
      ),
    powerKey:
      nonEmptyString(
        parsed.body.powerKey,
        'body.powerKey',
      ),
  }
}


export function parseResolveInitialThinBloodStateRequest(
  characterIdInput: unknown,
  bodyInput: unknown,
): ResolveInitialThinBloodStateCommand {
  const parsed = base(
    characterIdInput,
    bodyInput,
    [
      'expectedRevision',
      'thinBloodTraits',
      'thinBloodAlchemy',
    ],
  )

  for (
    const key of [
      'thinBloodTraits',
      'thinBloodAlchemy',
    ] as const
  ) {
    if (!Object.hasOwn(parsed.body, key)) {
      throw new InvalidInitialVampireResolutionRequestError(
        `body.${key} is required`,
      )
    }
  }

  try {
    const update =
      parseUpdateCharacterDraftRequest(
        characterIdInput,
        bodyInput,
      )

    if (
      update.thinBloodTraits ===
        undefined ||
      update.thinBloodAlchemy ===
        undefined
    ) {
      throw new InvalidInitialVampireResolutionRequestError(
        'Thin-Blood request is incomplete',
      )
    }

    return {
      characterId:
        update.characterId,
      expectedRevision:
        parsed.expectedRevision,
      thinBloodTraits:
        update.thinBloodTraits,
      thinBloodAlchemy:
        update.thinBloodAlchemy,
    }
  } catch (error: unknown) {
    if (
      error instanceof
        InvalidInitialVampireResolutionRequestError
    ) {
      throw error
    }

    if (
      error instanceof
        InvalidCharacterDraftRequestError
    ) {
      throw new InvalidInitialVampireResolutionRequestError(
        error.message,
      )
    }

    throw error
  }
}


export function parseReviewInitialAdvantagesRequest(
  characterIdInput: unknown,
  bodyInput: unknown,
): ReviewInitialAdvantagesCommand {
  const parsed = base(
    characterIdInput,
    bodyInput,
    [
      'expectedRevision',
      'advantages',
    ],
  )

  if (
    !Object.hasOwn(
      parsed.body,
      'advantages',
    )
  ) {
    throw new InvalidInitialVampireResolutionRequestError(
      'body.advantages is required',
    )
  }

  try {
    const update =
      parseUpdateCharacterDraftRequest(
        characterIdInput,
        bodyInput,
      )

    if (update.advantages === undefined) {
      throw new InvalidInitialVampireResolutionRequestError(
        'body.advantages is required',
      )
    }

    return {
      characterId: update.characterId,
      expectedRevision:
        parsed.expectedRevision,
      advantages:
        update.advantages,
    }
  } catch (error: unknown) {
    if (
      error instanceof
        InvalidInitialVampireResolutionRequestError
    ) {
      throw error
    }

    if (
      error instanceof
        InvalidCharacterDraftRequestError
    ) {
      throw new InvalidInitialVampireResolutionRequestError(
        error.message,
      )
    }

    throw error
  }
}


function initialPredatorNonEmptyText(
  value: unknown,
  path: string,
): string {
  if (
    typeof value !== 'string' ||
    value.trim().length === 0
  ) {
    throw new InvalidInitialVampireResolutionRequestError(
      `${path} must be a non-empty string`,
    )
  }

  return value.trim()
}

export function parseAdoptInitialPredatorTypeRequest(
  characterIdInput: unknown,
  bodyInput: unknown,
): AdoptInitialPredatorTypeCommand {
  const parsed = base(
    characterIdInput,
    bodyInput,
    [
      'expectedRevision',
      'predatorTypeKey',
      'predatorTypeChoices',
      'disciplinePowerKey',
      'advantages',
    ],
  )

  for (
    const key of [
      'predatorTypeKey',
      'predatorTypeChoices',
      'disciplinePowerKey',
      'advantages',
    ] as const
  ) {
    if (!Object.hasOwn(parsed.body, key)) {
      throw new InvalidInitialVampireResolutionRequestError(
        `body.${key} is required`,
      )
    }
  }

  const predatorTypeKey =
    initialPredatorNonEmptyText(
      parsed.body.predatorTypeKey,
      'body.predatorTypeKey',
    )

  const disciplinePowerKey =
    initialPredatorNonEmptyText(
      parsed.body.disciplinePowerKey,
      'body.disciplinePowerKey',
    )

  try {
    const update =
      parseUpdateCharacterDraftRequest(
        characterIdInput,
        {
          expectedRevision:
            parsed.expectedRevision,
          identity: {
            predatorTypeKey,
          },
          creation: {
            predatorTypeChoices:
              parsed.body.predatorTypeChoices,
          },
          advantages:
            parsed.body.advantages,
        },
      )

    if (
      update.identity?.predatorTypeKey ===
        undefined ||
      update.identity.predatorTypeKey ===
        null ||
      update.creation?.predatorTypeChoices ===
        undefined ||
      update.advantages === undefined
    ) {
      throw new InvalidInitialVampireResolutionRequestError(
        'Predator Type request is incomplete',
      )
    }

    return {
      characterId: parsed.characterId,
      expectedRevision:
        parsed.expectedRevision,
      predatorTypeKey:
        update.identity.predatorTypeKey,
      predatorTypeChoices:
        update.creation.predatorTypeChoices,
      disciplinePowerKey,
      advantages:
        update.advantages,
    }
  } catch (error: unknown) {
    if (
      error instanceof
        InvalidInitialVampireResolutionRequestError
    ) {
      throw error
    }

    if (
      error instanceof
        InvalidCharacterDraftRequestError
    ) {
      throw new InvalidInitialVampireResolutionRequestError(
        error.message,
      )
    }

    throw error
  }
}

export interface InitialVampireResolutionResponseDto {
  readonly character:
    CharacterDraftResponseDto
  readonly pendingDecisions:
    InitialVampireResolutionResult[
      'pendingDecisions'
    ]
}

export function toInitialVampireResolutionResponse(
  result: InitialVampireResolutionResult,
): InitialVampireResolutionResponseDto {
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

export interface InitialVampireProfileConsolidationResponseDto {
  readonly character:
    CharacterDraftResponseDto
  readonly pendingDecisions:
    InitialVampireProfileConsolidationResult[
      'pendingDecisions'
    ]
  readonly phase:
    InitialVampireProfileConsolidationResult[
      'phase'
    ]
}

export function toInitialVampireProfileConsolidationResponse(
  result:
    InitialVampireProfileConsolidationResult,
): InitialVampireProfileConsolidationResponseDto {
  return {
    character:
      toCharacterDraftResponse(
        result.character,
      ),
    pendingDecisions: [
      ...result.pendingDecisions,
    ],
    phase: result.phase,
  }
}
