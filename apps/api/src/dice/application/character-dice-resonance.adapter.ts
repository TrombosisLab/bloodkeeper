import type {
  CharacterDisciplineKey,
  PersistedCharacterBloodResonance,
  PersistedCharacterDraft,
} from '../../characters/domain/persisted-character.types'

import {
  CharacterDiceStateError,
} from './character-dice-hunger.adapter'

interface CharacterDraftReader {
  execute(
    ownerId: string,
    characterId: string,
  ): Promise<PersistedCharacterDraft | null>
}

export interface CharacterDiceResonanceSnapshot {
  readonly disciplineKeys:
    readonly CharacterDisciplineKey[]
  readonly resonance:
    PersistedCharacterBloodResonance | null
}

export class CharacterDiceResonanceAdapter {
  constructor(
    private readonly characters:
      CharacterDraftReader,
  ) {}

  async execute(
    ownerId: string,
    characterId: string,
  ): Promise<
    CharacterDiceResonanceSnapshot | null
  > {
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
          'Human characters cannot expose Blood or Resonance to dice',
        )
      }

      return Object.freeze({
        disciplineKeys: Object.freeze([]),
        resonance: null,
      })
    }

    if (character.blood === null) {
      throw new CharacterDiceStateError(
        'Vampire characters require Blood state for Resonance dice',
      )
    }

    const disciplineKeys = Object.freeze([
      ...new Set(
        character.disciplines
          .filter(({ rating }) => rating > 0)
          .map(({ disciplineKey }) =>
            disciplineKey),
      ),
    ])

    return Object.freeze({
      disciplineKeys,
      resonance:
        character.blood.hunger === 5
          ? null
          : character.blood.resonance ??
            null,
    })
  }
}
