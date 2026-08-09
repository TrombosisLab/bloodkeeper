import {
  characterAdvantageCatalog,
} from '@v5r/character-rules'

import type {
  CharacterLoresheetDefinition,
} from '../types/character-loresheet-definition.types'

/*
 * Fachada Web del catálogo canónico compartido.
 *
 * Las definiciones Core viven en @v5r/character-rules.
 * La Web recibe una copia para conservar el desacoplamiento
 * entre la fuente normativa y sus consumidores.
 */
export const characterCoreLoresheetDefinitions:
  readonly CharacterLoresheetDefinition[] =
    JSON.parse(
      JSON.stringify(
        characterAdvantageCatalog.loresheets,
      ),
    ) as CharacterLoresheetDefinition[]

export function getCharacterCoreLoresheetDefinition(
  key: string,
): CharacterLoresheetDefinition | null {
  return (
    characterCoreLoresheetDefinitions.find(
      (definition) =>
        definition.key === key,
    ) ?? null
  )
}
