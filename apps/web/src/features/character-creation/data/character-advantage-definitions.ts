import type {
  CharacterAdvantageDefinition,
} from '../types/character-advantage-definition.types'

/*
 * El catálogo se mantiene vacío deliberadamente en 003-H.2.
 *
 * Primero estabilizamos el contrato de dominio.
 * Las definiciones oficiales se incorporarán por familias
 * en incrementos posteriores con sus propios tests.
 */
export const characterAdvantageDefinitions:
  readonly CharacterAdvantageDefinition[] = []

export function getCharacterAdvantageDefinition(
  key: string,
): CharacterAdvantageDefinition | null {
  return (
    characterAdvantageDefinitions.find(
      (definition) =>
        definition.key === key,
    ) ?? null
  )
}

export function getCharacterAdvantageDefinitionsByCategory(
  category: CharacterAdvantageDefinition['category'],
): CharacterAdvantageDefinition[] {
  return characterAdvantageDefinitions.filter(
    (definition) =>
      definition.category === category,
  )
}
