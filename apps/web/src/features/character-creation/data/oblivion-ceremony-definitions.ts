import {
  characterDisciplineCatalog,
} from '@v5r/character-rules'

import type {
  OblivionCeremonyDefinition,
  OblivionCeremonyKey,
} from '../types/oblivion-ceremony.types'

export const oblivionCeremonyDefinitions:
  OblivionCeremonyDefinition[] =
    JSON.parse(
      JSON.stringify(
        characterDisciplineCatalog
          .oblivionCeremonies,
      ),
    )

export function getOblivionCeremony(
  key: OblivionCeremonyKey,
): OblivionCeremonyDefinition | undefined {
  return oblivionCeremonyDefinitions.find(
    (ceremony) => ceremony.key === key,
  )
}

export function getOblivionCeremoniesByLevel(
  level: number,
): OblivionCeremonyDefinition[] {
  return oblivionCeremonyDefinitions.filter(
    (ceremony) => ceremony.level === level,
  )
}
