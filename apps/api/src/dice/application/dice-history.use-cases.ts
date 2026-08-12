import type {
  ChronicleParticipant,
} from '../../chronicles/domain/chronicle-participant.types'

import type {
  ChronicleParticipantRepository,
} from '../../chronicles/application/chronicle-participant.repository'

import type {
  ChronicleSessionRepository,
} from '../../chronicles/application/chronicle-session.repository'

import {
  DiceRollContextMismatchError,
  DiceRollContextNotFoundError,
  DiceRollContextPermissionError,
} from './dice-roll-context'

import type {
  DiceRollRepository,
} from './dice-roll.repository'

import type {
  DiceRollHistoryAccessScope,
  DiceRollHistoryPage,
  DiceRollRecord,
  ListDiceRollHistoryCommand,
} from '../domain/dice-history.types'

async function activeMembership(
  participants: ChronicleParticipantRepository,
  chronicleId: string,
  viewerId: string,
): Promise<ChronicleParticipant> {
  const membership = await participants.findActiveMembership(
    chronicleId,
    viewerId,
  )
  if (membership === null) {
    throw new DiceRollContextPermissionError()
  }
  return membership
}

export class ListDiceRollHistoryUseCase {
  constructor(
    private readonly records: DiceRollRepository,
    private readonly participants:
      ChronicleParticipantRepository,
    private readonly sessions:
      ChronicleSessionRepository,
  ) {}

  async execute(
    viewerId: string,
    command: ListDiceRollHistoryCommand,
  ): Promise<DiceRollHistoryPage> {
    const character = command.characterId === undefined
      ? null
      : await this.records.findCharacterContext(
          command.characterId,
        )

    if (command.characterId !== undefined && character === null) {
      throw new DiceRollContextNotFoundError(
        `character:${command.characterId}`,
      )
    }
    if (
      character !== null &&
      command.chronicleId !== undefined &&
      character.chronicleId !== command.chronicleId
    ) {
      throw new DiceRollContextMismatchError(
        'Character does not belong to requested chronicle',
      )
    }

    const contextChronicleId =
      command.chronicleId ?? character?.chronicleId ?? null

    if (
      command.sessionId !== undefined &&
      contextChronicleId === null
    ) {
      throw new DiceRollContextMismatchError(
        'Session history requires a chronicle context',
      )
    }
    if (
      command.sessionId !== undefined &&
      contextChronicleId !== null
    ) {
      const session = await this.sessions.findById(
        contextChronicleId,
        command.sessionId,
      )
      if (session === null) {
        throw new DiceRollContextNotFoundError(
          `session:${command.sessionId}`,
        )
      }
    }

    let accessScope: DiceRollHistoryAccessScope = 'actor'

    if (command.chronicleId !== undefined) {
      const membership = await activeMembership(
        this.participants,
        command.chronicleId,
        viewerId,
      )
      accessScope = membership.role === 'narrator'
        ? 'narrator'
        : 'participant'
    } else if (character !== null) {
      if (character.ownerId === viewerId) {
        accessScope = 'actor'
      } else {
        if (character.chronicleId === null) {
          throw new DiceRollContextPermissionError()
        }
        const membership = await activeMembership(
          this.participants,
          character.chronicleId,
          viewerId,
        )
        if (membership.role !== 'narrator') {
          throw new DiceRollContextPermissionError()
        }
        accessScope = 'narrator'
      }
    }

    if (
      accessScope === 'actor' &&
      command.actorId !== undefined &&
      command.actorId !== viewerId
    ) {
      throw new DiceRollContextPermissionError()
    }

    return this.records.list({
      viewerId,
      accessScope,
      actorId: command.actorId,
      characterId: command.characterId,
      chronicleId: command.chronicleId,
      sessionId: command.sessionId,
      source: command.source,
      description: command.description,
      limit: command.limit,
      cursor: command.cursor,
    })
  }
}

export class LoadDiceRollHistoryUseCase {
  constructor(
    private readonly records: DiceRollRepository,
    private readonly participants:
      ChronicleParticipantRepository,
  ) {}

  async execute(
    viewerId: string,
    rollId: string,
  ): Promise<DiceRollRecord | null> {
    const record = await this.records.findById(rollId)
    if (record === null) return null
    if (record.actorId === viewerId) return record
    if (record.chronicleId === null) {
      throw new DiceRollContextPermissionError()
    }

    const membership = await activeMembership(
      this.participants,
      record.chronicleId,
      viewerId,
    )
    if (
      record.visibility === 'private' &&
      membership.role !== 'narrator'
    ) {
      throw new DiceRollContextPermissionError()
    }
    return record
  }
}
