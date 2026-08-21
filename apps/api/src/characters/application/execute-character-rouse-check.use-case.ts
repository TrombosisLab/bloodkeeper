import type {
  ChronicleParticipantRepository,
} from '../../chronicles/application/chronicle-participant.repository'

import type {
  CharacterDraftRepository,
} from './character-draft.repository'

import {
  CharacterRouseCheckOperationConflictError,
  CharacterRouseCheckWriteConflictError,
} from './character-rouse-check.repository'

import type {
  CharacterRouseCheckRepository,
} from './character-rouse-check.repository'

import {
  getCharacterRouseCheckDiceCount,
  InvalidCharacterRouseCheckError,
  resolveCharacterRouseCheck,
} from '../domain/character-rouse-check.rules'

import type {
  CharacterRouseCheckReason,
} from '../domain/character-rouse-check.rules'

import {
  assertValidCharacterHunger,
} from '../domain/character-hunger.rules'

import {
  requireCharacterBlood,
} from '../domain/character-vampire-state.rules'

import {
  isSameCharacterRouseCheckOperation,
} from '../domain/character-rouse-check-operation.types'

import type {
  PersistedCharacterDraft,
} from '../domain/persisted-character.types'

import type {
  PersistedCharacterRouseCheckOperation,
} from '../domain/character-rouse-check-operation.types'

export interface ExecuteCharacterRouseCheckCommand {
  readonly characterId: string
  readonly expectedRevision: number
  readonly operationId: string
  readonly reason: CharacterRouseCheckReason

  /*
   * Campos internos para consumidores contextuales posteriores.
   * El DTO público de SPEC-059-B no los acepta.
   */
  readonly forced?: boolean
  readonly disciplinePowerLevel?: number
}

export interface CharacterRouseCheckRandomSource {
  d10(): number
}

const systemRandomSource:
  CharacterRouseCheckRandomSource = {
    d10() {
      return (
        Math.floor(
          Math.random() * 10,
        ) + 1
      )
    },
  }

export class CharacterRouseCheckNotFoundError
  extends Error {
  constructor(characterId: string) {
    super(`Character not found: ${characterId}`)
    this.name =
      'CharacterRouseCheckNotFoundError'
  }
}

export class CharacterRouseCheckPermissionError
  extends Error {
  constructor() {
    super(
      'Character owner or active contextual Narrator permission is required',
    )
    this.name =
      'CharacterRouseCheckPermissionError'
  }
}

export class CharacterRouseCheckArchivedError
  extends Error {
  constructor(characterId: string) {
    super(
      `Archived character cannot perform a Rouse Check: ${characterId}`,
    )
    this.name =
      'CharacterRouseCheckArchivedError'
  }
}

export class CharacterRouseCheckNatureError
  extends Error {
  constructor(characterId: string) {
    super(
      `Human character cannot perform a Rouse Check: ${characterId}`,
    )
    this.name =
      'CharacterRouseCheckNatureError'
  }
}

export class ExecuteCharacterRouseCheckUseCase {
  constructor(
    private readonly characters:
      CharacterDraftRepository,
    private readonly rouseChecks:
      CharacterRouseCheckRepository,
    private readonly participants:
      ChronicleParticipantRepository,
    private readonly random:
      CharacterRouseCheckRandomSource =
        systemRandomSource,
  ) {}

  private async assertPermission(
    actorUserId: string,
    character: Pick<
      PersistedCharacterDraft,
      'ownerId' | 'chronicleId'
    >,
  ): Promise<void> {
    if (character.ownerId === actorUserId) {
      return
    }

    if (character.chronicleId === null) {
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
    command: ExecuteCharacterRouseCheckCommand,
  ): Promise<
    PersistedCharacterRouseCheckOperation
  > {
    const current =
      await this.characters.findByCharacterId(
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

    const attempt = {
      actorId: actorUserId,
      reason: command.reason,
      forced: command.forced ?? false,
      disciplinePowerLevel:
        command.disciplinePowerLevel,
    }

    const existing =
      await this.rouseChecks.findOperation(
        command.characterId,
        command.operationId,
      )

    if (existing !== null) {
      if (
        !isSameCharacterRouseCheckOperation(
          existing,
          attempt,
        )
      ) {
        throw new CharacterRouseCheckOperationConflictError(
          command.characterId,
          command.operationId,
        )
      }

      return existing
    }

    if (current.status === 'archived') {
      throw new CharacterRouseCheckArchivedError(
        command.characterId,
      )
    }

    if (current.nature !== 'vampire') {
      throw new CharacterRouseCheckNatureError(
        command.characterId,
      )
    }

    if (
      current.revision !==
      command.expectedRevision
    ) {
      throw new CharacterRouseCheckWriteConflictError(
        command.characterId,
      )
    }

    const blood =
      requireCharacterBlood(current)

    if (
      command.reason !== 'disciplinePower' &&
      command.disciplinePowerLevel !== undefined
    ) {
      throw new InvalidCharacterRouseCheckError([
        'ROUSE_DISCIPLINE_CONTEXT_INVALID',
      ])
    }

    const diceContext =
      command.reason === 'disciplinePower'
        ? {
            reason: command.reason,
            bloodPotency:
              blood.bloodPotency,
            disciplinePowerLevel:
              command.disciplinePowerLevel,
          }
        : {
            reason: command.reason,
          }

    const diceCount =
      getCharacterRouseCheckDiceCount(
        diceContext,
      )

    const rolls =
      Array.from(
        { length: diceCount },
        () => this.random.d10(),
      )

    const resolution =
      resolveCharacterRouseCheck({
        ...diceContext,
        rolls,
        hungerBefore: blood.hunger,
        forced: command.forced,
      })

    const hungerAfter =
      blood.hunger +
      resolution.hungerIncrease

    assertValidCharacterHunger(
      hungerAfter,
    )

    const consequenceDifficulty =
      resolution.consequence ===
        'hungerFrenzyTestRequired'
        ? 4
        : null

    return this.rouseChecks.persist({
      characterId: command.characterId,
      expectedRevision:
        command.expectedRevision,
      operationId: command.operationId,
      actorId: actorUserId,
      reason: command.reason,
      forced: command.forced ?? false,
      bloodPotency:
        command.reason === 'disciplinePower'
          ? blood.bloodPotency
          : null,
      disciplinePowerLevel:
        command.reason === 'disciplinePower'
          ? command.disciplinePowerLevel ?? null
          : null,
      rolls: resolution.rolls,
      selectedResult:
        resolution.selectedResult,
      success: resolution.success,
      hungerBefore: blood.hunger,
      hungerAfter,
      consequence:
        resolution.consequence,
      consequenceDifficulty,
    })
  }
}
