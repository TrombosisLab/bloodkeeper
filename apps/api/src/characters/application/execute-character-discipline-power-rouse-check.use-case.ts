import {
  LoadCharacterDisciplinePowerRouseProfilesUseCase,
} from './load-character-discipline-power-rouse-profiles.use-case'

import {
  ExecuteCharacterRouseCheckUseCase,
} from './execute-character-rouse-check.use-case'

import type {
  PersistedCharacterRouseCheckOperation,
} from '../domain/character-rouse-check-operation.types'

import type {
  CharacterDisciplinePowerRouseProfileStatus,
} from '../domain/discipline-power-rouse-profile'

export interface ExecuteCharacterDisciplinePowerRouseCheckCommand {
  readonly characterId: string
  readonly expectedRevision: number
  readonly operationId: string
  readonly powerKey: string
}

export class CharacterDisciplinePowerRouseCheckUnavailableError
  extends Error {
  readonly status:
    CharacterDisciplinePowerRouseProfileStatus |
    'unknownPower'

  constructor(
    powerKey: string,
    status:
      CharacterDisciplinePowerRouseProfileStatus |
      'unknownPower',
  ) {
    super(
      `Discipline power is not ready for a Rouse Check: ${powerKey}`,
    )
    this.name =
      'CharacterDisciplinePowerRouseCheckUnavailableError'
    this.status = status
  }
}

export class ExecuteCharacterDisciplinePowerRouseCheckUseCase {
  constructor(
    private readonly profiles:
      LoadCharacterDisciplinePowerRouseProfilesUseCase,
    private readonly executeRouse:
      ExecuteCharacterRouseCheckUseCase,
  ) {}

  async execute(
    actorUserId: string,
    command: ExecuteCharacterDisciplinePowerRouseCheckCommand,
  ): Promise<PersistedCharacterRouseCheckOperation> {
    const snapshot =
      await this.profiles.execute(
        actorUserId,
        command.characterId,
      )

    const profile = snapshot.profiles.find(
      (candidate) =>
        candidate.powerKey === command.powerKey,
    )

    if (
      profile === undefined ||
      profile.status !== 'ready' ||
      profile.level === null
    ) {
      throw new CharacterDisciplinePowerRouseCheckUnavailableError(
        command.powerKey,
        profile?.status ?? 'unknownPower',
      )
    }

    return this.executeRouse.execute(
      actorUserId,
      {
        characterId: command.characterId,
        expectedRevision:
          command.expectedRevision,
        operationId: command.operationId,
        reason: 'disciplinePower',
        disciplinePowerLevel: profile.level,
      },
    )
  }
}

