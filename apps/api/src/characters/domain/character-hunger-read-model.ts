import type {
  PersistedCharacterDraft,
} from './persisted-character.types'

import {
  assertValidCharacterHunger,
} from './character-hunger.rules'

export interface CharacterHungerReadModel {
  readonly characterId: string
  readonly revision: number
  readonly hunger: number
}

export function toCharacterHungerReadModel(
  draft: Pick<
    PersistedCharacterDraft,
    'characterId' | 'revision' | 'blood'
  >,
): CharacterHungerReadModel {
  assertValidCharacterHunger(
    draft.blood.hunger,
  )

  return Object.freeze({
    characterId: draft.characterId,
    revision: draft.revision,
    hunger: draft.blood.hunger,
  })
}
