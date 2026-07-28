import type {
  CharacterAdvantageDefinition,
} from '../types/character-advantage-definition.types'

import type {
  CharacterAdvantageInstanceDetails,
} from '../types/character-advantages-draft.types'


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

    case 'herd':
      return {
        kind: 'herd',
      }

    case 'resources':
      return {
        kind: 'resources',
      }

    default:
      return undefined
  }
}
