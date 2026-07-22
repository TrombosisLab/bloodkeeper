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
    {
      key: 'status',
      name: 'Estatus',
      category: 'background',
      allowedRatings: [
        1,
        2,
        3,
        4,
        5,
      ],
      source: 'core',
      allowMultiple: true,
      requiresInstanceDetails: true,
      instanceDetailsKind: 'status',
    },
    {
      key: 'fame',
      name: 'Fama',
      category: 'background',
      allowedRatings: [
        1,
        2,
        3,
        4,
        5,
      ],
      source: 'core',
      allowMultiple: true,
      requiresInstanceDetails: true,
      instanceDetailsKind: 'fame',
    },
    {
      key: 'influence',
      name: 'Influencia',
      category: 'background',
      allowedRatings: [
        1,
        2,
        3,
        4,
        5,
      ],
      source: 'core',
      allowMultiple: true,
      requiresInstanceDetails: true,
      instanceDetailsKind: 'influence',
    },
    {
      key: 'mask',
      name: 'Máscara',
      category: 'background',
      allowedRatings: [
        1,
        2,
      ],
      source: 'core',
      allowMultiple: true,
      requiresInstanceDetails: true,
      instanceDetailsKind: 'mask',
    },
    {
      key: 'mawla',
      name: 'Mawla',
      category: 'background',
      allowedRatings: [
        1,
        2,
        3,
        4,
        5,
      ],
      source: 'core',
      allowMultiple: true,
      requiresInstanceDetails: true,
      instanceDetailsKind: 'mawla',
    },
    {
      key: 'herd',
      name: 'Rebaño',
      category: 'background',
      allowedRatings: [
        1,
        2,
        3,
        4,
        5,
      ],
      source: 'core',
      allowMultiple: true,
      requiresInstanceDetails: true,
      instanceDetailsKind: 'herd',
    },
    {
      key: 'resources',
      name: 'Recursos',
      category: 'background',
      allowedRatings: [
        1,
        2,
        3,
        4,
        5,
      ],
      source: 'core',
      allowMultiple: true,
      requiresInstanceDetails: true,
      instanceDetailsKind: 'resources',
    },
    {
      key: 'haven',
      name: 'Refugio',
      category: 'background',
      allowedRatings: [
        1,
        2,
        3,
      ],
      source: 'core',
      sourcePage: 192,
      allowMultiple: true,
      requiresInstanceDetails: true,
      instanceDetailsKind: 'haven',
    },
    {
      key: 'haven-hidden-armory',
      name: 'Arsenal Oculto',
      category: 'merit',
      allowedRatings: [1, 2, 3, 4, 5],
      source: 'core',
      allowMultiple: true,
      requiresInstanceDetails: false,
      requiresParentSelection: true,
      allowedParentDefinitionKeys: ['haven'],
    },
    {
      key: 'haven-library',
      name: 'Biblioteca',
      category: 'merit',
      allowedRatings: [1, 2, 3, 4, 5],
      source: 'core',
      allowMultiple: true,
      requiresInstanceDetails: false,
      requiresParentSelection: true,
      allowedParentDefinitionKeys: ['haven'],
      parentRatingConstraints: [
        {
          parentRating: 1,
          allowedRatings: [1],
        },
      ],
    },
    {
      key: 'haven-cell',
      name: 'Celda',
      category: 'merit',
      allowedRatings: [1, 2, 3, 4, 5],
      source: 'core',
      allowMultiple: true,
      requiresInstanceDetails: false,
      requiresParentSelection: true,
      allowedParentDefinitionKeys: ['haven'],
      minimumParentRating: 2,
    },
    {
      key: 'haven-laboratory',
      name: 'Laboratorio',
      category: 'merit',
      allowedRatings: [1, 2, 3, 4, 5],
      source: 'core',
      allowMultiple: true,
      requiresInstanceDetails: false,
      requiresParentSelection: true,
      allowedParentDefinitionKeys: ['haven'],
      minimumParentRating: 2,
    },
    {
      key: 'haven-location',
      name: 'Localización',
      category: 'merit',
      allowedRatings: [1],
      source: 'core',
      allowMultiple: true,
      requiresInstanceDetails: false,
      requiresParentSelection: true,
      allowedParentDefinitionKeys: ['haven'],
    },
    {
      key: 'haven-luxury',
      name: 'Lujo',
      category: 'merit',
      allowedRatings: [1],
      source: 'core',
      allowMultiple: true,
      requiresInstanceDetails: false,
      requiresParentSelection: true,
      allowedParentDefinitionKeys: ['haven'],
    },
    {
      key: 'haven-protection',
      name: 'Protección',
      category: 'merit',
      allowedRatings: [1, 2, 3, 4, 5],
      source: 'core',
      allowMultiple: true,
      requiresInstanceDetails: false,
      requiresParentSelection: true,
      allowedParentDefinitionKeys: ['haven'],
    },
    {
      key: 'haven-backdoor',
      name: 'Puerta Trasera',
      category: 'merit',
      allowedRatings: [1, 2, 3, 4, 5],
      source: 'core',
      allowMultiple: true,
      requiresInstanceDetails: false,
      requiresParentSelection: true,
      allowedParentDefinitionKeys: ['haven'],
    },
    {
      key: 'haven-operating-room',
      name: 'Quirófano',
      category: 'merit',
      allowedRatings: [1],
      source: 'core',
      allowMultiple: true,
      requiresInstanceDetails: false,
      requiresParentSelection: true,
      allowedParentDefinitionKeys: ['haven'],
      minimumParentRating: 2,
    },
    {
      key: 'haven-security-system',
      name: 'Sistema de Seguridad',
      category: 'merit',
      allowedRatings: [1, 2, 3, 4, 5],
      source: 'core',
      allowMultiple: true,
      requiresInstanceDetails: false,
      requiresParentSelection: true,
      allowedParentDefinitionKeys: ['haven'],
    },
    {
      key: 'haven-watchmen',
      name: 'Vigilantes',
      category: 'merit',
      allowedRatings: [1, 2, 3, 4, 5],
      source: 'core',
      allowMultiple: true,
      requiresInstanceDetails: false,
      requiresParentSelection: true,
      allowedParentDefinitionKeys: ['haven'],
    },

    /*
     * Los Defectos de Refugio pueden adquirirse de forma
     * autónoma. Si se vinculan a una selección concreta,
     * ésta debe ser Refugio.
     */
    {
      key: 'haven-compromised',
      name: 'Comprometido',
      category: 'flaw',
      allowedRatings: [2],
      source: 'core',
      allowMultiple: true,
      requiresInstanceDetails: false,
      requiresParentSelection: false,
      allowedParentDefinitionKeys: ['haven'],
    },
    {
      key: 'haven-creepy',
      name: 'Espeluznante',
      category: 'flaw',
      allowedRatings: [1],
      source: 'core',
      allowMultiple: true,
      requiresInstanceDetails: false,
      requiresParentSelection: false,
      allowedParentDefinitionKeys: ['haven'],
    },
    {
      key: 'haven-haunted',
      name: 'Embrujado',
      category: 'flaw',
      allowedRatings: [1, 2, 3, 4, 5],
      source: 'core',
      allowMultiple: true,
      requiresInstanceDetails: false,
      requiresParentSelection: false,
      allowedParentDefinitionKeys: ['haven'],
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
