import type {
  CharacterIdentity,
} from '../../character-sheet/types/character-sheet.types'

import type {
  CharacterAttributesDraft,
} from './character-attributes-draft.types'

export interface CharacterDraft {
  identity: CharacterIdentity
  attributes: CharacterAttributesDraft
}
