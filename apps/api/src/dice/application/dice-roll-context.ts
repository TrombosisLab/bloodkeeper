import type {
  ChronicleParticipantRepository,
} from '../../chronicles/application/chronicle-participant.repository'

import type {
  ChronicleSessionRepository,
} from '../../chronicles/application/chronicle-session.repository'

import type {
  DiceRollRepository,
} from './dice-roll.repository'

import type {
  DiceRollContextCommand,
  ValidatedDiceRollContext,
} from '../domain/dice-history.types'

export class DiceRollContextPermissionError
  extends Error {
  constructor() {
    super('Active contextual membership or roll ownership is required')
    this.name = 'DiceRollContextPermissionError'
  }
}

export class DiceRollContextNotFoundError
  extends Error {
  constructor(readonly target: string) {
    super(`Dice roll context not found: ${target}`)
    this.name = 'DiceRollContextNotFoundError'
  }
}

export class DiceRollContextMismatchError
  extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DiceRollContextMismatchError'
  }
}

export interface ValidateDiceRollContextInput {
  readonly actorId: string
  readonly characterId: string | null
  readonly characterChronicleId: string | null
  readonly command: DiceRollContextCommand
}

export class DiceRollContextValidator {
  constructor(
    private readonly records: DiceRollRepository,
    private readonly participants:
      ChronicleParticipantRepository,
    private readonly sessions:
      ChronicleSessionRepository,
  ) {}

  async validate(
    input: ValidateDiceRollContextInput,
  ): Promise<ValidatedDiceRollContext> {
    const requestedChronicle =
      input.command.chronicleId ?? null

    if (
      input.characterId !== null &&
      requestedChronicle !== null &&
      requestedChronicle !== input.characterChronicleId
    ) {
      throw new DiceRollContextMismatchError(
        'Character does not belong to requested chronicle',
      )
    }

    const chronicleId =
      requestedChronicle ?? input.characterChronicleId
    const sessionId = input.command.sessionId ?? null

    if (sessionId !== null && chronicleId === null) {
      throw new DiceRollContextMismatchError(
        'Session context requires a chronicle',
      )
    }

    if (chronicleId !== null) {
      const membership =
        await this.participants.findActiveMembership(
          chronicleId,
          input.actorId,
        )
      if (membership === null) {
        throw new DiceRollContextPermissionError()
      }
    }

    if (sessionId !== null && chronicleId !== null) {
      const session = await this.sessions.findById(
        chronicleId,
        sessionId,
      )
      if (session === null) {
        throw new DiceRollContextNotFoundError(
          `session:${sessionId}`,
        )
      }
    }

    const rerollParentId =
      input.command.rerollParentId ?? null
    if (rerollParentId !== null) {
      const parent =
        await this.records.findById(rerollParentId)
      if (parent === null) {
        throw new DiceRollContextNotFoundError(
          `roll:${rerollParentId}`,
        )
      }
      if (parent.actorId !== input.actorId) {
        throw new DiceRollContextPermissionError()
      }
      if (
        parent.characterId !== input.characterId ||
        parent.chronicleId !== chronicleId ||
        parent.sessionId !== sessionId
      ) {
        throw new DiceRollContextMismatchError(
          'Reroll must preserve the original context',
        )
      }
    }

    return {
      characterId: input.characterId,
      chronicleId,
      sessionId,
      visibility:
        input.command.visibility ?? 'contextual',
      rerollParentId,
    }
  }
}
