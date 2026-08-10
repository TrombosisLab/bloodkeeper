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
  CreateChronicleSessionData,
} from '../domain/chronicle-session.types'

@Injectable()
export class CreateChronicleSessionUseCase {
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
    data: CreateChronicleSessionData,
  ): Promise<ChronicleSession> {
    await assertChronicleSessionNarrator(
      this.participants,
      actorUserId,
      data.chronicleId,
    )

    return this.sessions.create(data)
  }
}
