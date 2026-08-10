import {
  Inject,
  Injectable,
} from '@nestjs/common'

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

  async execute(
    actorUserId: string,
    chronicleId: string,
  ): Promise<
    readonly ChronicleParticipant[]
  > {
    const membership =
      await this.repository.findActiveMembership(
        chronicleId,
        actorUserId,
      )

    if (membership === null) {
      throw new ChronicleParticipantPermissionError()
    }

    return this.repository.listByChronicleId(
      chronicleId,
    )
  }
}
