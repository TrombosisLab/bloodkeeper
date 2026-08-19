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
} from '../domain/chronicle-session-context.types'

@Injectable()
export class LoadChronicleSessionContextUseCase {
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
    chronicleId: string,
    sessionId: string,
  ): Promise<ChronicleSessionContext | null> {
    await assertChronicleSessionNarrator(
      this.participants,
      actorUserId,
      chronicleId,
    )

    return this.contexts.findBySessionId(
      chronicleId,
      sessionId,
    )
  }
}
