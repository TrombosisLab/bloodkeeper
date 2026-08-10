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

import {
  assertChronicleLocationParent,
} from './chronicle-location-hierarchy'

import type {
  ChronicleLocationRepository,
} from './chronicle-location.repository'

import type {
  ChronicleParticipantRepository,
} from './chronicle-participant.repository'

import type {
  ChronicleLocation,
  CreateChronicleLocationData,
} from '../domain/chronicle-location.types'

@Injectable()
export class CreateChronicleLocationUseCase {
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
    data: CreateChronicleLocationData,
  ): Promise<ChronicleLocation> {
    await assertChronicleLocationNarrator(
      this.participants,
      actorUserId,
      data.chronicleId,
    )

    await assertChronicleLocationParent(
      this.locations,
      data.chronicleId,
      null,
      data.parentLocationId,
    )

    return this.locations.create(data)
  }
}
