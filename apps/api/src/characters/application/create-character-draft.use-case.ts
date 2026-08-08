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

import {
  resolvePredatorTypeCreationSkills,
} from '../domain/predator-type-skill-grant.rules'

import {
  assertValidCharacterHumanityState,
} from '../domain/character-humanity-state.rules'

import {
  assertValidCharacterHunger,
} from '../domain/character-hunger.rules'

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
    const creationSkills =
      resolvePredatorTypeCreationSkills(
        data,
      )

    assertValidCharacterAttributeSkillState(
      data.attributes,
      creationSkills,
      data.creation.skillDistributionMethod,
      data.creation.currentStep,
      data.skillSpecialties,
      data.skills,
    )

    assertValidCharacterHumanityState(
      data.humanity.value,
      data.humanity.stains,
    )

    assertValidCharacterHunger(
      data.blood.hunger,
    )

    return this.repository.create(data)
  }
}
