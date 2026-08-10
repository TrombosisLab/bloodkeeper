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
  CreateChronicleNpcData,
} from '../domain/chronicle-npc.types'

@Injectable()
export class CreateChronicleNpcUseCase {
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
    data: CreateChronicleNpcData,
  ): Promise<ChronicleNpc> {
    await assertChronicleNpcNarrator(
      this.participants,
      actorUserId,
      data.chronicleId,
    )

    return this.npcs.create(data)
  }
}
