import {
  assertValidCharacterHunger,
} from '../../characters/domain/character-hunger.rules'

import type {
  PersistedCharacterDraft,
} from '../../characters/domain/persisted-character.types'

interface CharacterDraftReader {
  execute(
    ownerId: string,
    characterId: string,
  ): Promise<PersistedCharacterDraft | null>
}

export interface CharacterDiceHungerSnapshot {
  readonly hunger: number
}

export class CharacterDiceStateError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CharacterDiceStateError'
  }
}

export class CharacterDiceHungerAdapter {
  constructor(
    private readonly characters:
      CharacterDraftReader,
  ) {}

  async execute(
    ownerId: string,
    characterId: string,
  ): Promise<CharacterDiceHungerSnapshot | null> {
    const character =
      await this.characters.execute(
        ownerId,
        characterId,
      )

    if (character === null) {
      return null
    }

    if (character.nature === 'human') {
      if (character.blood !== null) {
        throw new CharacterDiceStateError(
          'Human characters cannot expose Blood or Hunger to dice',
        )
      }

      return Object.freeze({
        hunger: 0,
      })
    }

    if (character.blood === null) {
      throw new CharacterDiceStateError(
        'Vampire characters require Blood state for dice',
      )
    }

    assertValidCharacterHunger(
      character.blood.hunger,
    )

    return Object.freeze({
      hunger: character.blood.hunger,
    })
  }
}
