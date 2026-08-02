import {
  characterAdvantageDefinitions,
} from '../../character-creation/data/character-advantage-definitions'
import type {
  CharacterAdvantageSelectionDraft,
} from '../../character-creation/types/character-advantages-draft.types'
import {
  buildCharacterAdvantageReadModel,
} from '../domain/character-advantage-read-model'

/*
 * Estado temporal de demostración.
 *
 * Contiene únicamente selecciones de personaje. Los nombres,
 * categorías y demás metadatos visibles se resuelven desde el
 * catálogo canónico mediante el mismo modelo de lectura que usará
 * el personaje persistido.
 */
export const demoAdvantageSelections:
  CharacterAdvantageSelectionDraft[] = [
    {
      selectionId: 'beautiful-1',
      definitionKey: 'beautiful',
      category: 'merit',
      rating: 2,
      origin: 'creation',
    },
    {
      selectionId: 'linguistics-1',
      definitionKey: 'linguistics',
      category: 'merit',
      rating: 1,
      origin: 'creation',
      details: {
        kind: 'linguistics',
        languages: ['Inglés'],
      },
    },
    {
      selectionId: 'contacts-1',
      definitionKey: 'contacts',
      category: 'background',
      rating: 2,
      origin: 'creation',
      details: {
        kind: 'contact',
        identity: 'Política local',
      },
    },
    {
      selectionId: 'resources-1',
      definitionKey: 'resources',
      category: 'background',
      rating: 2,
      origin: 'creation',
      details: {
        kind: 'resources',
        source: 'Actividad profesional',
      },
    },
    {
      selectionId: 'status-1',
      definitionKey: 'status',
      category: 'background',
      rating: 1,
      origin: 'creation',
      details: {
        kind: 'status',
        sphere: 'Camarilla',
      },
    },
    {
      selectionId: 'enemy-1',
      definitionKey: 'enemy',
      category: 'flaw',
      rating: 1,
      origin: 'creation',
      details: {
        kind: 'enemy',
        identity: 'Rival político',
      },
    },
    {
      selectionId: 'prey-exclusion-1',
      definitionKey: 'prey-exclusion',
      category: 'flaw',
      rating: 1,
      origin: 'creation',
      details: {
        kind: 'preyExclusion',
        excludedPrey: 'Autoridades',
      },
    },
  ]

export const demoAdvantages =
  buildCharacterAdvantageReadModel(
    demoAdvantageSelections,
    characterAdvantageDefinitions,
  )
