import {
  Inject,
  Injectable,
} from '@nestjs/common'

import type {
  OffsetPage,
  OffsetPaginationQuery,
} from '../../common/offset-pagination'

import {
  CHRONICLE_PARTICIPANT_REPOSITORY,
} from './chronicle-participant.repository'
import type {
  ChronicleParticipantRepository,
} from './chronicle-participant.repository'

import {
  assertChronicleSessionNarrator,
  assertChronicleSessionParticipant,
} from './chronicle-session-permission'

import {
  CHRONICLE_SESSION_REPOSITORY,
} from './chronicle-session.repository'
import type {
  ChronicleSessionRepository,
} from './chronicle-session.repository'

import {
  CHRONICLE_SESSION_ATTENDANCE_REPOSITORY,
} from './chronicle-session-attendance.repository'
import type {
  ChronicleSessionAttendanceRepository,
} from './chronicle-session-attendance.repository'

import type {
  ChronicleSessionAttendance,
} from '../domain/chronicle-session-attendance.types'

export class ChronicleSessionAttendanceSessionNotFoundError
  extends Error {
  constructor(sessionId: string) {
    super(
      `Chronicle session not found for attendance: ${sessionId}`,
    )
    this.name =
      'ChronicleSessionAttendanceSessionNotFoundError'
  }
}

export class ChronicleSessionAttendanceSessionNotEditableError
  extends Error {
  constructor(sessionId: string) {
    super(
      `Chronicle session attendance is immutable after completion: ${sessionId}`,
    )
    this.name =
      'ChronicleSessionAttendanceSessionNotEditableError'
  }
}

export class ChronicleSessionAttendanceCharacterNotEligibleError
  extends Error {
  constructor(characterId: string) {
    super(
      `Character is not eligible for Chronicle session attendance: ${characterId}`,
    )
    this.name =
      'ChronicleSessionAttendanceCharacterNotEligibleError'
  }
}

async function requireSession(
  sessions: ChronicleSessionRepository,
  chronicleId: string,
  sessionId: string,
  requireEditable: boolean,
) {
  const session =
    await sessions.findById(
      chronicleId,
      sessionId,
    )

  if (session === null) {
    throw new ChronicleSessionAttendanceSessionNotFoundError(
      sessionId,
    )
  }

  if (
    requireEditable &&
    session.status !== 'preparation'
  ) {
    throw new ChronicleSessionAttendanceSessionNotEditableError(
      sessionId,
    )
  }

  return session
}

async function requireEligibleCharacter(
  attendances:
    ChronicleSessionAttendanceRepository,
  chronicleId: string,
  characterId: string,
): Promise<void> {
  if (
    !await attendances.isEligibleCharacter(
      chronicleId,
      characterId,
    )
  ) {
    throw new ChronicleSessionAttendanceCharacterNotEligibleError(
      characterId,
    )
  }
}

@Injectable()
export class ListChronicleSessionAttendancesUseCase {
  constructor(
    @Inject(CHRONICLE_SESSION_ATTENDANCE_REPOSITORY)
    private readonly attendances:
      ChronicleSessionAttendanceRepository,
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
    query: OffsetPaginationQuery,
  ): Promise<
    OffsetPage<ChronicleSessionAttendance>
  > {
    await assertChronicleSessionParticipant(
      this.participants,
      actorUserId,
      chronicleId,
    )

    await requireSession(
      this.sessions,
      chronicleId,
      sessionId,
      false,
    )

    return this.attendances.listBySessionId(
      sessionId,
      query,
    )
  }
}

@Injectable()
export class AddChronicleSessionAttendanceUseCase {
  constructor(
    @Inject(CHRONICLE_SESSION_ATTENDANCE_REPOSITORY)
    private readonly attendances:
      ChronicleSessionAttendanceRepository,
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
    characterId: string,
  ): Promise<ChronicleSessionAttendance> {
    await assertChronicleSessionNarrator(
      this.participants,
      actorUserId,
      chronicleId,
    )

    await requireSession(
      this.sessions,
      chronicleId,
      sessionId,
      true,
    )

    await requireEligibleCharacter(
      this.attendances,
      chronicleId,
      characterId,
    )

    return this.attendances.add(
      sessionId,
      characterId,
    )
  }
}

@Injectable()
export class RemoveChronicleSessionAttendanceUseCase {
  constructor(
    @Inject(CHRONICLE_SESSION_ATTENDANCE_REPOSITORY)
    private readonly attendances:
      ChronicleSessionAttendanceRepository,
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
    characterId: string,
  ): Promise<void> {
    await assertChronicleSessionNarrator(
      this.participants,
      actorUserId,
      chronicleId,
    )

    await requireSession(
      this.sessions,
      chronicleId,
      sessionId,
      true,
    )

    await requireEligibleCharacter(
      this.attendances,
      chronicleId,
      characterId,
    )

    await this.attendances.remove(
      sessionId,
      characterId,
    )
  }
}
