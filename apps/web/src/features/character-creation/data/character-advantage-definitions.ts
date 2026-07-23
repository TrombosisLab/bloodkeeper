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
    /*
     * 003-H.3B.6A.1:
     * Méritos y Defectos Core — Lingüística y Aspecto.
     * Libro Básico, pág. 179.
     */
    {
      key: 'linguistics',
      name: 'Lingüística',
      category: 'merit',
      allowedRatings: [1, 2, 3, 4, 5],
      source: 'core',
      sourcePage: 179,
      allowMultiple: false,
      requiresInstanceDetails: false,
    },
    {
      key: 'illiterate',
      name: 'Analfabeto',
      category: 'flaw',
      allowedRatings: [2],
      source: 'core',
      sourcePage: 179,
      allowMultiple: false,
      requiresInstanceDetails: false,
    },
    {
      key: 'ugly',
      name: 'Feo',
      category: 'flaw',
      allowedRatings: [1],
      source: 'core',
      sourcePage: 179,
      allowMultiple: false,
      requiresInstanceDetails: false,
    },
    {
      key: 'repulsive',
      name: 'Repulsivo',
      category: 'flaw',
      allowedRatings: [2],
      source: 'core',
      sourcePage: 179,
      allowMultiple: false,
      requiresInstanceDetails: false,
    },
    {
      key: 'beautiful',
      name: 'Bello',
      category: 'merit',
      allowedRatings: [2],
      source: 'core',
      sourcePage: 179,
      allowMultiple: false,
      requiresInstanceDetails: false,
    },
    {
      key: 'stunning',
      name: 'Despampanante',
      category: 'merit',
      allowedRatings: [4],
      source: 'core',
      sourcePage: 179,
      allowMultiple: false,
      requiresInstanceDetails: false,
    },
    /*
     * 003-H.3B.6A.2:
     * Méritos y Defectos Core — Consumo de Sustancias.
     */
    {
      key: 'hopeless-addiction',
      name: 'Caso Perdido de Adicción',
      category: 'flaw',
      allowedRatings: [2],
      source: 'core',
      sourcePage: 179,
      allowMultiple: false,
      requiresInstanceDetails: true,
      instanceDetailsKind: 'substanceUse',
    },
    {
      key: 'addiction',
      name: 'Adicción',
      category: 'flaw',
      allowedRatings: [1],
      source: 'core',
      sourcePage: 179,
      allowMultiple: false,
      requiresInstanceDetails: true,
      instanceDetailsKind: 'substanceUse',
    },
    {
      key: 'functional-addict',
      name: 'Adicto Funcional',
      category: 'merit',
      allowedRatings: [1],
      source: 'core',
      sourcePage: 179,
      allowMultiple: false,
      requiresInstanceDetails: true,
      instanceDetailsKind: 'substanceUse',
    },
    /*
     * 003-H.3B.6A.3B:
     * Defectos Core — Arcaico.
     * Sólo disponibles para Ancillae o mayores.
     */
    {
      key: 'archaic',
      name: 'Arcaico',
      category: 'flaw',
      allowedRatings: [2],
      source: 'core',
      sourcePage: 180,
      allowMultiple: false,
      requiresInstanceDetails: false,
      requirements: {
        minimumAgeCategory: 'ancilla',
      },
    },
    {
      key: 'living-in-the-past',
      name: 'Vivir en el Pasado',
      category: 'flaw',
      allowedRatings: [1],
      source: 'core',
      sourcePage: 180,
      allowMultiple: false,
      requiresInstanceDetails: false,
      requirements: {
        minimumAgeCategory: 'ancilla',
      },
    },
    /*
     * 003-H.3B.6A.4A:
     * Defectos Core — Vínculo.
     */
    {
      key: 'bondslave',
      name: 'Esclavo Vinculado',
      category: 'flaw',
      allowedRatings: [2],
      source: 'core',
      sourcePage: 180,
      allowMultiple: false,
      requiresInstanceDetails: false,
    },
    {
      key: 'bond-junkie',
      name: 'Yonqui del Vínculo',
      category: 'flaw',
      allowedRatings: [1],
      source: 'core',
      sourcePage: 180,
      allowMultiple: false,
      requiresInstanceDetails: false,
    },
    {
      key: 'long-bond',
      name: 'Vínculo Largo',
      category: 'flaw',
      allowedRatings: [1],
      source: 'core',
      sourcePage: 181,
      allowMultiple: false,
      requiresInstanceDetails: false,
    },
    /*
     * 003-H.3B.6A.4B:
     * Méritos Core — Vínculo.
     */
    {
      key: 'bond-resistance',
      name: 'Resistencia al Vínculo',
      category: 'merit',
      allowedRatings: [1, 2, 3],
      source: 'core',
      sourcePage: 181,
      allowMultiple: false,
      requiresInstanceDetails: false,
    },
    {
      key: 'short-bond',
      name: 'Vínculo Breve',
      category: 'merit',
      allowedRatings: [2],
      source: 'core',
      sourcePage: 181,
      allowMultiple: false,
      requiresInstanceDetails: false,
    },
    {
      key: 'unbondable',
      name: 'Invinculable',
      category: 'merit',
      allowedRatings: [5],
      source: 'core',
      sourcePage: 181,
      allowMultiple: false,
      requiresInstanceDetails: false,
    },
    /*
     * 003-H.3B.6A.5A:
     * Defectos Core de Alimentación de puntuación fija.
     */
    {
      key: 'vegan',
      name: 'Vegano',
      category: 'flaw',
      allowedRatings: [2],
      source: 'core',
      sourcePage: 181,
      allowMultiple: false,
      requiresInstanceDetails: false,
      requirements: {
        excludedClanKeys: ['ventrue'],
      },
    },
    {
      key: 'organovore',
      name: 'Organóvoro',
      category: 'flaw',
      allowedRatings: [2],
      source: 'core',
      sourcePage: 181,
      allowMultiple: false,
      requiresInstanceDetails: false,
    },
    {
      key: 'methuselah-thirst',
      name: 'Sed de Matusalén',
      category: 'flaw',
      allowedRatings: [1],
      source: 'core',
      sourcePage: 181,
      allowMultiple: false,
      requiresInstanceDetails: false,
    },
    /*
     * 003-H.3B.6A.5B.2:
     * Defecto Core — Exclusión de Presa.
     *
     * La adquisición ordinaria cuesta 1 punto.
     * Determinados Tipos de Depredador pueden conceder
     * una variante de 2 puntos.
     */
    {
      key: 'prey-exclusion',
      name: 'Exclusión de Presa',
      category: 'flaw',
      allowedRatings: [1],
      originRatingConstraints: [
        {
          origin: 'predatorType',
          allowedRatings: [1, 2],
        },
      ],
      source: 'core',
      sourcePage: 181,
      allowMultiple: true,
      requiresInstanceDetails: true,
      instanceDetailsKind: 'preyExclusion',
    },
    /*
     * 003-H.3B.6A.6A:
     * Defectos Míticos Core I.
     */
    {
      key: 'stake-bait',
      name: 'Carne de Estaca',
      category: 'flaw',
      allowedRatings: [2],
      source: 'core',
      sourcePage: 182,
      allowMultiple: false,
      requiresInstanceDetails: false,
    },
    {
      key: 'folkloric-bane',
      name: 'Daño Folclórico',
      category: 'flaw',
      allowedRatings: [1],
      source: 'core',
      sourcePage: 182,
      allowMultiple: true,
      requiresInstanceDetails: true,
      instanceDetailsKind: 'folkloricBane',
    },
    {
      key: 'folkloric-block',
      name: 'Tabú Folclórico',
      category: 'flaw',
      allowedRatings: [1],
      source: 'core',
      sourcePage: 182,
      allowMultiple: true,
      requiresInstanceDetails: true,
      instanceDetailsKind: 'folkloricBlock',
    },
    /*
     * 003-H.3B.6A.6B:
     * Méritos y Defectos Míticos Core II.
     */
    {
      key: 'cross-repulsion',
      name: 'Repulsión de Cruces',
      category: 'flaw',
      allowedRatings: [2],
      source: 'core',
      sourcePage: 182,
      allowMultiple: false,
      requiresInstanceDetails: false,
    },
    {
      key: 'no-reflection',
      name: 'Sin Reflejo',
      category: 'flaw',
      allowedRatings: [1],
      source: 'core',
      sourcePage: 182,
      allowMultiple: false,
      requiresInstanceDetails: false,
    },
    {
      key: 'eat-food',
      name: 'Comer Comida',
      category: 'merit',
      allowedRatings: [2],
      source: 'core',
      sourcePage: 182,
      allowMultiple: false,
      requiresInstanceDetails: false,
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
