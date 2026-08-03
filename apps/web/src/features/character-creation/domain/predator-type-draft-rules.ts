import type {
  CharacterDraft,
} from '../types/character-draft.types.ts'

import {
  getBloodPotencyRange,
} from './blood-rules.ts'

import {
  applyPredatorTypeEffects,
  resolvePredatorTypeBloodPotencyModifier,
  resolvePredatorTypeHumanityModifier,
} from './predator-type-rules.ts'

function normalizePredatorTypeScalarEffects(
  draft: CharacterDraft,
): Pick<CharacterDraft, 'blood' | 'humanity'> {
  const predatorTypeKey =
    draft.identity.predatorType
  const humanityModifier =
    predatorTypeKey === ''
      ? 0
      : resolvePredatorTypeHumanityModifier(
          predatorTypeKey,
          {
            clan: draft.identity.clan,
          },
        )
  let bloodPotency = draft.blood.bloodPotency

  if (
    predatorTypeKey !== '' &&
    draft.identity.generation !== null
  ) {
    const modifier =
      resolvePredatorTypeBloodPotencyModifier(
        predatorTypeKey,
        {
          clan: draft.identity.clan,
        },
      )
    const range = getBloodPotencyRange(
      draft.identity.generation,
    )

    if (modifier > 0) {
      bloodPotency = Math.max(
        bloodPotency,
        range.min + modifier,
      )
    } else if (modifier < 0) {
      bloodPotency = Math.min(
        bloodPotency,
        range.max + modifier,
      )
    }
  }

  return {
    blood: {
      ...draft.blood,
      bloodPotency,
    },
    humanity: {
      ...draft.humanity,
      value: 7 + humanityModifier,
    },
  }
}

/*
 * Adaptador del módulo Predator Type para CharacterDraft.
 *
 * El motor Predator Type continúa trabajando únicamente
 * con sus efectos propios.
 *
 * Este archivo es el único punto del módulo que conoce
 * la estructura completa de CharacterDraft.
 */
export function normalizeCharacterDraftPredatorType(
  draft: CharacterDraft,
): CharacterDraft {
  const effects =
    applyPredatorTypeEffects({
      predatorTypeKey:
        draft.identity.predatorType,

      clanKey:
        draft.identity.clan,

      advantages:
        draft.advantages,

      disciplines:
        draft.disciplines,

      skillSpecialties:
        draft.skillSpecialties,
    })
  const scalarEffects =
    normalizePredatorTypeScalarEffects(draft)

  return {
    ...draft,

    advantages:
      effects.advantages,

    disciplines:
      effects.disciplines,

    skillSpecialties:
      effects.skillSpecialties,

    blood:
      scalarEffects.blood,

    humanity:
      scalarEffects.humanity,
  }
}
