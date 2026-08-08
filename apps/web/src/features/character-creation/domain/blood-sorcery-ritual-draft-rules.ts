import {
  BLOOD_SORCERY_RITUAL_DEFINITIONS,
} from '../data/blood-sorcery-ritual-definitions.ts'

import {
  skillKeys,
} from '../data/skill-definitions.ts'

import {
  getDisciplineValue,
} from './discipline-rules.ts'

import {
  resolvePermanentDisciplines,
} from './permanent-discipline-rules.ts'

import {
  normalizeKnownRituals,
} from './blood-sorcery-ritual-rules.ts'

import {
  normalizeCharacterDraftOblivionCeremonies,
} from './oblivion-ceremony-draft-rules.ts'

import {
  normalizeCharacterDraft,
} from './character-draft-normalization.ts'

import {
  resolvePredatorTypeCreationSkills,
} from './predator-type-skill-grant-rules.ts'

import type {
  CharacterDraft,
} from '../types/character-draft.types'

import type {
  CharacterSkillsDraft,
} from '../types/character-skills-draft.types'

import type {
  CharacterBloodSorceryRitualsDraft,
} from '../types/blood-sorcery-ritual.types'

export function normalizeBloodSorceryRitualsForDraft(
  draft: CharacterDraft,
): CharacterBloodSorceryRitualsDraft {
  const permanentDisciplines =
    resolvePermanentDisciplines(
      draft,
    )

  const bloodSorceryLevel =
    getDisciplineValue(
      permanentDisciplines,
      'bloodSorcery',
    )

  if (bloodSorceryLevel <= 0) {
    return {
      ritualKeys: [],
    }
  }

  return {
    ritualKeys:
      normalizeKnownRituals(
        BLOOD_SORCERY_RITUAL_DEFINITIONS,
        draft.bloodSorceryRituals.ritualKeys,
        bloodSorceryLevel,
      ),
  }
}

export function normalizeCharacterDraftRituals(
  draft: CharacterDraft,
): CharacterDraft {
  return {
    ...draft,

    bloodSorceryRituals:
      normalizeBloodSorceryRitualsForDraft(
        draft,
      ),
  }
}

export type CharacterDraftUpdater =
  (
    current: CharacterDraft,
  ) => CharacterDraft

/*
 * Punto único para aplicar cambios al borrador
 * manteniendo sus invariantes dependientes.
 *
 * La UI proporciona únicamente la transformación.
 * Las reglas de consistencia permanecen en dominio.
 */
export interface CharacterDraftUpdateOptions {
  creationSkills?: CharacterSkillsDraft
}

export function applyCharacterDraftUpdate(
  current: CharacterDraft,
  updater: CharacterDraftUpdater,
  options: CharacterDraftUpdateOptions = {},
): CharacterDraft {
  const currentCreationSkills =
    resolvePredatorTypeCreationSkills(
      current,
    )

  const updated =
    updater(current)

  const inferredCreationSkills =
    skillKeys.reduce(
      (skills, key) => {
        skills[key] =
          updated.skills[key] ===
          current.skills[key]
            ? currentCreationSkills[key]
            : updated.skills[key]

        return skills
      },
      {
        ...currentCreationSkills,
      },
    )

  return normalizeCharacterDraft(
    updated,
    options.creationSkills ??
      inferredCreationSkills,
  )
}
