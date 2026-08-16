import {
  requireCharacterBlood,
} from './character-vampire-state.rules'

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
  const blood =
    requireCharacterBlood(draft)

  assertValidCharacterHunger(
    blood.hunger,
  )

  return Object.freeze({
    characterId: draft.characterId,
    revision: draft.revision,
    hunger: blood.hunger,
  })
}
