import type {
  CharacterIdentity,
} from '../../character-sheet/types/character-sheet.types'

import type {
  CharacterGeneration,
} from './character-generation.types'

export type CharacterIdentityDraft =
  Omit<
    CharacterIdentity,
    'generation'
  > & {
    generation:
      | CharacterGeneration
      | null
  }
