import {
  Inject,
  Injectable,
} from '@nestjs/common'
import {
  CHARACTER_EXPERIENCE_REPOSITORY,
  CharacterExperienceDuplicateError,
} from '../../characters/application/character-experience.repository'
import type {
  CharacterExperienceRepository,
} from '../../characters/application/character-experience.repository'
import {
  characterExperienceGrantKey,
  characterExperienceGrantPolicy,
} from '../../characters/domain/character-experience.rules'
import {
  CHRONICLE_SESSION_ATTENDANCE_REPOSITORY,
} from './chronicle-session-attendance.repository'
import type {
  ChronicleSessionAttendanceRepository,
} from './chronicle-session-attendance.repository'

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
    @Inject(CHRONICLE_SESSION_ATTENDANCE_REPOSITORY)
    private readonly attendances?:
      ChronicleSessionAttendanceRepository,
    @Inject(CHARACTER_EXPERIENCE_REPOSITORY)
    private readonly experience?:
      CharacterExperienceRepository,
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
      await this.grantExperienceForSession(
        actorUserId,
        chronicleId,
        sessionId,
      )
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

    await this.grantExperienceForSession(
      actorUserId,
      chronicleId,
      sessionId,
    )

    return completed
  }

  private async grantExperienceForSession(
    actorUserId: string,
    chronicleId: string,
    sessionId: string,
  ): Promise<void> {
    if (
      this.attendances === undefined ||
      this.experience === undefined
    ) {
      return
    }
    const reason = 'session_played' as const
    const amount = characterExperienceGrantPolicy(reason).amount
    let offset = 0
    while (true) {
      const page = await this.attendances.listBySessionId(
        sessionId,
        { limit: 50, offset },
      )
      for (const attendance of page.items) {
        try {
          await this.experience.appendGrant({
            characterId: attendance.characterId,
            actorId: actorUserId,
            chronicleId,
            sessionId,
            amount,
            reason,
            deduplicationKey: characterExperienceGrantKey(
              reason,
              sessionId,
              `session-complete:${sessionId}`,
            ),
          })
        } catch (error: unknown) {
          if (!(error instanceof CharacterExperienceDuplicateError)) {
            throw error
          }
        }
      }
      if (page.nextOffset === null) {
        return
      }
      offset = page.nextOffset
    }
  }
}
