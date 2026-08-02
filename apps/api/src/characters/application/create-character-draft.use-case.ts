import type {
  CharacterDraftRepository,
} from './character-draft.repository'

import type {
  CreateCharacterDraftData,
  PersistedCharacterDraft,
} from '../domain/persisted-character.types'

import {
  assertValidCharacterAttributeSkillState,
} from '../domain/character-attribute-skill.rules'

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
    assertValidCharacterAttributeSkillState(
      data.attributes,
      data.skills,
      data.creation.skillDistributionMethod,
      data.creation.currentStep,
      data.skillSpecialties,
    )

    return this.repository.create(data)
  }
}
