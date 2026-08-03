import {
  characterAdvantageCatalog,
} from '@v5r/character-rules'

import type {
  CharacterAdvantageDefinition,
} from '../types/character-advantage-definition.types'

export const characterAdvantageDefinitions:
  readonly CharacterAdvantageDefinition[] =
    JSON.parse(
      JSON.stringify(
        characterAdvantageCatalog.definitions,
      ),
    ) as CharacterAdvantageDefinition[]

export function getCharacterAdvantageDefinition(
  key: string,
): CharacterAdvantageDefinition | null {
  return (
    characterAdvantageDefinitions.find(
      (definition) => definition.key === key,
    ) ?? null
  )
}

export function getCharacterAdvantageDefinitionsByCategory(
  category: CharacterAdvantageDefinition['category'],
): CharacterAdvantageDefinition[] {
  return characterAdvantageDefinitions.filter(
    (definition) =>
      definition.category === category &&
      definition.active !== false,
  )
}
