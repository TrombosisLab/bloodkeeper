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

function hasSessionZeroVampireState(
  data: CreateCharacterDraftData,
): boolean {
  return (
    data.blood !== null ||
    data.thinBloodAlchemy !== null ||
    data.disciplines.length > 0 ||
    data.bloodSorceryRituals.ritualKeys.length > 0 ||
    data.oblivionCeremonies.ceremonyKeys.length > 0 ||
    data.thinBloodTraits.length > 0 ||
    Object.keys(data.creation.predatorTypeChoices).length > 0 ||
    data.identity.predatorTypeKey != null ||
    data.identity.clanKey != null ||
    data.identity.sire != null ||
    data.identity.generation != null ||
    data.identity.ageCategory != null
  )
}

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
    const creationMode =
      data.creation.creationMode ?? 'standard'

    if (
      creationMode === 'sessionZero' &&
      hasSessionZeroVampireState(data)
    ) {
      throw new Error(
        'SESSION_ZERO_CHARACTER_HAS_VAMPIRE_STATE',
      )
    }

    if (
      creationMode === 'standard' &&
      (
        data.blood === null ||
        data.thinBloodAlchemy === null
      )
    ) {
      throw new Error(
        'STANDARD_CHARACTER_REQUIRES_VAMPIRE_STATE',
      )
    }

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

    if (data.blood !== null) {
      assertValidCharacterHunger(
        data.blood.hunger,
      )
    }

    return this.repository.create(data)
  }
}
