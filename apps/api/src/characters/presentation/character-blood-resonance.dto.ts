import {
  characterBloodDyscrasiaCatalog,
  characterBloodResonanceCatalog,
} from '@v5r/character-rules'

import type {
  ApplyCharacterBloodResonanceCommand,
} from '../application/apply-character-blood-resonance.use-case'

import {
  parseCharacterDraftIdParam,
} from './character-draft.dto'

export class InvalidCharacterBloodResonanceRequestError
  extends Error {
  constructor(message: string) {
    super(message)
    this.name =
      'InvalidCharacterBloodResonanceRequestError'
  }
}

type UnknownRecord =
  Record<string, unknown>

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const resonanceKeys =
  characterBloodResonanceCatalog.resonances.map(
    ({ key }) => key,
  )

const temperamentKeys =
  characterBloodResonanceCatalog.temperaments.map(
    ({ key }) => key,
  )

const affinityKeys =
  characterBloodResonanceCatalog
    .specialAffinities
    .map(({ key }) => key)

const dyscrasiaKeys =
  characterBloodDyscrasiaCatalog
    .definitions
    .map(({ key }) => key)

const dyscrasiaAcquisitionModes = [
  ...new Set(
    characterBloodDyscrasiaCatalog
      .definitions
      .flatMap(
        ({ acquisitionModes }) =>
          acquisitionModes,
      ),
  ),
]

function record(
  value: unknown,
): UnknownRecord {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new InvalidCharacterBloodResonanceRequestError(
      'body must be an object',
    )
  }

  return value as UnknownRecord
}

function onlyKeys(
  value: UnknownRecord,
  allowed: readonly string[],
): void {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) {
      throw new InvalidCharacterBloodResonanceRequestError(
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
    throw new InvalidCharacterBloodResonanceRequestError(
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
    throw new InvalidCharacterBloodResonanceRequestError(
      `${path} must be a UUID`,
    )
  }

  return value
}

function nullableOneOf(
  value: unknown,
  allowed: readonly string[],
  path: string,
): string | null {
  if (value === undefined || value === null) {
    return null
  }

  if (
    typeof value !== 'string' ||
    !allowed.includes(value)
  ) {
    throw new InvalidCharacterBloodResonanceRequestError(
      `${path} contains an unsupported value`,
    )
  }

  return value
}

export function parseApplyCharacterBloodResonanceRequest(
  characterIdInput: unknown,
  bodyInput: unknown,
): ApplyCharacterBloodResonanceCommand {
  const body = record(bodyInput)

  onlyKeys(
    body,
    [
      'expectedRevision',
      'operationId',
      'sourceKind',
      'resonanceKey',
      'specialAffinityKey',
      'temperament',
      'dyscrasiaKey',
      'dyscrasiaAcquisitionMode',
      'hungerSlaked',
    ],
  )

  const sourceKind = body.sourceKind

  if (
    sourceKind !== 'human' &&
    sourceKind !== 'animal'
  ) {
    throw new InvalidCharacterBloodResonanceRequestError(
      'body.sourceKind must be human or animal',
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
    operationId:
      uuid(
        body.operationId,
        'body.operationId',
      ),
    sourceKind,
    resonanceKey:
      nullableOneOf(
        body.resonanceKey,
        resonanceKeys,
        'body.resonanceKey',
      ) as ApplyCharacterBloodResonanceCommand['resonanceKey'],
    specialAffinityKey:
      nullableOneOf(
        body.specialAffinityKey,
        affinityKeys,
        'body.specialAffinityKey',
      ) as ApplyCharacterBloodResonanceCommand['specialAffinityKey'],
    temperament:
      nullableOneOf(
        body.temperament,
        temperamentKeys,
        'body.temperament',
      ) as ApplyCharacterBloodResonanceCommand['temperament'],
    ...(body.dyscrasiaKey === undefined
      ? {}
      : {
          dyscrasiaKey:
            nullableOneOf(
              body.dyscrasiaKey,
              dyscrasiaKeys,
              'body.dyscrasiaKey',
            ) as ApplyCharacterBloodResonanceCommand['dyscrasiaKey'],
        }),
    ...(body.dyscrasiaAcquisitionMode === undefined
      ? {}
      : {
          dyscrasiaAcquisitionMode:
            nullableOneOf(
              body.dyscrasiaAcquisitionMode,
              dyscrasiaAcquisitionModes,
              'body.dyscrasiaAcquisitionMode',
            ) as ApplyCharacterBloodResonanceCommand['dyscrasiaAcquisitionMode'],
        }),
    hungerSlaked:
      positiveInteger(
        body.hungerSlaked,
        'body.hungerSlaked',
      ),
  }
}
