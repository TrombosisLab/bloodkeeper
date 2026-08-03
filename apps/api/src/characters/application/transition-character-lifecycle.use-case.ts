import {
  CharacterLifecycleWriteConflictError,
} from './character-draft.repository'

import type {
  CharacterDraftRepository,
} from './character-draft.repository'

import {
  assertCharacterLifecycleTransition,
} from '../domain/character-lifecycle.rules'

import type {
  CharacterLifecycleStatus,
  PersistedCharacterDraft,
} from '../domain/persisted-character.types'

import type {
  CharacterValidationReport,
} from '../domain/character-validation.types'

import type {
  CharacterValidator,
} from '../domain/character-validator'

export interface TransitionCharacterLifecycleCommand {
  readonly characterId: string
  readonly expectedRevision: number
  readonly nextStatus: CharacterLifecycleStatus
  readonly confirmed: boolean
}

export interface TransitionCharacterLifecycleResult {
  readonly character: PersistedCharacterDraft
  readonly validation:
    CharacterValidationReport | null
}

export class TransitionCharacterLifecycleUseCase {
  constructor(
    private readonly repository:
      CharacterDraftRepository,
    private readonly validator: CharacterValidator,
  ) {}

  async execute(
    ownerId: string,
    command: TransitionCharacterLifecycleCommand,
  ): Promise<TransitionCharacterLifecycleResult | null> {
    const current =
      await this.repository.findById(
        ownerId,
        command.characterId,
      )

    if (current === null) {
      return null
    }

    if (
      current.revision !==
      command.expectedRevision
    ) {
      throw new CharacterLifecycleWriteConflictError(
        command.characterId,
      )
    }

    const validation =
      command.nextStatus === 'active'
        ? this.validator.validate(
            current,
            'activation',
          )
        : null

    assertCharacterLifecycleTransition({
      from: current.status,
      to: command.nextStatus,
      authorized: true,
      confirmed: command.confirmed,
      validation,
    })

    const character =
      await this.repository.transitionLifecycle(
        ownerId,
        {
          characterId: command.characterId,
          expectedRevision:
            command.expectedRevision,
          expectedStatus: current.status,
          nextStatus: command.nextStatus,
        },
      )

    return { character, validation }
  }
}
