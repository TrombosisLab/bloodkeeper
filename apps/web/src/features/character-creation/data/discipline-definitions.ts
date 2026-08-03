import {
  characterDisciplineCatalog,
} from '@v5r/character-rules'

import type {
  DisciplineDefinition,
  DisciplineKey,
} from '../types/discipline.types.ts'

export const disciplineDefinitions:
  DisciplineDefinition[] =
    characterDisciplineCatalog.disciplines.map(
      (definition) => ({ ...definition }),
    )

export const disciplineKeys:
  DisciplineKey[] =
    disciplineDefinitions.map(
      (discipline) => discipline.key,
    )
