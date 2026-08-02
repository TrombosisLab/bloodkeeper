import type {
  CharacterDraftRepository,
} from './character-draft.repository'

import type {
  PersistedCharacterDraft,
} from '../domain/persisted-character.types'

export class LoadCharacterDraftUseCase {
  private readonly repository:
    CharacterDraftRepository

  constructor(
    repository: CharacterDraftRepository,
  ) {
    this.repository = repository
  }

  execute(
    characterId: string,
  ): Promise<PersistedCharacterDraft | null> {
    return this.repository.findById(
      characterId,
    )
  }
}
