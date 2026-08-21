import type {
  PersistCharacterRouseCheckData,
  PersistedCharacterRouseCheckOperation,
} from '../domain/character-rouse-check-operation.types'

export const CHARACTER_ROUSE_CHECK_REPOSITORY =
  Symbol('CHARACTER_ROUSE_CHECK_REPOSITORY')

export interface CharacterRouseCheckRepository {
  findOperation(
    characterId: string,
    operationId: string,
  ): Promise<
    PersistedCharacterRouseCheckOperation | null
  >

  persist(
    data: PersistCharacterRouseCheckData,
  ): Promise<PersistedCharacterRouseCheckOperation>
}

export class CharacterRouseCheckWriteConflictError
  extends Error {
  constructor(characterId: string) {
    super(
      `Character Rouse Check ${characterId} was not found or changed concurrently`,
    )
    this.name =
      'CharacterRouseCheckWriteConflictError'
  }
}

export class CharacterRouseCheckOperationConflictError
  extends Error {
  constructor(
    characterId: string,
    operationId: string,
  ) {
    super(
      `Character Rouse Check operation ${characterId}/${operationId} was already used with different data`,
    )
    this.name =
      'CharacterRouseCheckOperationConflictError'
  }
}
