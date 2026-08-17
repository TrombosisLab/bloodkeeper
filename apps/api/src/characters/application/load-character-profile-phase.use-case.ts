import type {
  CharacterDraftRepository,
} from './character-draft.repository'

import {
  deriveCharacterProfilePhase,
} from '../domain/character-transition.rules'

import type {
  CharacterProfilePhase,
} from '../domain/character-transition.rules'

import type {
  CharacterValidator,
} from '../domain/character-validator'

export class CharacterProfilePhaseUnavailableError
  extends Error {
  constructor(characterId: string) {
    super(
      `Character profile phase is unavailable for ${characterId}`,
    )
    this.name =
      'CharacterProfilePhaseUnavailableError'
  }
}

export class LoadCharacterProfilePhaseUseCase {
  constructor(
    private readonly repository:
      CharacterDraftRepository,
    private readonly validator:
      CharacterValidator,
  ) {}

  async execute(
    ownerId: string,
    characterId: string,
  ): Promise<CharacterProfilePhase | null> {
    const character =
      await this.repository.findById(
        ownerId,
        characterId,
      )

    if (character === null) {
      return null
    }

    if (character.nature === 'human') {
      return deriveCharacterProfilePhase(
        character,
        false,
      )
    }

    const validation =
      this.validator.validate(
        character,
        'activation',
      )

    if (
      character.creation.creationMode ===
        'standard' &&
      !validation.valid
    ) {
      throw new CharacterProfilePhaseUnavailableError(
        characterId,
      )
    }

    return deriveCharacterProfilePhase(
      character,
      validation.valid,
    )
  }
}
