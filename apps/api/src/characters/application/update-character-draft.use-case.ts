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

import {
  requireCharacterBlood,
} from '../domain/character-vampire-state.rules'


export class CharacterChronicleAssociationRequiredError
  extends Error {
  constructor(characterId: string) {
    super(
      `Character chronicle association must use its dedicated operation: ${characterId}`,
    )
    this.name =
      'CharacterChronicleAssociationRequiredError'
  }
}

export class HumanCharacterVampireStateMutationError
  extends Error {
  constructor(characterId: string) {
    super(
      `Human character ${characterId} cannot receive vampire-only draft state`,
    )
    this.name =
      'HumanCharacterVampireStateMutationError'
  }
}

export class SessionZeroVampireInitialStateMutationError
  extends Error {
  constructor(characterId: string) {
    super(
      `Session Zero vampire ${characterId} must resolve initial vampire state through dedicated operations`,
    )
    this.name =
      'SessionZeroVampireInitialStateMutationError'
  }
}

function changesInitialVampireState(
  data: UpdateCharacterDraftData,
): boolean {
  return (
    data.blood !== undefined ||
    data.identity?.clanKey !== undefined ||
    data.identity?.generation !== undefined ||
    data.identity?.predatorTypeKey !== undefined ||
    data.identity?.sire !== undefined ||
    data.identity?.ageCategory !== undefined ||
    data.disciplines !== undefined ||
    data.bloodSorceryRituals !== undefined ||
    data.oblivionCeremonies !== undefined ||
    data.thinBloodAlchemy !== undefined ||
    data.thinBloodTraits !== undefined ||
    data.advantages !== undefined ||
    data.creation?.predatorTypeChoices !== undefined
  )
}

function changesHumanVampireState(
  data: UpdateCharacterDraftData,
): boolean {
  return (
    data.blood !== undefined ||
    (
      data.identity?.clanKey !== undefined &&
      data.identity.clanKey !== null
    ) ||
    (
      data.identity?.generation !== undefined &&
      data.identity.generation !== null
    ) ||
    (
      data.identity?.predatorTypeKey !==
        undefined &&
      data.identity.predatorTypeKey !== null
    ) ||
    (
      data.disciplines !== undefined &&
      data.disciplines.length > 0
    ) ||
    (
      data.bloodSorceryRituals !== undefined &&
      data.bloodSorceryRituals.ritualKeys
        .length > 0
    ) ||
    (
      data.oblivionCeremonies !== undefined &&
      data.oblivionCeremonies.ceremonyKeys
        .length > 0
    ) ||
    data.thinBloodAlchemy !== undefined ||
    (
      data.thinBloodTraits !== undefined &&
      data.thinBloodTraits.length > 0
    ) ||
    (
      data.creation?.predatorTypeChoices !==
        undefined &&
      Object.keys(
        data.creation.predatorTypeChoices,
      ).length > 0
    )
  )
}

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

    const checksChronicleAssociation =
      data.chronicleId !== undefined

    if (
      changesAttributeSkillState ||
      changesDamageState ||
      changesHumanityState ||
      changesHungerState ||
      checksChronicleAssociation ||
      changesHumanVampireState(data) ||
      changesInitialVampireState(data)
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

      if (
        current.nature === 'human' &&
        changesHumanVampireState(data)
      ) {
        throw new HumanCharacterVampireStateMutationError(
          data.characterId,
        )
      }

      if (
        current.nature === 'vampire' &&
        current.creation.creationMode ===
          'sessionZero' &&
        changesInitialVampireState(data)
      ) {
        throw new SessionZeroVampireInitialStateMutationError(
          data.characterId,
        )
      }

      if (
        checksChronicleAssociation &&
        data.chronicleId !==
          current.chronicleId
      ) {
        throw new CharacterChronicleAssociationRequiredError(
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
        const blood =
          requireCharacterBlood(current)

        assertValidCharacterHunger(
          data.blood?.hunger ??
            blood.hunger,
        )
      }
    }

    return this.repository.update(ownerId, data)
  }
}
