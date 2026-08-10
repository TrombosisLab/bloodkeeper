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
import type {
  ChronicleSessionRepository,
} from './chronicle-session.repository'
import type {
  ChronicleParticipantRepository,
} from './chronicle-participant.repository'
import type {
  ChronicleSession,
  UpdateChronicleSessionData,
} from '../domain/chronicle-session.types'

export class ChronicleSessionNotFoundError
  extends Error {
  constructor(sessionId: string) {
    super(
      `Chronicle session not found: ${sessionId}`,
    )
    this.name =
      'ChronicleSessionNotFoundError'
  }
}

@Injectable()
export class UpdateChronicleSessionUseCase {
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
    data: UpdateChronicleSessionData,
  ): Promise<ChronicleSession> {
    await assertChronicleSessionNarrator(
      this.participants,
      actorUserId,
      data.chronicleId,
    )

    const current =
      await this.sessions.findById(
        data.chronicleId,
        data.sessionId,
      )

    if (
      current === null ||
      current.status === 'archived'
    ) {
      throw new ChronicleSessionNotFoundError(
        data.sessionId,
      )
    }

    const updated =
      await this.sessions.update(data)

    if (updated === null) {
      throw new ChronicleSessionNotFoundError(
        data.sessionId,
      )
    }

    return updated
  }
}
