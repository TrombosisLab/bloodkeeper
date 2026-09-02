import {
  Inject,
  Injectable,
} from '@nestjs/common'
import {
  CHRONICLE_SESSION_REPOSITORY,
} from './chronicle-session.repository'
import {
  CHRONICLE_PARTICIPANT_REPOSITORY,
} from './chronicle-participant.repository'
import {
  ChronicleSessionPermissionError,
} from './chronicle-session-permission'
import type {
  ChronicleSessionRepository,
} from './chronicle-session.repository'
import type {
  ChronicleParticipantRepository,
} from './chronicle-participant.repository'
import type {
  ChronicleSession,
} from '../domain/chronicle-session.types'

@Injectable()
export class LoadChronicleSessionUseCase {
  constructor(
    @Inject(CHRONICLE_SESSION_REPOSITORY)
    private readonly sessions:
      ChronicleSessionRepository,
    @Inject(CHRONICLE_PARTICIPANT_REPOSITORY)
    private readonly participants:
      ChronicleParticipantRepository,
  ) {}

  async execute(
    actorUserId: string,
    chronicleId: string,
    sessionId: string,
  ): Promise<ChronicleSession | null> {
    const membership =
      await this.participants.findActiveMembership(
        chronicleId,
        actorUserId,
      )

    if (membership === null) {
      throw new ChronicleSessionPermissionError()
    }

    const session = await this.sessions.findById(
      chronicleId,
      sessionId,
    )

    if (
      session === null ||
      membership.role === 'narrator'
    ) {
      return session
    }

    return {
      ...session,
      narratorNotes: null,
    }
  }
}
