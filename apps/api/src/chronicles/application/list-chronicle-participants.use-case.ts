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

import type {
  ChronicleParticipant,
} from '../domain/chronicle-participant.types'

export class ChronicleParticipantPermissionError
  extends Error {
  constructor() {
    super(
      'Active chronicle participation is required',
    )
    this.name =
      'ChronicleParticipantPermissionError'
  }
}

@Injectable()
export class ListChronicleParticipantsUseCase {
  constructor(
    @Inject(
      CHRONICLE_PARTICIPANT_REPOSITORY,
    )
    private readonly repository:
      ChronicleParticipantRepository,
  ) {}

  execute(
    actorUserId: string,
    chronicleId: string,
  ): Promise<
    readonly ChronicleParticipant[]
  >

  execute(
    actorUserId: string,
    chronicleId: string,
    query: OffsetPaginationQuery,
  ): Promise<
    OffsetPage<ChronicleParticipant>
  >

  async execute(
    actorUserId: string,
    chronicleId: string,
    query?: OffsetPaginationQuery,
  ): Promise<
    | readonly ChronicleParticipant[]
    | OffsetPage<ChronicleParticipant>
  > {
    const membership =
      await this.repository.findActiveMembership(
        chronicleId,
        actorUserId,
      )

    if (membership === null) {
      throw new ChronicleParticipantPermissionError()
    }

    if (query === undefined) {
      return this.repository.listByChronicleId(
        chronicleId,
      )
    }

    return this.repository.listByChronicleId(
      chronicleId,
      query,
    )
  }
}
