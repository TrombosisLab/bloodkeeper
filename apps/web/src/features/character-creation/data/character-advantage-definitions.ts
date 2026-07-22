import type {
  CharacterAdvantageDefinition,
} from '../types/character-advantage-definition.types'

/*
 * Catálogo de Ventajas de creación.
 *
 * Se incorpora de forma incremental por familias para poder
 * validar cada conjunto de reglas antes de ampliar el catálogo.
 *
 * 003-H.3B.1:
 * - Aliados
 * - Contactos
 * - Criados
 */
export const characterAdvantageDefinitions:
  readonly CharacterAdvantageDefinition[] = [
    {
      key: 'allies',
      name: 'Aliados',
      category: 'background',
      allowedRatings: [
        2,
        3,
        4,
        5,
        6,
      ],
      source: 'core',
      allowMultiple: true,
      requiresInstanceDetails: true,
      instanceDetailsKind: 'allies',
    },
    {
      key: 'contacts',
      name: 'Contactos',
      category: 'background',
      allowedRatings: [
        1,
        2,
        3,
      ],
      source: 'core',
      allowMultiple: true,
      requiresInstanceDetails: true,
      instanceDetailsKind: 'contact',
    },
    {
      key: 'retainers',
      name: 'Criados',
      category: 'background',
      allowedRatings: [
        1,
        2,
        3,
      ],
      source: 'core',
      allowMultiple: true,
      requiresInstanceDetails: true,
      instanceDetailsKind: 'retainer',
    },
  ]

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
