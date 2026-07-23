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
  readonly CharacterLoresheetDefinition[] = [
    {
      key: 'golconda',
      name: 'Golconda',
      source: 'core',
      sourcePage: 389,
      benefits: [
        {
          key: 'golconda-seeds',
          name: 'Semillas de Golconda',
          level: 1,
        },
        {
          key: 'one-true-way',
          name: 'El Único Camino Verdadero',
          level: 2,
        },
        {
          key: 'saulot-disciple',
          name: 'Discípulo de Saulot',
          level: 3,
        },
        {
          key: 'satisfy-the-hunger',
          name: 'Satisfacer el Ansia',
          level: 4,
        },
        {
          key: 'greet-the-sun',
          name: 'Recibir al Sol',
          level: 5,
        },
      ],
    },
  ]

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
