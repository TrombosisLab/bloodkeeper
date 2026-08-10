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

import {
  CHRONICLE_PARTICIPANT_RELATIONS,
} from './chronicle-participant-relations'

import type {
  ChronicleParticipantRelations,
} from './chronicle-participant-relations'

import {
  ChronicleParticipantPermissionError,
} from './list-chronicle-participants.use-case'

import type {
  ChronicleParticipant,
} from '../domain/chronicle-participant.types'

export class ChronicleParticipantNotFoundError
  extends Error {
  constructor(participantId: string) {
    super(
      `Chronicle participant not found: ${participantId}`,
    )
    this.name =
      'ChronicleParticipantNotFoundError'
  }
}

export class ChronicleLastNarratorRequiredError
  extends Error {
  constructor() {
    super(
      'A chronicle requires at least one active narrator',
    )
    this.name =
      'ChronicleLastNarratorRequiredError'
  }
}

export class ChronicleParticipantActiveCharacterRelationError
  extends Error {
  constructor() {
    super(
      'Participant has non-archived characters associated with the chronicle',
    )
    this.name =
      'ChronicleParticipantActiveCharacterRelationError'
  }
}

@Injectable()
export class RetireChronicleParticipantUseCase {
  constructor(
    @Inject(
      CHRONICLE_PARTICIPANT_REPOSITORY,
    )
    private readonly repository:
      ChronicleParticipantRepository,
    @Inject(
      CHRONICLE_PARTICIPANT_RELATIONS,
    )
    private readonly relations:
      ChronicleParticipantRelations,
  ) {}

  async execute(
    actorUserId: string,
    chronicleId: string,
    participantId: string,
  ): Promise<ChronicleParticipant> {
    const actorMembership =
      await this.repository.findActiveMembership(
        chronicleId,
        actorUserId,
      )

    if (
      actorMembership === null ||
      actorMembership.role !== 'narrator'
    ) {
      throw new ChronicleParticipantPermissionError()
    }

    const participant =
      await this.repository.findById(
        chronicleId,
        participantId,
      )

    if (
      participant === null ||
      participant.status !== 'active'
    ) {
      throw new ChronicleParticipantNotFoundError(
        participantId,
      )
    }

    if (participant.role === 'narrator') {
      const activeNarrators =
        await this.repository.countActiveNarrators(
          chronicleId,
        )

      if (activeNarrators <= 1) {
        throw new ChronicleLastNarratorRequiredError()
      }
    }

    if (
      await this.relations
        .hasNonArchivedCharacters(
          chronicleId,
          participant.userId,
        )
    ) {
      throw new ChronicleParticipantActiveCharacterRelationError()
    }

    return this.repository.retire(
      chronicleId,
      participantId,
    )
  }
}
