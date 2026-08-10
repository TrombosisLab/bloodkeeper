import {
  Inject,
  Injectable,
} from '@nestjs/common'

import {
  CHRONICLE_NPC_REPOSITORY,
} from './chronicle-npc.repository'

import {
  CHRONICLE_PARTICIPANT_REPOSITORY,
} from './chronicle-participant.repository'

import {
  assertChronicleNpcNarrator,
} from './chronicle-npc-permission'

import {
  ChronicleNpcNotFoundError,
} from './update-chronicle-npc.use-case'

import type {
  ChronicleNpcRepository,
} from './chronicle-npc.repository'

import type {
  ChronicleParticipantRepository,
} from './chronicle-participant.repository'

import type {
  ChronicleNpc,
} from '../domain/chronicle-npc.types'

@Injectable()
export class ArchiveChronicleNpcUseCase {
  constructor(
    @Inject(CHRONICLE_NPC_REPOSITORY)
    private readonly npcs:
      ChronicleNpcRepository,
    @Inject(CHRONICLE_PARTICIPANT_REPOSITORY)
    private readonly participants:
      ChronicleParticipantRepository,
  ) {}

  async execute(
    actorUserId: string,
    chronicleId: string,
    npcId: string,
  ): Promise<ChronicleNpc> {
    await assertChronicleNpcNarrator(
      this.participants,
      actorUserId,
      chronicleId,
    )

    const current =
      await this.npcs.findById(
        chronicleId,
        npcId,
      )

    if (current === null) {
      throw new ChronicleNpcNotFoundError(
        npcId,
      )
    }

    if (current.status === 'archived') {
      return current
    }

    const archived =
      await this.npcs.archive(
        chronicleId,
        npcId,
      )

    if (archived === null) {
      throw new ChronicleNpcNotFoundError(
        npcId,
      )
    }

    return archived
  }
}
