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
  ChronicleLocationNotFoundError,
} from './update-chronicle-location.use-case'

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
export class ArchiveChronicleLocationUseCase {
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
  ): Promise<ChronicleLocation> {
    await assertChronicleLocationNarrator(
      this.participants,
      actorUserId,
      chronicleId,
    )

    const current =
      await this.locations.findById(
        chronicleId,
        locationId,
      )

    if (current === null) {
      throw new ChronicleLocationNotFoundError(
        locationId,
      )
    }

    if (current.status === 'archived') {
      return current
    }

    const archived =
      await this.locations.archive(
        chronicleId,
        locationId,
      )

    if (archived === null) {
      throw new ChronicleLocationNotFoundError(
        locationId,
      )
    }

    return archived
  }
}
