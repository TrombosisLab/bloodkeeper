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
      data.creation?.skillDistributionMethod !==
        undefined ||
      data.creation?.currentStep !== undefined

    if (changesAttributeSkillState) {
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

      assertValidCharacterAttributeSkillState(
        {
          ...current.attributes,
          ...data.attributes,
        },
        {
          ...current.skills,
          ...data.skills,
        },
        data.creation
          ?.skillDistributionMethod ??
          current.creation
            .skillDistributionMethod,
        data.creation?.currentStep ??
          current.creation.currentStep,
        data.skillSpecialties ??
          current.skillSpecialties,
      )
    }

    return this.repository.update(ownerId, data)
  }
}
