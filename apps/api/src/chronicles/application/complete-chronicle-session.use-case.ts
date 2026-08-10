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
  assertChronicleSessionNarrator,
} from './chronicle-session-permission'
import {
  ChronicleSessionNotFoundError,
} from './update-chronicle-session.use-case'
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
export class CompleteChronicleSessionUseCase {
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
  ): Promise<ChronicleSession> {
    await assertChronicleSessionNarrator(
      this.participants,
      actorUserId,
      chronicleId,
    )

    const current =
      await this.sessions.findById(
        chronicleId,
        sessionId,
      )

    if (
      current === null ||
      current.status === 'archived'
    ) {
      throw new ChronicleSessionNotFoundError(
        sessionId,
      )
    }

    if (current.status === 'completed') {
      return current
    }

    const completed =
      await this.sessions.complete(
        chronicleId,
        sessionId,
      )

    if (completed === null) {
      throw new ChronicleSessionNotFoundError(
        sessionId,
      )
    }

    return completed
  }
}
