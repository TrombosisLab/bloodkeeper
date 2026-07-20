import type {
  CharacterDraft,
} from '../types/character-draft.types'

export const initialCharacterDraft: CharacterDraft = {
  identity: {
    name: '',
    concept: '',
    predatorType: '',
    chronicle: '',
    ambition: '',
    clan: '',
    sire: '',
    desire: '',
    generation: '',
  },

  attributes: {
    strength: 1,
    dexterity: 1,
    stamina: 1,

    charisma: 1,
    manipulation: 1,
    composure: 1,

    intelligence: 1,
    wits: 1,
    resolve: 1,
  },
}
