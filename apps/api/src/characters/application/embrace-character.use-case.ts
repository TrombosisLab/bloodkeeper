import { randomUUID } from 'node:crypto'

import type {
  ChronicleParticipantRepository,
} from '../../chronicles/application/chronicle-participant.repository'

import {
  CharacterEmbraceWriteConflictError,
} from './character-draft.repository'

import type {
  CharacterDraftRepository,
} from './character-draft.repository'

import {
  deriveCharacterEmbracePendingDecisions,
} from '../domain/character-embrace.types'

import type {
  EmbraceCharacterResult,
} from '../domain/character-embrace.types'

import type {
  CharacterValidationReport,
} from '../domain/character-validation.types'

import type {
  CharacterValidator,
} from '../domain/character-validator'

export interface EmbraceCharacterCommand {
  readonly characterId: string
  readonly expectedRevision: number
}

export class CharacterEmbraceNotFoundError
  extends Error {
  constructor(characterId: string) {
    super(`Character not found: ${characterId}`)
    this.name = 'CharacterEmbraceNotFoundError'
  }
}

export class CharacterEmbracePermissionError
  extends Error {
  constructor() {
    super(
      'Character owner or active contextual Narrator permission is required',
    )
    this.name = 'CharacterEmbracePermissionError'
  }
}

export class CharacterEmbraceArchivedError
  extends Error {
  constructor(characterId: string) {
    super(
      `Archived character cannot be embraced: ${characterId}`,
    )
    this.name = 'CharacterEmbraceArchivedError'
  }
}

export class CharacterAlreadyEmbracedError
  extends Error {
  constructor(characterId: string) {
    super(
      `Character is already embraced: ${characterId}`,
    )
    this.name = 'CharacterAlreadyEmbracedError'
  }
}

export class CharacterEmbraceCreationModeError
  extends Error {
  constructor(characterId: string) {
    super(
      `Character is not a Session Zero character: ${characterId}`,
    )
    this.name = 'CharacterEmbraceCreationModeError'
  }
}

export class CharacterEmbraceHumanProfileIncompleteError
  extends Error {
  constructor(
    readonly validation:
      CharacterValidationReport,
  ) {
    super(
      'Human character profile is not coherent enough for Embrace',
    )
    this.name =
      'CharacterEmbraceHumanProfileIncompleteError'
  }
}

export class EmbraceCharacterUseCase {
  constructor(
    private readonly characters:
      CharacterDraftRepository,
    private readonly participants:
      ChronicleParticipantRepository,
    private readonly validator:
      CharacterValidator,
  ) {}

  private async assertPermission(
    actorUserId: string,
    character: {
      readonly ownerId: string
      readonly chronicleId: string | null
    },
  ): Promise<void> {
    if (character.chronicleId === null) {
      if (character.ownerId !== actorUserId) {
        throw new CharacterEmbracePermissionError()
      }

      return
    }

    const membership =
      await this.participants
        .findActiveMembership(
          character.chronicleId,
          actorUserId,
        )

    if (
      membership === null ||
      membership.role !== 'narrator'
    ) {
      throw new CharacterEmbracePermissionError()
    }
  }

  async execute(
    actorUserId: string,
    command: EmbraceCharacterCommand,
  ): Promise<EmbraceCharacterResult> {
    const current =
      await this.characters
        .findByCharacterId(
          command.characterId,
        )

    if (current === null) {
      throw new CharacterEmbraceNotFoundError(
        command.characterId,
      )
    }

    await this.assertPermission(
      actorUserId,
      current,
    )

    if (current.status === 'archived') {
      throw new CharacterEmbraceArchivedError(
        command.characterId,
      )
    }

    if (
      current.revision !==
      command.expectedRevision
    ) {
      throw new CharacterEmbraceWriteConflictError(
        command.characterId,
      )
    }

    if (current.nature !== 'human') {
      throw new CharacterAlreadyEmbracedError(
        command.characterId,
      )
    }

    if (
      current.creation.creationMode !==
      'sessionZero'
    ) {
      throw new CharacterEmbraceCreationModeError(
        command.characterId,
      )
    }

    const validation =
      this.validator.validate(
        current,
        current.status === 'draft'
          ? 'activation'
          : 'play',
      )

    if (!validation.canProceed) {
      throw new CharacterEmbraceHumanProfileIncompleteError(
        validation,
      )
    }

    const humanityBefore =
      current.humanity.value

    const character =
      await this.characters.embrace({
        characterId:
          command.characterId,
        expectedRevision:
          command.expectedRevision,
        historyEntryId:
          randomUUID(),
      })

    if (
      character.humanity.value !==
      humanityBefore
    ) {
      throw new Error(
        'EMBRACE_HUMANITY_CHANGED_UNEXPECTEDLY',
      )
    }

    return {
      character,
      pendingDecisions:
        deriveCharacterEmbracePendingDecisions(
          character,
        ),
    }
  }
}
