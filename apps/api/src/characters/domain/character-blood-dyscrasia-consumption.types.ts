import {
  characterBloodDyscrasiaCatalog,
} from '@v5r/character-rules'

import type {
  CharacterRulesBloodDyscrasiaKey,
} from '@v5r/character-rules'

export type CharacterBloodDyscrasiaKey =
  CharacterRulesBloodDyscrasiaKey

export interface PersistedCharacterBloodDyscrasiaActiveInstance {
  readonly characterId: string
  readonly sourceBloodOperationId: string
  readonly dyscrasiaKey:
    CharacterBloodDyscrasiaKey
}

export interface PersistedCharacterBloodDyscrasiaConsumptionOperation {
  readonly characterId: string
  readonly operationId: string
  readonly sourceBloodOperationId: string
  readonly dyscrasiaKey:
    CharacterBloodDyscrasiaKey
  readonly createdAt: Date
}

export interface ConsumeCharacterBloodDyscrasiaData {
  readonly characterId: string
  readonly expectedRevision: number
  readonly operationId: string
  readonly sourceBloodOperationId: string
  readonly dyscrasiaKey:
    CharacterBloodDyscrasiaKey
}

export type CharacterBloodDyscrasiaConsumptionViolation =
  | 'NOT_CONSUMABLE'

export class InvalidCharacterBloodDyscrasiaConsumptionError
  extends Error {
  readonly violations:
    readonly CharacterBloodDyscrasiaConsumptionViolation[]

  constructor(
    violations:
      readonly CharacterBloodDyscrasiaConsumptionViolation[],
  ) {
    super(
      'Character blood Dyscrasia consumption is invalid',
    )
    this.name =
      'InvalidCharacterBloodDyscrasiaConsumptionError'
    this.violations = [...violations]
  }
}

export function assertConsumableCharacterBloodDyscrasia(
  dyscrasiaKey: CharacterBloodDyscrasiaKey,
): void {
  const definition =
    characterBloodDyscrasiaCatalog
      .definitions
      .find(
        ({ key }) => key === dyscrasiaKey,
      )

  if (
    definition === undefined ||
    definition.consumable !== true
  ) {
    throw new InvalidCharacterBloodDyscrasiaConsumptionError(
      ['NOT_CONSUMABLE'],
    )
  }
}

export function isSameCharacterBloodDyscrasiaConsumptionOperation(
  existing:
    PersistedCharacterBloodDyscrasiaConsumptionOperation,
  attempted: Pick<
    ConsumeCharacterBloodDyscrasiaData,
    | 'sourceBloodOperationId'
    | 'dyscrasiaKey'
  >,
): boolean {
  return (
    existing.sourceBloodOperationId ===
      attempted.sourceBloodOperationId &&
    existing.dyscrasiaKey ===
      attempted.dyscrasiaKey
  )
}
