import type {
  CharacterDraftApiBloodDyscrasia,
  CharacterDraftApiBloodResonance,
} from '../../character-creation/types/character-draft-api.types.ts'

export interface CharacterBloodExperience {
  resonance:
    CharacterDraftApiBloodResonance | null
  dyscrasia:
    CharacterDraftApiBloodDyscrasia | null
}
