import type {
  CharacterDraft,
} from '../types/character-draft.types.ts'

import {
  applyPredatorTypeEffects,
} from './predator-type-rules.ts'

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

  return {
    ...draft,

    advantages:
      effects.advantages,

    disciplines:
      effects.disciplines,

    skillSpecialties:
      effects.skillSpecialties,
  }
}
