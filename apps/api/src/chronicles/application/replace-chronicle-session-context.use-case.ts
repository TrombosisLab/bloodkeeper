import {
  Inject,
  Injectable,
} from '@nestjs/common'

import {
  CHRONICLE_PARTICIPANT_REPOSITORY,
} from './chronicle-participant.repository'

import {
  CHRONICLE_SESSION_CONTEXT_REPOSITORY,
} from './chronicle-session-context.repository'

import {
  assertChronicleSessionNarrator,
} from './chronicle-session-permission'

import type {
  ChronicleParticipantRepository,
} from './chronicle-participant.repository'

import type {
  ChronicleSessionContextRepository,
} from './chronicle-session-context.repository'

import type {
  ChronicleSessionContext,
  ReplaceChronicleSessionContextData,
} from '../domain/chronicle-session-context.types'

@Injectable()
export class ReplaceChronicleSessionContextUseCase {
  constructor(
    @Inject(
      CHRONICLE_SESSION_CONTEXT_REPOSITORY,
    )
    private readonly contexts:
      ChronicleSessionContextRepository,
    @Inject(
      CHRONICLE_PARTICIPANT_REPOSITORY,
    )
    private readonly participants:
      ChronicleParticipantRepository,
  ) {}

  async execute(
    actorUserId: string,
    data: ReplaceChronicleSessionContextData,
  ): Promise<ChronicleSessionContext | null> {
    await assertChronicleSessionNarrator(
      this.participants,
      actorUserId,
      data.chronicleId,
    )

    return this.contexts.replace(data)
  }
}
