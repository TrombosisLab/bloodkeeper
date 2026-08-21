import type {
  ChronicleParticipantRepository,
} from '../../chronicles/application/chronicle-participant.repository'

import type {
  CharacterDraftRepository,
} from './character-draft.repository'

import {
  CharacterBlushOfLifeOperationConflictError,
  CharacterBlushOfLifeWriteConflictError,
} from './character-blush-of-life.repository'

import type {
  CharacterBlushOfLifeRepository,
} from './character-blush-of-life.repository'

import type {
  CharacterRouseCheckRepository,
} from './character-rouse-check.repository'

import {
  ExecuteCharacterRouseCheckUseCase,
  CharacterRouseCheckArchivedError,
  CharacterRouseCheckNatureError,
  CharacterRouseCheckNotFoundError,
  CharacterRouseCheckPermissionError,
} from './execute-character-rouse-check.use-case'

import {
  isSameCharacterRouseCheckOperation,
} from '../domain/character-rouse-check-operation.types'

import type {
  PersistedCharacterRouseCheckOperation,
} from '../domain/character-rouse-check-operation.types'

import {
  isCharacterBlushOfLifeRouseExemption,
} from '../domain/character-blush-of-life.types'

import type {
  PersistedCharacterBlushOfLifeExemptionOperation,
} from '../domain/character-blush-of-life.types'

import {
  requireCharacterBlood,
} from '../domain/character-vampire-state.rules'

import type {
  PersistedCharacterDraft,
} from '../domain/persisted-character.types'

export interface UseCharacterBlushOfLifeCommand {
  readonly characterId: string
  readonly expectedRevision: number
  readonly operationId: string
}

export type UseCharacterBlushOfLifeResult =
  | {
      readonly outcome:
        'rouseResolved'
      readonly operation:
        PersistedCharacterRouseCheckOperation
    }
  | {
      readonly outcome:
        'rouseExempted'
      readonly operation:
        PersistedCharacterBlushOfLifeExemptionOperation
    }

export class UseCharacterBlushOfLifeUseCase {
  constructor(
    private readonly characters: Pick<
      CharacterDraftRepository,
      'findByCharacterId'
    >,
    private readonly blush:
      CharacterBlushOfLifeRepository,
    private readonly rouseChecks:
      CharacterRouseCheckRepository,
    private readonly participants:
      ChronicleParticipantRepository,
    private readonly executeRouse:
      ExecuteCharacterRouseCheckUseCase,
  ) {}

  private async assertPermission(
    actorUserId: string,
    character: Pick<
      PersistedCharacterDraft,
      'ownerId' | 'chronicleId'
    >,
  ): Promise<void> {
    if (
      character.ownerId ===
      actorUserId
    ) {
      return
    }

    if (
      character.chronicleId === null
    ) {
      throw new CharacterRouseCheckPermissionError()
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
      throw new CharacterRouseCheckPermissionError()
    }
  }

  async execute(
    actorUserId: string,
    command:
      UseCharacterBlushOfLifeCommand,
  ): Promise<
    UseCharacterBlushOfLifeResult
  > {
    const current =
      await this.characters
        .findByCharacterId(
          command.characterId,
        )

    if (current === null) {
      throw new CharacterRouseCheckNotFoundError(
        command.characterId,
      )
    }

    await this.assertPermission(
      actorUserId,
      current,
    )

    const exempted =
      await this.blush
        .findExemptionOperation(
          command.characterId,
          command.operationId,
        )

    if (exempted !== null) {
      if (
        exempted.actorId !==
        actorUserId
      ) {
        throw new CharacterBlushOfLifeOperationConflictError(
          command.characterId,
          command.operationId,
        )
      }

      return {
        outcome: 'rouseExempted',
        operation: exempted,
      }
    }

    const resolvedRouse =
      await this.rouseChecks
        .findOperation(
          command.characterId,
          command.operationId,
        )

    if (resolvedRouse !== null) {
      if (
        !isSameCharacterRouseCheckOperation(
          resolvedRouse,
          {
            actorId: actorUserId,
            reason: 'blushOfLife',
            forced: false,
            disciplinePowerLevel: null,
          },
        )
      ) {
        throw new CharacterBlushOfLifeOperationConflictError(
          command.characterId,
          command.operationId,
        )
      }

      return {
        outcome: 'rouseResolved',
        operation: resolvedRouse,
      }
    }

    if (
      current.status === 'archived'
    ) {
      throw new CharacterRouseCheckArchivedError(
        command.characterId,
      )
    }

    if (
      current.nature !== 'vampire'
    ) {
      throw new CharacterRouseCheckNatureError(
        command.characterId,
      )
    }

    if (
      current.revision !==
      command.expectedRevision
    ) {
      throw new CharacterBlushOfLifeWriteConflictError(
        command.characterId,
      )
    }

    const blood =
      requireCharacterBlood(current)

    const active =
      await this.blush
        .findActiveDyscrasia(
          command.characterId,
        )

    if (
      active !== null &&
      isCharacterBlushOfLifeRouseExemption(
        active.dyscrasiaKey,
      )
    ) {
      return {
        outcome: 'rouseExempted',
        operation:
          await this.blush
            .persistExemption({
              characterId:
                command.characterId,
              expectedRevision:
                command.expectedRevision,
              operationId:
                command.operationId,
              actorId:
                actorUserId,
              dyscrasiaKey:
                active.dyscrasiaKey,
              sourceBloodOperationId:
                active.sourceBloodOperationId,
              hungerBefore:
                blood.hunger,
            }),
      }
    }

    return {
      outcome: 'rouseResolved',
      operation:
        await this.executeRouse.execute(
          actorUserId,
          {
            characterId:
              command.characterId,
            expectedRevision:
              command.expectedRevision,
            operationId:
              command.operationId,
            reason: 'blushOfLife',
          },
        ),
    }
  }
}
