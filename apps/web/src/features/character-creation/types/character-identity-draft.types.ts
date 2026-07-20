import type {
  CharacterIdentity,
} from '../../character-sheet/types/character-sheet.types'

import type {
  ClanKey,
} from './clan.types'

import type {
  CharacterGeneration,
} from './character-generation.types'

export type CharacterIdentityDraft =
  Omit<
    CharacterIdentity,
    'clan' | 'generation'
  > & {
    clan:
      | ClanKey
      | null

    generation:
      | CharacterGeneration
      | null
  }
