import {
  characterDisciplineCatalog,
} from '@v5r/character-rules'

import type {
  DisciplinePowerDefinition,
} from '../types/discipline-power.types'

export const disciplinePowerDefinitions:
  DisciplinePowerDefinition[] =
    JSON.parse(
      JSON.stringify(
        characterDisciplineCatalog.powers,
      ),
    )
