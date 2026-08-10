import {
  Inject,
  Injectable,
} from '@nestjs/common'

import {
  CHRONICLE_LOCATION_REPOSITORY,
} from './chronicle-location.repository'

import {
  CHRONICLE_PARTICIPANT_REPOSITORY,
} from './chronicle-participant.repository'

import {
  assertChronicleLocationNarrator,
} from './chronicle-location-permission'

import type {
  ChronicleLocationRepository,
} from './chronicle-location.repository'

import type {
  ChronicleParticipantRepository,
} from './chronicle-participant.repository'

import type {
  ChronicleLocation,
} from '../domain/chronicle-location.types'

@Injectable()
export class LoadChronicleLocationUseCase {
  constructor(
    @Inject(CHRONICLE_LOCATION_REPOSITORY)
    private readonly locations:
      ChronicleLocationRepository,
    @Inject(CHRONICLE_PARTICIPANT_REPOSITORY)
    private readonly participants:
      ChronicleParticipantRepository,
  ) {}

  async execute(
    actorUserId: string,
    chronicleId: string,
    locationId: string,
  ): Promise<ChronicleLocation | null> {
    await assertChronicleLocationNarrator(
      this.participants,
      actorUserId,
      chronicleId,
    )

    return this.locations.findById(
      chronicleId,
      locationId,
    )
  }
}
