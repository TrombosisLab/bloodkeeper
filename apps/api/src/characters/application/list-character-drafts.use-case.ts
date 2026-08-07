import type {
  CharacterDraftRepository,
} from './character-draft.repository'

import type {
  PersistedCharacterDraft,
} from '../domain/persisted-character.types'

export class ListCharacterDraftsUseCase {
  constructor(
    private readonly repository:
      CharacterDraftRepository,
  ) {}

  execute(
    ownerId: string,
  ): Promise<readonly PersistedCharacterDraft[]> {
    return this.repository.listByOwner(
      ownerId,
    )
  }
}
