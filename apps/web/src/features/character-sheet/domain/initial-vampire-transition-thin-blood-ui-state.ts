import {
  draftThinBloodTraitsToApi,
} from '../../character-creation/domain/character-draft-api.mapper.ts'

import {
  createEmptyThinBloodAlchemy,
  normalizeThinBloodAlchemyForCharacter,
  validateInitialThinBloodAlchemySelection,
} from '../../character-creation/domain/thin-blood-alchemy-rules.ts'

import {
  validateThinBloodTraitsForCharacterKind,
} from '../../character-creation/domain/thin-blood-trait-rules.ts'

import type {
  CharacterThinBloodAlchemyDraft,
} from '../../character-creation/types/thin-blood-alchemy.types.ts'

import type {
  CharacterThinBloodTraitsDraft,
} from '../../character-creation/types/thin-blood-trait.types.ts'

import type {
  ClanKey,
} from '../../character-creation/types/clan.types.ts'

import type {
  CharacterInitialVampireGateway,
} from '../infrastructure/character-initial-vampire.api.ts'

import type {
  CharacterInitialVampireTransitionReadModel,
} from '../types/character-transition-read-model.types.ts'

export interface InitialVampireThinBloodResolution {
  readonly valid: boolean
  readonly errors: readonly string[]

  readonly thinBloodTraits:
    Parameters<
      CharacterInitialVampireGateway[
        'resolveThinBloodState'
      ]
    >[2]

  readonly thinBloodAlchemy:
    Parameters<
      CharacterInitialVampireGateway[
        'resolveThinBloodState'
      ]
    >[3]
}

function optionalClanKey(
  value: string,
): ClanKey {
  /*
   * El catálogo/validador compartido decide
   * posteriormente si el Clan es real y legal.
   * Este cast sólo adapta la forma API al draft UI.
   */
  return value as ClanKey
}

export function initialVampireThinBloodTraitsDraft(
  transition:
    CharacterInitialVampireTransitionReadModel,
): CharacterThinBloodTraitsDraft {
  return {
    selections:
      transition.thinBloodTraits.map(
        (selection) => ({
          definitionKey:
            selection.definitionKey,

          ...(selection
            .clanCurseDetails === null
            ? {}
            : {
                clanCurseDetails: {
                  clanKey:
                    optionalClanKey(
                      selection
                        .clanCurseDetails
                        .clanKey,
                    ),
                },
              }),

          ...(selection
            .disciplineAffinityDetails ===
              null
            ? {}
            : {
                disciplineAffinityDetails: {
                  ...selection
                    .disciplineAffinityDetails,
                },
              }),
        }),
      ),
  }
}

export function initialVampireThinBloodAlchemyDraft(
  transition:
    CharacterInitialVampireTransitionReadModel,
): CharacterThinBloodAlchemyDraft {
  return transition.thinBloodAlchemy === null
    ? createEmptyThinBloodAlchemy()
    : {
        rating:
          transition
            .thinBloodAlchemy
            .rating,
        method:
          transition
            .thinBloodAlchemy
            .method,
        formulaKeys: [
          ...transition
            .thinBloodAlchemy
            .formulaKeys,
        ],
      }
}

export function initialVampireThinBloodResolution(
  traits:
    CharacterThinBloodTraitsDraft,
  alchemy:
    CharacterThinBloodAlchemyDraft,
): InitialVampireThinBloodResolution {
  const traitValidation =
    validateThinBloodTraitsForCharacterKind(
      traits,
      'thinBlood',
    )

  const normalizedAlchemy =
    normalizeThinBloodAlchemyForCharacter(
      alchemy,
      'thinBlood',
      traits,
    )

  const alchemyValidation =
    validateInitialThinBloodAlchemySelection(
      normalizedAlchemy,
      'thinBlood',
      traits,
    )

  return {
    valid:
      traitValidation.valid &&
      alchemyValidation.valid,

    errors: [
      ...traitValidation.errors,
      ...alchemyValidation.errors,
    ],

    thinBloodTraits:
      draftThinBloodTraitsToApi({
        thinBloodTraits:
          traits,
      }),

    thinBloodAlchemy: {
      rating:
        normalizedAlchemy.rating,
      method:
        normalizedAlchemy.method,
      formulaKeys: [
        ...normalizedAlchemy
          .formulaKeys,
      ],
    },
  }
}
