import type {
  CharacterDraftRepository,
} from './character-draft.repository'

import type {
  PersistedCharacterDraft,
  UpdateCharacterDraftData,
} from '../domain/persisted-character.types'

export class UpdateCharacterDraftUseCase {
  private readonly repository:
    CharacterDraftRepository

  constructor(
    repository: CharacterDraftRepository,
  ) {
    this.repository = repository
  }

  execute(
    ownerId: string,
    data: UpdateCharacterDraftData,
  ): Promise<PersistedCharacterDraft> {
    return this.repository.update(ownerId, data)
  }
}
