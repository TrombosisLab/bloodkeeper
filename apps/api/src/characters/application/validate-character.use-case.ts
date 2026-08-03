import type {
  CharacterDraftRepository,
} from './character-draft.repository'

import type {
  CharacterValidator,
} from '../domain/character-validator'

import type {
  CharacterValidationContext,
  CharacterValidationReport,
} from '../domain/character-validation.types'

export class ValidateCharacterUseCase {
  constructor(
    private readonly repository:
      CharacterDraftRepository,
    private readonly validator: CharacterValidator,
  ) {}

  async execute(
    ownerId: string,
    characterId: string,
    context: CharacterValidationContext,
  ): Promise<CharacterValidationReport | null> {
    const character =
      await this.repository.findById(
        ownerId,
        characterId,
      )

    if (character === null) return null

    return this.validator.validate(
      character,
      context,
    )
  }
}
