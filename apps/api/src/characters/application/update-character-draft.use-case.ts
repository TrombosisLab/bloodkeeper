import {
  CharacterDraftWriteConflictError,
} from './character-draft.repository'

import type {
  CharacterDraftRepository,
} from './character-draft.repository'

import type {
  PersistedCharacterDraft,
  UpdateCharacterDraftData,
} from '../domain/persisted-character.types'

import {
  assertValidCharacterAttributeSkillState,
} from '../domain/character-attribute-skill.rules'

import {
  resolvePredatorTypeCreationSkills,
} from '../domain/predator-type-skill-grant.rules'

import {
  assertValidCharacterDamageState,
} from '../domain/character-damage.rules'

import {
  assertValidCharacterHumanityState,
} from '../domain/character-humanity-state.rules'

import {
  assertValidCharacterHunger,
} from '../domain/character-hunger.rules'

export class UpdateCharacterDraftUseCase {
  private readonly repository:
    CharacterDraftRepository

  constructor(
    repository: CharacterDraftRepository,
  ) {
    this.repository = repository
  }

  async execute(
    ownerId: string,
    data: UpdateCharacterDraftData,
  ): Promise<PersistedCharacterDraft> {
    const changesAttributeSkillState =
      data.attributes !== undefined ||
      data.skills !== undefined ||
      data.skillSpecialties !== undefined ||
      data.identity?.predatorTypeKey !==
        undefined ||
      data.identity?.clanKey !==
        undefined ||
      data.creation?.skillDistributionMethod !==
        undefined ||
      data.creation?.currentStep !== undefined ||
      data.creation?.predatorTypeChoices !==
        undefined

    const changesDamageState =
      data.damage !== undefined ||
      data.attributes?.stamina !== undefined ||
      data.attributes?.composure !== undefined ||
      data.attributes?.resolve !== undefined

    const changesHumanityState =
      data.humanityValue !== undefined ||
      data.humanityStains !== undefined

    const changesHungerState =
      data.blood?.hunger !== undefined

    if (
      changesAttributeSkillState ||
      changesDamageState ||
      changesHumanityState ||
      changesHungerState
    ) {
      const current =
        await this.repository.findById(
          ownerId,
          data.characterId,
        )

      if (
        current === null ||
        current.revision !== data.expectedRevision
      ) {
        throw new CharacterDraftWriteConflictError(
          data.characterId,
        )
      }

      const attributes = {
        ...current.attributes,
        ...data.attributes,
      }

      if (changesAttributeSkillState) {
        const skills = {
          ...current.skills,
          ...data.skills,
        }

        const skillSpecialties =
          data.skillSpecialties ??
          current.skillSpecialties

        const creation = {
          ...current.creation,
          ...data.creation,
          predatorTypeChoices:
            data.creation
              ?.predatorTypeChoices ??
            current.creation
              .predatorTypeChoices ??
            {},
        }

        const skillGrantState = {
          identity: {
            ...current.identity,
            ...data.identity,
          },
          skills,
          skillSpecialties,
          creation,
        }

        const creationSkills =
          resolvePredatorTypeCreationSkills(
            skillGrantState,
          )

        assertValidCharacterAttributeSkillState(
          attributes,
          creationSkills,
          creation.skillDistributionMethod,
          creation.currentStep,
          skillSpecialties,
          skills,
        )
      }

      if (changesDamageState) {
        assertValidCharacterDamageState(
          attributes,
          data.damage ?? current.damage,
        )
      }

      if (changesHumanityState) {
        assertValidCharacterHumanityState(
          data.humanityValue ??
            current.humanity.value,
          data.humanityStains ??
            current.humanity.stains,
        )
      }

      if (changesHungerState) {
        assertValidCharacterHunger(
          data.blood?.hunger ??
            current.blood.hunger,
        )
      }
    }

    return this.repository.update(ownerId, data)
  }
}
