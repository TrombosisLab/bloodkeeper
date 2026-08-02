import type {
  CharacterAdvantageDefinition,
} from '../types/character-advantage-definition.types.ts'

import type {
  CharacterAdvantageCategory,
} from '../types/character-advantages-draft.types.ts'

export function isCharacterAdvantageActive(
  definition:
    CharacterAdvantageDefinition,
): boolean {
  return definition.active !== false
}

export function getActiveCharacterAdvantageDefinitions(
  definitions:
    readonly CharacterAdvantageDefinition[],
  category?:
    CharacterAdvantageCategory,
): CharacterAdvantageDefinition[] {
  return definitions.filter(
    (definition) =>
      isCharacterAdvantageActive(
        definition,
      ) &&
      (
        category === undefined ||
        definition.category === category
      ),
  )
}
