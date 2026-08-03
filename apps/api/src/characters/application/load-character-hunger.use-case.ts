import type {
  CharacterDraftRepository,
} from './character-draft.repository'

import {
  toCharacterHungerReadModel,
} from '../domain/character-hunger-read-model'

import type {
  CharacterHungerReadModel,
} from '../domain/character-hunger-read-model'

export class LoadCharacterHungerUseCase {
  constructor(
    private readonly repository:
      CharacterDraftRepository,
  ) {}

  async execute(
    ownerId: string,
    characterId: string,
  ): Promise<CharacterHungerReadModel | null> {
    const draft = await this.repository.findById(
      ownerId,
      characterId,
    )

    return draft === null
      ? null
      : toCharacterHungerReadModel(draft)
  }
}
