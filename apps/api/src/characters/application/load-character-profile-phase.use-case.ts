import type {
  CharacterDraftRepository,
} from './character-draft.repository'

import {
  deriveCharacterProfilePhase,
} from '../domain/character-transition.rules'

import {
  deriveCharacterEmbracePendingDecisions,
} from '../domain/character-embrace.types'

import type {
  CharacterEmbracePendingDecision,
} from '../domain/character-embrace.types'

import type {
  CharacterProfilePhase,
} from '../domain/character-transition.rules'

import type {
  CharacterValidator,
} from '../domain/character-validator'

import type {
  PersistedCharacterDraft,
} from '../domain/persisted-character.types'

export interface CharacterProfilePhaseReadSnapshot {
  readonly phase: CharacterProfilePhase
  readonly pendingDecisions:
    readonly CharacterEmbracePendingDecision[]
}

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

  private async resolvePhase(
    ownerId: string,
    characterId: string,
  ): Promise<{
    readonly character: PersistedCharacterDraft
    readonly phase: CharacterProfilePhase
  } | null> {
    const character =
      await this.repository.findById(
        ownerId,
        characterId,
      )

    if (character === null) {
      return null
    }

    if (character.nature === 'human') {
      return {
        character,
        phase:
          deriveCharacterProfilePhase(
            character,
            false,
          ),
      }
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

    return {
      character,
      phase:
        deriveCharacterProfilePhase(
          character,
          validation.valid,
        ),
    }
  }

  async read(
    ownerId: string,
    characterId: string,
  ): Promise<CharacterProfilePhaseReadSnapshot | null> {
    const resolved =
      await this.resolvePhase(
        ownerId,
        characterId,
      )

    if (resolved === null) {
      return null
    }

    return {
      phase: resolved.phase,
      pendingDecisions:
        resolved.phase ===
          'TRANSITIONAL_VAMPIRE'
          ? deriveCharacterEmbracePendingDecisions(
              resolved.character,
            )
          : [],
    }
  }

  async execute(
    ownerId: string,
    characterId: string,
  ): Promise<CharacterProfilePhase | null> {
    const resolved =
      await this.resolvePhase(
        ownerId,
        characterId,
      )

    return resolved?.phase ?? null
  }
}
