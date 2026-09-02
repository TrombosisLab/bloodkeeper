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
  ChronicleSessionPermissionError,
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
    const membership = await this.participants.findActiveMembership(
      chronicleId,
      actorUserId,
    )
    if (membership === null) {
      throw new ChronicleSessionPermissionError()
    }

    const context = await this.contexts.findBySessionId(
      chronicleId,
      sessionId,
    )
    if (context === null || membership.role === 'narrator') {
      return context
    }

    return {
      ...context,
      resources: (context.resources ?? []).filter(
        (resource) => resource.visibility === 'chronicle_participants',
      ),
    }
  }
}
