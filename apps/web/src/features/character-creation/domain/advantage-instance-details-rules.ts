import type {
  CharacterAdvantageDefinition,
} from '../types/character-advantage-definition.types'

import type {
  CharacterAdvantageInstanceDetails,
} from '../types/character-advantages-draft.types'


/*
 * Crea la configuración inicial de una ventaja que necesita
 * datos adicionales propios de la instancia.
 *
 * Cada nuevo instanceDetailsKind debe definir aquí su estado
 * inicial para garantizar que la selección nace con una
 * estructura válida antes de abrir el editor correspondiente.
 */
export function createInitialAdvantageInstanceDetails(
  definition: CharacterAdvantageDefinition,
):
  CharacterAdvantageInstanceDetails | undefined {

  if (
    definition.requiresInstanceDetails !== true
  ) {
    return undefined
  }

  switch (
    definition.instanceDetailsKind
  ) {
    case 'haven':
      return {
        kind: 'haven',
      }

    case 'contact':
      return {
        kind: 'contact',
      }

    case 'retainer':
      return {
        kind: 'retainer',
      }

    case 'allies':
      return {
        kind: 'allies',
        effectiveness: 0,
        reliability: 0,
      }

    case 'status':
      return {
        kind: 'status',
      }

    case 'fame':
      return {
        kind: 'fame',
      }

    case 'influence':
      return {
        kind: 'influence',
      }

    case 'mask':
      return {
        kind: 'mask',
        benefits: [],
      }

    case 'mawla':
      return {
        kind: 'mawla',
      }

    case 'darkSecret':
      return {
        kind: 'darkSecret',
      }

    case 'herd':
      return {
        kind: 'herd',
      }

    case 'resources':
      return {
        kind: 'resources',
      }

    case 'enemy':
      return {
        kind: 'enemy',
      }

    case 'stalker':
      return {
        kind: 'stalker',
      }
    case 'infamy':
      return {
        kind: 'infamy',
      }

    case 'despised':
      return {
        kind: 'despised',
      }

    case 'hatred':
      return {
        kind: 'hatred',
      }

    case 'exiled':
      return {
        kind: 'exiled',
      }

    case 'suspect':
      return {
        kind: 'suspect',
      }

    case 'shunned':
      return {
        kind: 'shunned',
      }

    case 'mortalPretender':
      return {
        kind: 'mortalPretender',
      }

    /*
     * Lingüística necesita conservar la lista
     * de idiomas escogidos por el personaje.
     */
    case 'linguistics':
      return {
        kind: 'linguistics',
        languages: [],
      }

    /*
     * Semblante de Matusalén guarda la identidad
     * de la persona o figura a la que se parece.
     */
    case 'methuselahVisage':
      return {
        kind: 'methuselahVisage',
      }

    /*
     * Cara Famosa guarda la identidad asociada
     * al reconocimiento público del personaje.
     */
    case 'famousFace':
      return {
        kind: 'famousFace',
      }

    /*
     * Niño de la Escena guarda la subcultura
     * o escena social asociada.
     */
    case 'childOfTheScene':
      return {
        kind: 'childOfTheScene',
      }



    case 'substanceUse':
      return {
        kind: 'substanceUse',
        substance: '',
      }

    case 'preyExclusion':
      return {
        kind: 'preyExclusion',
        excludedPrey: '',
      }

    case 'folkloricBane':
      return {
        kind: 'folkloricBane',
        source: '',
      }

    case 'folkloricBlock':
      return {
        kind: 'folkloricBlock',
        taboo: '',
      }

    default:
      return undefined
  }
}
