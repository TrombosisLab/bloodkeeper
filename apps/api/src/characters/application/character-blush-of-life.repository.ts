import type {
  CharacterBlushOfLifeActiveDyscrasia,
  PersistCharacterBlushOfLifeExemptionData,
  PersistedCharacterBlushOfLifeExemptionOperation,
} from '../domain/character-blush-of-life.types'

export const CHARACTER_BLUSH_OF_LIFE_REPOSITORY =
  Symbol(
    'CHARACTER_BLUSH_OF_LIFE_REPOSITORY',
  )

export interface CharacterBlushOfLifeRepository {
  findExemptionOperation(
    characterId: string,
    operationId: string,
  ): Promise<
    PersistedCharacterBlushOfLifeExemptionOperation | null
  >

  findActiveDyscrasia(
    characterId: string,
  ): Promise<
    CharacterBlushOfLifeActiveDyscrasia | null
  >

  persistExemption(
    data:
      PersistCharacterBlushOfLifeExemptionData,
  ): Promise<
    PersistedCharacterBlushOfLifeExemptionOperation
  >
}

export class CharacterBlushOfLifeWriteConflictError
  extends Error {
  constructor(characterId: string) {
    super(
      `Character Blush of Life ${characterId} was not found or changed concurrently`,
    )
    this.name =
      'CharacterBlushOfLifeWriteConflictError'
  }
}

export class CharacterBlushOfLifeOperationConflictError
  extends Error {
  constructor(
    characterId: string,
    operationId: string,
  ) {
    super(
      `Character Blush of Life operation ${characterId}/${operationId} was already used with different data`,
    )
    this.name =
      'CharacterBlushOfLifeOperationConflictError'
  }
}
