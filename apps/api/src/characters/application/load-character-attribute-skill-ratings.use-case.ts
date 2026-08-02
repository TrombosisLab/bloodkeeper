import type {
  CharacterDraftRepository,
} from './character-draft.repository'

import {
  toCharacterAttributeSkillRatings,
} from '../domain/character-attribute-skill-ratings'

import type {
  CharacterAttributeSkillRatings,
} from '../domain/character-attribute-skill-ratings'

export class LoadCharacterAttributeSkillRatingsUseCase {
  constructor(
    private readonly repository:
      CharacterDraftRepository,
  ) {}

  async execute(
    ownerId: string,
    characterId: string,
  ): Promise<CharacterAttributeSkillRatings | null> {
    const draft = await this.repository.findById(
      ownerId,
      characterId,
    )

    return draft === null
      ? null
      : toCharacterAttributeSkillRatings(draft)
  }
}
