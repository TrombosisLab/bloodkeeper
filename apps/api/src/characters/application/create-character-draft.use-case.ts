import type {
  CharacterDraftRepository,
} from './character-draft.repository'

import type {
  CreateCharacterDraftData,
  PersistedCharacterDraft,
} from '../domain/persisted-character.types'

export class CreateCharacterDraftUseCase {
  private readonly repository:
    CharacterDraftRepository

  constructor(
    repository: CharacterDraftRepository,
  ) {
    this.repository = repository
  }

  execute(
    data: CreateCharacterDraftData,
  ): Promise<PersistedCharacterDraft> {
    return this.repository.create(data)
  }
}
