import {
  characterBloodDyscrasiaCatalog,
} from '@v5r/character-rules'

import type {
  CharacterRulesBloodDyscrasiaKey,
} from '@v5r/character-rules'

export type CharacterBlushOfLifeDyscrasiaKey =
  CharacterRulesBloodDyscrasiaKey

export interface CharacterBlushOfLifeActiveDyscrasia {
  readonly sourceBloodOperationId: string
  readonly dyscrasiaKey:
    CharacterBlushOfLifeDyscrasiaKey
}

export interface CharacterBlushOfLifeExemptionAttempt {
  readonly actorId: string
}

export interface PersistedCharacterBlushOfLifeExemptionOperation {
  readonly characterId: string
  readonly operationId: string
  readonly actorId: string
  readonly dyscrasiaKey:
    CharacterBlushOfLifeDyscrasiaKey
  readonly sourceBloodOperationId: string
  readonly hungerBefore: number
  readonly hungerAfter: number
  readonly characterRevision: number
  readonly createdAt: Date
}

export interface PersistCharacterBlushOfLifeExemptionData
  extends CharacterBlushOfLifeExemptionAttempt {
  readonly characterId: string
  readonly expectedRevision: number
  readonly operationId: string
  readonly dyscrasiaKey:
    CharacterBlushOfLifeDyscrasiaKey
  readonly sourceBloodOperationId: string
  readonly hungerBefore: number
}

export function isCharacterBlushOfLifeRouseExemption(
  dyscrasiaKey:
    CharacterBlushOfLifeDyscrasiaKey,
): boolean {
  const definition =
    characterBloodDyscrasiaCatalog
      .definitions
      .find(
        ({ key }) =>
          key === dyscrasiaKey,
      )

  return (
    definition !== undefined &&
    definition.active === true &&
    definition.effect.kind ===
      'rouseCheckExemption' &&
    definition.effect.action ===
      'blushOfLife'
  )
}

export function isSameCharacterBlushOfLifeExemptionOperation(
  existing:
    PersistedCharacterBlushOfLifeExemptionOperation,
  attempted:
    CharacterBlushOfLifeExemptionAttempt,
): boolean {
  return (
    existing.actorId ===
    attempted.actorId
  )
}
