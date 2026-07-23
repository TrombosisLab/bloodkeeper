import type {
  CharacterLoresheetDefinition,
} from '../types/character-loresheet-definition.types'

/*
 * Catálogo de Fichas de Conocimientos del Libro Básico.
 *
 * Deliberadamente vacío en este checkpoint:
 * primero consolidamos la infraestructura y la separación
 * de fuentes antes de introducir contenido concreto.
 *
 * No deben mezclarse aquí:
 * - Fichas de suplementos
 * - Líneas de Sangre
 * - contenido de otras fuentes
 */
export const characterCoreLoresheetDefinitions:
  readonly CharacterLoresheetDefinition[] = []

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
