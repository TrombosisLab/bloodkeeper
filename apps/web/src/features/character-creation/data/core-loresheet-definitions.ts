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
      key: 'cainite-heresy',
      name: 'Herejía Cainita',
      source: 'core',
      sourcePage: 384,
      benefits: [
        {
          key: 'cainite-heresy-understanding',
          name: 'El que Tenga Entendimiento',
          level: 1,
        },
        {
          key: 'cainite-heresy-hand',
          name: 'Mano de la Herejía',
          level: 2,
        },
        {
          key: 'cainite-heresy-counter-inquisition',
          name: 'Contra-Inquisición',
          level: 3,
        },
        {
          key: 'cainite-heresy-red-celebrant',
          name: 'Celebrante Rojo',
          level: 4,
        },
        {
          key: 'cainite-heresy-mentioned-in-prophecy',
          name: 'El Mencionado en la Profecía',
          level: 5,
        },
      ],
    },
    {
      key: 'carna',
      name: 'Carna',
      source: 'core',
      sourcePage: 385,
      benefits: [
        {
          key: 'carna-embrace-the-vision',
          name: 'Abrazar la Visión',
          level: 1,
        },
        {
          key: 'carna-rebel-trail',
          name: 'El Rastro Rebelde',
          level: 2,
        },
        {
          key: 'carna-unorthodox-rituals',
          name: 'Rituales Poco Ortodoxos',
          level: 3,
        },
        {
          key: 'carna-bond-reimagined',
          name: 'Vínculo Reimaginado',
          level: 4,
        },
        {
          key: 'carna-book-of-the-grave-war',
          name: 'Libro de la Guerra de las Tumbas',
          level: 5,
        },
      ],
    },
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
