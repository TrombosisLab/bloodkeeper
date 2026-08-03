import type {
  CharacterSecondaryRepository,
} from './character-secondary.repository'

import type {
  PersistedCharacterSecondaryData,
} from '../domain/persisted-character-secondary.types'

export class LoadCharacterSecondaryUseCase {
  constructor(
    private readonly repository:
      CharacterSecondaryRepository,
  ) {}

  execute(
    ownerId: string,
    characterId: string,
  ): Promise<PersistedCharacterSecondaryData | null> {
    return this.repository.findByCharacterId(
      ownerId,
      characterId,
    )
  }
}
