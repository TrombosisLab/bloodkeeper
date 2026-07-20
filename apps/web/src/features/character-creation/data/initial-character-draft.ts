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
    generation: null,
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

  blood: {
    bloodPotency: 1,
    hunger: 1,
  },

  skills: {
    athletics: 0,
    brawl: 0,
    craft: 0,
    drive: 0,
    firearms: 0,
    larceny: 0,
    melee: 0,
    stealth: 0,
    survival: 0,

    animalKen: 0,
    etiquette: 0,
    insight: 0,
    intimidation: 0,
    leadership: 0,
    performance: 0,
    persuasion: 0,
    streetwise: 0,
    subterfuge: 0,

    academics: 0,
    awareness: 0,
    finance: 0,
    investigation: 0,
    medicine: 0,
    occult: 0,
    politics: 0,
    science: 0,
    technology: 0,
  },

  skillSpecialties: [],

  skillDistributionMethod: 'balanced',
}
