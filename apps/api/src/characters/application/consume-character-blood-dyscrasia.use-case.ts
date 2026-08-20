import type {
  ChronicleParticipantRepository,
} from '../../chronicles/application/chronicle-participant.repository'

import type {
  CharacterDraftRepository,
} from './character-draft.repository'

import {
  CharacterBloodDyscrasiaAlreadyConsumedError,
  CharacterBloodDyscrasiaConsumptionOperationConflictError,
  CharacterBloodDyscrasiaConsumptionWriteConflictError,
} from './character-blood-dyscrasia-consumption.repository'

import type {
  CharacterBloodDyscrasiaConsumptionRepository,
} from './character-blood-dyscrasia-consumption.repository'

import {
  assertConsumableCharacterBloodDyscrasia,
  isSameCharacterBloodDyscrasiaConsumptionOperation,
} from '../domain/character-blood-dyscrasia-consumption.types'

import type {
  CharacterBloodDyscrasiaKey,
} from '../domain/character-blood-dyscrasia-consumption.types'

import {
  requireCharacterBlood,
} from '../domain/character-vampire-state.rules'

import type {
  PersistedCharacterDraft,
} from '../domain/persisted-character.types'

export interface ConsumeCharacterBloodDyscrasiaCommand {
  readonly characterId: string
  readonly expectedRevision: number
  readonly operationId: string
  readonly sourceBloodOperationId: string
  readonly dyscrasiaKey:
    CharacterBloodDyscrasiaKey
}

export class CharacterBloodDyscrasiaConsumptionNotFoundError
  extends Error {
  constructor(characterId: string) {
    super(`Character not found: ${characterId}`)
    this.name =
      'CharacterBloodDyscrasiaConsumptionNotFoundError'
  }
}

export class CharacterBloodDyscrasiaConsumptionPermissionError
  extends Error {
  constructor() {
    super(
      'Character owner or active contextual Narrator permission is required',
    )
    this.name =
      'CharacterBloodDyscrasiaConsumptionPermissionError'
  }
}

export class CharacterBloodDyscrasiaConsumptionArchivedError
  extends Error {
  constructor(characterId: string) {
    super(
      `Archived character cannot consume a Dyscrasia: ${characterId}`,
    )
    this.name =
      'CharacterBloodDyscrasiaConsumptionArchivedError'
  }
}

export class CharacterBloodDyscrasiaConsumptionNatureError
  extends Error {
  constructor(characterId: string) {
    super(
      `Human character cannot consume a Dyscrasia: ${characterId}`,
    )
    this.name =
      'CharacterBloodDyscrasiaConsumptionNatureError'
  }
}

export class CharacterBloodDyscrasiaNotActiveError
  extends Error {
  constructor(
    characterId: string,
    sourceBloodOperationId: string,
  ) {
    super(
      `Character blood Dyscrasia instance ${characterId}/${sourceBloodOperationId} is not active`,
    )
    this.name =
      'CharacterBloodDyscrasiaNotActiveError'
  }
}

/**
 * Internal application service.
 *
 * It is intentionally not exposed by an HTTP controller in 058-D.
 * A real mechanical consumer (for example SPEC-058-E experience)
 * must invoke this operation as part of its own trusted backend flow.
 */
export class ConsumeCharacterBloodDyscrasiaUseCase {
  constructor(
    private readonly characters: Pick<
      CharacterDraftRepository,
      'findByCharacterId'
    >,
    private readonly consumptions:
      CharacterBloodDyscrasiaConsumptionRepository,
    private readonly participants:
      ChronicleParticipantRepository,
  ) {}

  private async assertPermission(
    actorUserId: string,
    character: Pick<
      PersistedCharacterDraft,
      'ownerId' | 'chronicleId'
    >,
  ): Promise<void> {
    if (character.chronicleId === null) {
      if (character.ownerId !== actorUserId) {
        throw new CharacterBloodDyscrasiaConsumptionPermissionError()
      }

      return
    }

    const membership =
      await this.participants.findActiveMembership(
        character.chronicleId,
        actorUserId,
      )

    if (
      membership === null ||
      membership.role !== 'narrator'
    ) {
      throw new CharacterBloodDyscrasiaConsumptionPermissionError()
    }
  }

  async execute(
    actorUserId: string,
    command:
      ConsumeCharacterBloodDyscrasiaCommand,
  ): Promise<PersistedCharacterDraft> {
    const current =
      await this.characters.findByCharacterId(
        command.characterId,
      )

    if (current === null) {
      throw new CharacterBloodDyscrasiaConsumptionNotFoundError(
        command.characterId,
      )
    }

    await this.assertPermission(
      actorUserId,
      current,
    )

    const existingOperation =
      await this.consumptions
        .findBloodDyscrasiaConsumptionOperation(
          command.characterId,
          command.operationId,
        )

    if (existingOperation !== null) {
      if (
        !isSameCharacterBloodDyscrasiaConsumptionOperation(
          existingOperation,
          command,
        )
      ) {
        throw new CharacterBloodDyscrasiaConsumptionOperationConflictError(
          command.characterId,
          command.operationId,
        )
      }

      return current
    }

    const alreadyConsumed =
      await this.consumptions
        .findBloodDyscrasiaConsumptionBySource(
          command.characterId,
          command.sourceBloodOperationId,
        )

    if (alreadyConsumed !== null) {
      throw new CharacterBloodDyscrasiaAlreadyConsumedError(
        command.characterId,
        command.sourceBloodOperationId,
      )
    }

    if (current.status === 'archived') {
      throw new CharacterBloodDyscrasiaConsumptionArchivedError(
        command.characterId,
      )
    }

    if (current.nature !== 'vampire') {
      throw new CharacterBloodDyscrasiaConsumptionNatureError(
        command.characterId,
      )
    }

    if (
      current.revision !==
      command.expectedRevision
    ) {
      throw new CharacterBloodDyscrasiaConsumptionWriteConflictError(
        command.characterId,
      )
    }

    requireCharacterBlood(current)

    assertConsumableCharacterBloodDyscrasia(
      command.dyscrasiaKey,
    )

    const active =
      await this.consumptions
        .findActiveBloodDyscrasia(
          command.characterId,
        )

    if (
      active === null ||
      active.sourceBloodOperationId !==
        command.sourceBloodOperationId ||
      active.dyscrasiaKey !==
        command.dyscrasiaKey
    ) {
      throw new CharacterBloodDyscrasiaNotActiveError(
        command.characterId,
        command.sourceBloodOperationId,
      )
    }

    return this.consumptions
      .consumeBloodDyscrasia({
        characterId: command.characterId,
        expectedRevision:
          command.expectedRevision,
        operationId: command.operationId,
        sourceBloodOperationId:
          command.sourceBloodOperationId,
        dyscrasiaKey:
          command.dyscrasiaKey,
      })
  }
}
