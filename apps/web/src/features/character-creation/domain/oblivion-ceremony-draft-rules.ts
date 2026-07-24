import {
  oblivionCeremonyDefinitions,
} from '../data/oblivion-ceremony-definitions.ts'

import {
  getDisciplineValue,
} from './discipline-rules.ts'

import {
  resolvePermanentDisciplines,
} from './permanent-discipline-rules.ts'

import {
  normalizeKnownOblivionCeremonies,
} from './oblivion-ceremony-rules.ts'

import type {
  CharacterDraft,
} from '../types/character-draft.types.ts'

import type {
  CharacterOblivionCeremoniesDraft,
} from '../types/oblivion-ceremony.types.ts'

export function getSelectedOblivionPowerKeys(
  draft: CharacterDraft,
): string[] {
  const permanentDisciplines =
    resolvePermanentDisciplines(
      draft,
    )

  return (
    permanentDisciplines.find(
      (discipline) =>
        discipline.key ===
        'oblivion',
    )?.powerKeys ?? []
  )
}

export function normalizeOblivionCeremoniesForDraft(
  draft: CharacterDraft,
): CharacterOblivionCeremoniesDraft {
  const permanentDisciplines =
    resolvePermanentDisciplines(
      draft,
    )

  const oblivionLevel =
    getDisciplineValue(
      permanentDisciplines,
      'oblivion',
    )

  if (oblivionLevel <= 0) {
    return {
      ceremonyKeys: [],
    }
  }

  const learnedPowerKeys =
    getSelectedOblivionPowerKeys(
      draft,
    )

  return {
    ceremonyKeys:
      normalizeKnownOblivionCeremonies(
        oblivionCeremonyDefinitions,
        draft.oblivionCeremonies
          .ceremonyKeys,
        oblivionLevel,
        learnedPowerKeys,
      ),
  }
}

export function normalizeCharacterDraftOblivionCeremonies(
  draft: CharacterDraft,
): CharacterDraft {
  return {
    ...draft,

    oblivionCeremonies:
      normalizeOblivionCeremoniesForDraft(
        draft,
      ),
  }
}
