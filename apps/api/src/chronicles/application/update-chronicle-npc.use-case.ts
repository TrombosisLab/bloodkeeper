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

import type {
  ChronicleNpcRepository,
} from './chronicle-npc.repository'

import type {
  ChronicleParticipantRepository,
} from './chronicle-participant.repository'

import type {
  ChronicleNpc,
  UpdateChronicleNpcData,
} from '../domain/chronicle-npc.types'

export class ChronicleNpcNotFoundError
  extends Error {
  constructor(npcId: string) {
    super(`Chronicle NPC not found: ${npcId}`)
    this.name = 'ChronicleNpcNotFoundError'
  }
}

@Injectable()
export class UpdateChronicleNpcUseCase {
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
    data: UpdateChronicleNpcData,
  ): Promise<ChronicleNpc> {
    await assertChronicleNpcNarrator(
      this.participants,
      actorUserId,
      data.chronicleId,
    )

    const current =
      await this.npcs.findById(
        data.chronicleId,
        data.npcId,
      )

    if (current === null) {
      throw new ChronicleNpcNotFoundError(
        data.npcId,
      )
    }

    if (current.status === 'archived') {
      throw new ChronicleNpcNotFoundError(
        data.npcId,
      )
    }

    const updated =
      await this.npcs.update(data)

    if (updated === null) {
      throw new ChronicleNpcNotFoundError(
        data.npcId,
      )
    }

    return updated
  }
}
