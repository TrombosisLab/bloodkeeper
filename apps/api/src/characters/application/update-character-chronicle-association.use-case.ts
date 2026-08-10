import {
  CharacterDraftWriteConflictError,
} from './character-draft.repository'

import type {
  CharacterDraftRepository,
} from './character-draft.repository'

import type {
  ChronicleParticipantRepository,
} from '../../chronicles/application/chronicle-participant.repository'

import type {
  PersistedCharacterDraft,
  UpdateCharacterChronicleAssociationData,
} from '../domain/persisted-character.types'

export interface UpdateCharacterChronicleAssociationCommand
  extends UpdateCharacterChronicleAssociationData {
  readonly confirmChange: boolean
}

export class CharacterChronicleAssociationNotFoundError
  extends Error {
  constructor(characterId: string) {
    super(
      `Character not found: ${characterId}`,
    )
    this.name =
      'CharacterChronicleAssociationNotFoundError'
  }
}

export class CharacterChronicleMembershipRequiredError
  extends Error {
  constructor(chronicleId: string) {
    super(
      `Active chronicle membership required: ${chronicleId}`,
    )
    this.name =
      'CharacterChronicleMembershipRequiredError'
  }
}

export class CharacterChronicleChangeConfirmationRequiredError
  extends Error {
  constructor(characterId: string) {
    super(
      `Character chronicle change requires confirmation: ${characterId}`,
    )
    this.name =
      'CharacterChronicleChangeConfirmationRequiredError'
  }
}

export class UpdateCharacterChronicleAssociationUseCase {
  constructor(
    private readonly characterRepository:
      CharacterDraftRepository,
    private readonly participantRepository:
      ChronicleParticipantRepository,
  ) {}

  async execute(
    ownerId: string,
    command:
      UpdateCharacterChronicleAssociationCommand,
  ): Promise<PersistedCharacterDraft> {
    const current =
      await this.characterRepository.findById(
        ownerId,
        command.characterId,
      )

    if (current === null) {
      throw new CharacterChronicleAssociationNotFoundError(
        command.characterId,
      )
    }

    if (
      current.revision !==
      command.expectedRevision
    ) {
      throw new CharacterDraftWriteConflictError(
        command.characterId,
      )
    }

    if (
      current.chronicleId ===
      command.chronicleId
    ) {
      return current
    }

    if (command.chronicleId !== null) {
      const membership =
        await this.participantRepository
          .findActiveMembership(
            command.chronicleId,
            ownerId,
          )

      if (membership === null) {
        throw new CharacterChronicleMembershipRequiredError(
          command.chronicleId,
        )
      }
    }

    if (current.chronicleId !== null) {
      const hasHistory =
        await this.characterRepository
          .hasHistoryEntries(
            ownerId,
            command.characterId,
          )

      if (
        hasHistory &&
        !command.confirmChange
      ) {
        throw new CharacterChronicleChangeConfirmationRequiredError(
          command.characterId,
        )
      }
    }

    return this.characterRepository
      .updateChronicleAssociation(
        ownerId,
        {
          characterId:
            command.characterId,
          expectedRevision:
            command.expectedRevision,
          chronicleId:
            command.chronicleId,
        },
      )
  }
}
