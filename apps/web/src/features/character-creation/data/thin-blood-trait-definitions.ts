import {
  characterDependencyCatalog,
} from '@v5r/character-rules'

import type {
  ThinBloodTraitDefinition,
} from '../types/thin-blood-trait.types.ts'

export const thinBloodTraitDefinitions:
  readonly ThinBloodTraitDefinition[] =
    JSON.parse(
      JSON.stringify(
        characterDependencyCatalog
          .thinBloodTraits,
      ),
    ) as ThinBloodTraitDefinition[]

export function getThinBloodTraitDefinition(
  key: string,
): ThinBloodTraitDefinition | null {
  return (
    thinBloodTraitDefinitions.find(
      (definition) =>
        definition.key === key,
    ) ?? null
  )
}

export function getThinBloodTraitDefinitionsByCategory(
  category:
    ThinBloodTraitDefinition['category'],
): ThinBloodTraitDefinition[] {
  return thinBloodTraitDefinitions.filter(
    (definition) =>
      definition.category === category,
  )
}
