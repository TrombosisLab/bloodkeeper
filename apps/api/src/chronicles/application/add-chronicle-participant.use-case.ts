import {
  Inject,
  Injectable,
} from '@nestjs/common'

import {
  CHRONICLE_PARTICIPANT_REPOSITORY,
  ChronicleParticipantDuplicateError,
} from './chronicle-participant.repository'

import type {
  ChronicleParticipantRepository,
} from './chronicle-participant.repository'

import {
  ChronicleParticipantPermissionError,
} from './list-chronicle-participants.use-case'

import type {
  AddChronicleParticipantData,
  ChronicleParticipant,
} from '../domain/chronicle-participant.types'

export class ChronicleParticipantUserNotFoundError
  extends Error {
  constructor(userId: string) {
    super(
      `Chronicle participant user not found: ${userId}`,
    )
    this.name =
      'ChronicleParticipantUserNotFoundError'
  }
}

@Injectable()
export class AddChronicleParticipantUseCase {
  constructor(
    @Inject(
      CHRONICLE_PARTICIPANT_REPOSITORY,
    )
    private readonly repository:
      ChronicleParticipantRepository,
  ) {}

  async execute(
    actorUserId: string,
    data: AddChronicleParticipantData,
  ): Promise<ChronicleParticipant> {
    const actorMembership =
      await this.repository.findActiveMembership(
        data.chronicleId,
        actorUserId,
      )

    if (
      actorMembership === null ||
      actorMembership.role !== 'narrator'
    ) {
      throw new ChronicleParticipantPermissionError()
    }

    if (
      !await this.repository.userExists(
        data.userId,
      )
    ) {
      throw new ChronicleParticipantUserNotFoundError(
        data.userId,
      )
    }

    const existing =
      await this.repository.findByUserId(
        data.chronicleId,
        data.userId,
      )

    if (existing !== null) {
      throw new ChronicleParticipantDuplicateError(
        data.chronicleId,
        data.userId,
      )
    }

    return this.repository.add(data)
  }
}
