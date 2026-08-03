import {
  characterDependencyCatalog,
} from '@v5r/character-rules'

import type {
  PredatorTypeDefinition,
} from '../types/predator-type.types.ts'

export const predatorTypeDefinitions:
  PredatorTypeDefinition[] =
    JSON.parse(
      JSON.stringify(
        characterDependencyCatalog.predatorTypes,
      ),
    ) as PredatorTypeDefinition[]
