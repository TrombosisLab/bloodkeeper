import {
  Inject,
  Injectable,
} from '@nestjs/common'

import type {
  OffsetPage,
  OffsetPaginationQuery,
} from '../../common/offset-pagination'

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
export class ListChronicleSessionsUseCase {
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
    query: OffsetPaginationQuery,
  ): Promise<OffsetPage<ChronicleSession>> {
    const membership =
      await this.participants.findActiveMembership(
        chronicleId,
        actorUserId,
      )

    if (membership === null) {
      throw new ChronicleSessionPermissionError()
    }

    const page = await this.sessions.listByChronicleId(
      chronicleId,
      query,
    )

    if (membership.role === 'narrator') {
      return page
    }

    return {
      ...page,
      items: page.items.map((session) => ({
        ...session,
        narratorNotes: null,
      })),
    }
  }
}
