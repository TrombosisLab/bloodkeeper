import type {
  CharacterAdvantageDefinition,
} from '../types/character-advantage-definition.types'

import type {
  CharacterAdvantagesDraft,
} from '../types/character-advantages-draft.types'

export function canShowAdvantageDefinition(
  definition: CharacterAdvantageDefinition,
  draft: CharacterAdvantagesDraft,
): boolean {
  if (
    definition.requiresParentSelection !== true
  ) {
    return true
  }

  return draft.selections.some(
    (selection) =>
      definition.allowedParentDefinitionKeys?.includes(
        selection.definitionKey,
      ),
  )
}
