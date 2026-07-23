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
      key: 'descendant-of-helena',
      name: 'Descendiente de Helena',
      source: 'core',
      sourcePage: 391,
      requirements: {
        clanKeys: [
          'toreador',
        ],
      },
      benefits: [
        {
          key: 'helena-skin-deep',
          name: 'A Flor de Piel',
          level: 1,
        },
        {
          key: 'helena-true-talent',
          name: 'Talento Real',
          level: 2,
        },
        {
          key: 'helena-embrace-the-stereotype',
          name: 'Abraza el Estereotipo',
          level: 3,
        },
        {
          key: 'helena-divine-purity',
          name: 'Pureza Divina',
          level: 4,
        },
        {
          key: 'helena-succubus-club-franchise',
          name: 'Franquicia del Succubus Club',
          level: 5,
        },
      ],
    },
    {
      key: 'descendant-of-hardestadt',
      name: 'Descendiente de Hardestadt',
      source: 'core',
      sourcePage: 390,
      requirements: {
        clanKeys: [
          'ventrue',
        ],
      },
      benefits: [
        {
          key: 'hardestadt-voice',
          name: 'Voz de Hardestadt',
          level: 1,
        },
        {
          key: 'hardestadt-supreme-leader',
          name: 'Líder Supremo',
          level: 2,
        },
        {
          key: 'hardestadt-ventrue-pillar',
          name: 'Pilar Ventrue',
          level: 3,
        },
        {
          key: 'hardestadt-line-to-the-founders',
          name: 'Línea con los Fundadores',
          level: 4,
        },
        {
          key: 'hardestadt-heir',
          name: 'Heredero de Hardestadt',
          level: 5,
        },
      ],
    },
    {
      key: 'theo-bell',
      name: 'Theo Bell',
      source: 'core',
      sourcePage: 383,
      benefits: [
        {
          key: 'theo-bell-rebels-to-the-cause',
          name: 'Rebeldes a la Causa',
          level: 1,
        },
        {
          key: 'theo-bell-true-anarch',
          name: 'Verdadero Anarquista',
          level: 2,
        },
        {
          key: 'theo-bell-contact-information',
          name: 'Información de Contacto',
          level: 3,
        },
        {
          key: 'theo-bell-bells-circle',
          name: 'Círculo de Bell',
          level: 4,
        },
        {
          key: 'theo-bell-sect-neutrality',
          name: 'Neutralidad de Secta',
          level: 5,
        },
      ],
    },
    {
      key: 'sect-war-veteran',
      name: 'Veterano de la Guerra de Sectas',
      source: 'core',
      sourcePage: 392,
      benefits: [
        {
          key: 'sect-war-veteran-survivor',
          name: 'Superviviente',
          level: 1,
        },
        {
          key: 'sect-war-veteran-active-participant',
          name: 'Participante Activo',
          level: 2,
        },
        {
          key: 'sect-war-veteran-trophy',
          name: 'Trofeo',
          level: 3,
        },
        {
          key: 'sect-war-veteran-no-vampires-land',
          name: 'Tierra de Ningún Vampiro',
          level: 4,
        },
        {
          key: 'sect-war-veteran-sect-agitator',
          name: 'Agitador de Secta',
          level: 5,
        },
      ],
    },
    {
      key: 'the-trinity',
      name: 'La Trinidad',
      source: 'core',
      sourcePage: 393,
      benefits: [
        {
          key: 'the-trinity-constantinople-knowledge',
          name: 'Conocimiento Constantinopla',
          level: 1,
        },
        {
          key: 'the-trinity-antonius-architecture',
          name: 'Arquitectura de Antonius',
          level: 2,
        },
        {
          key: 'the-trinity-the-dream',
          name: 'El Sueño',
          level: 3,
        },
        {
          key: 'the-trinity-the-dracon',
          name: 'El Dracon',
          level: 4,
        },
        {
          key: 'the-trinity-new-trinity',
          name: 'La Nueva Trinidad',
          level: 5,
        },
      ],
    },
    {
      key: 'jeanette-therese-voerman',
      name: 'Jeanette / Therese Voerman',
      source: 'core',
      sourcePage: 394,
      benefits: [
        {
          key: 'voerman-asylum-member',
          name: 'Miembro del Asylum',
          level: 1,
        },
        {
          key: 'voerman-performing-monkey',
          name: 'Mono de feria',
          level: 2,
        },
        {
          key: 'voerman-jeanettes-favorite',
          name: 'El Preferido de Jeanette',
          level: 3,
        },
        {
          key: 'voerman-thereses-favorite',
          name: 'El Preferido de Therese',
          level: 4,
        },
        {
          key: 'voerman-asylum-director',
          name: 'Director de Asylum',
          level: 5,
        },
      ],
    },
    {
      key: 'week-of-nightmares',
      name: 'La Semana de las Pesadillas',
      source: 'core',
      sourcePage: 395,
      benefits: [
        {
          key: 'week-of-nightmares-oral-history',
          name: 'Historia Oral',
          level: 1,
        },
        {
          key: 'week-of-nightmares-ravnos-remnants',
          name: 'Remanentes Ravnos',
          level: 2,
        },
        {
          key: 'week-of-nightmares-i-was-there',
          name: 'Estuve Allí',
          level: 3,
        },
        {
          key: 'week-of-nightmares-red-star',
          name: 'La Estrella Roja',
          level: 4,
        },
        {
          key: 'week-of-nightmares-blood-of-zapathasura',
          name: 'Sangre de Zapathasura',
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
