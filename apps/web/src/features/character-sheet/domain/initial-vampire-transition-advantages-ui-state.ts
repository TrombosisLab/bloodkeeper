import {
  clanKeys,
} from '../../character-creation/data/clan-definitions.ts'

import {
  generationOptions,
} from '../../character-creation/data/identity-options.ts'

import {
  apiAdvantagesToDraft,
  draftAdvantagesToApi,
} from '../../character-creation/domain/character-draft-api.mapper.ts'

import {
  validateInitialCharacterAdvantagesBudget,
} from '../../character-creation/domain/advantage-rules.ts'

import type {
  CharacterAdvantagesDraft,
} from '../../character-creation/types/character-advantages-draft.types.ts'

import type {
  CharacterGeneration,
} from '../../character-creation/types/character-generation.types.ts'

import type {
  ClanKey,
} from '../../character-creation/types/clan.types.ts'

import type {
  CharacterInitialVampireGateway,
} from '../infrastructure/character-initial-vampire.api.ts'

import type {
  CharacterInitialVampireTransitionReadModel,
} from '../types/character-transition-read-model.types.ts'

export type InitialVampireAdvantagesReviewPayload =
  Parameters<
    CharacterInitialVampireGateway[
      'reviewAdvantages'
    ]
  >[2]

export function initialVampireAdvantagesDraft(
  transition:
    CharacterInitialVampireTransitionReadModel,
): CharacterAdvantagesDraft {
  return apiAdvantagesToDraft(
    transition.advantages,
  )
}

export function initialVampireAdvantagesReviewPayload(
  advantages:
    CharacterAdvantagesDraft,
): InitialVampireAdvantagesReviewPayload {
  return draftAdvantagesToApi({
    advantages: {
      selections:
        advantages.selections.filter(
          ({ origin }) =>
            origin === 'creation',
        ),
    },
  })
}

export function initialVampireAdvantagesBudgetValid(
  advantages:
    CharacterAdvantagesDraft,
): boolean {
  return validateInitialCharacterAdvantagesBudget(
    advantages,
  ).valid
}

export function initialVampireAdvantagesClanKey(
  transition:
    CharacterInitialVampireTransitionReadModel,
): ClanKey | null {
  const value =
    transition.identity.clanKey

  if (
    value === null ||
    !clanKeys.includes(
      value as ClanKey,
    )
  ) {
    return null
  }

  return value as ClanKey
}

export function initialVampireAdvantagesGeneration(
  transition:
    CharacterInitialVampireTransitionReadModel,
): CharacterGeneration | null {
  const value =
    transition.identity.generation

  if (
    value === null ||
    !generationOptions.includes(
      value as CharacterGeneration,
    )
  ) {
    return null
  }

  return value as CharacterGeneration
}
