import {
  characterDisciplineCatalog,
} from '@v5r/character-rules'

import type {
  BloodSorceryRitualDefinition,
} from '../types/blood-sorcery-ritual.types'

export const BLOOD_SORCERY_RITUAL_DEFINITIONS:
  BloodSorceryRitualDefinition[] =
    JSON.parse(
      JSON.stringify(
        characterDisciplineCatalog
          .bloodSorceryRituals,
      ),
    )

export function getBloodSorceryRitualDefinition(
  ritualKey: string,
): BloodSorceryRitualDefinition | undefined {
  return BLOOD_SORCERY_RITUAL_DEFINITIONS.find(
    (definition) =>
      definition.key === ritualKey,
  )
}

export function getBloodSorceryRitualDefinitionsByLevel(
  level: number,
): BloodSorceryRitualDefinition[] {
  return BLOOD_SORCERY_RITUAL_DEFINITIONS.filter(
    (definition) =>
      definition.level === level,
  )
}
