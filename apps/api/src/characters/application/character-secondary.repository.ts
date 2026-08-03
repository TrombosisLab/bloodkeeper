import type {
  PersistedCharacterSecondaryData,
  UpdateCharacterSecondaryData,
} from '../domain/persisted-character-secondary.types'

export const CHARACTER_SECONDARY_REPOSITORY =
  Symbol('CHARACTER_SECONDARY_REPOSITORY')

export interface CharacterSecondaryRepository {
  findByCharacterId(
    ownerId: string,
    characterId: string,
  ): Promise<PersistedCharacterSecondaryData | null>

  update(
    ownerId: string,
    data: UpdateCharacterSecondaryData,
  ): Promise<PersistedCharacterSecondaryData>
}

export class CharacterSecondaryWriteConflictError
  extends Error {
  constructor(characterId: string) {
    super(
      `Character secondary data ${characterId} was not found or has changed`,
    )
    this.name =
      'CharacterSecondaryWriteConflictError'
  }
}
