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
  UpdateChronicleLocationData,
} from '../domain/chronicle-location.types'

export class ChronicleLocationNotFoundError
  extends Error {
  constructor(locationId: string) {
    super(
      `Chronicle location not found: ${locationId}`,
    )
    this.name =
      'ChronicleLocationNotFoundError'
  }
}

@Injectable()
export class UpdateChronicleLocationUseCase {
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
    data: UpdateChronicleLocationData,
  ): Promise<ChronicleLocation> {
    await assertChronicleLocationNarrator(
      this.participants,
      actorUserId,
      data.chronicleId,
    )

    const current =
      await this.locations.findById(
        data.chronicleId,
        data.locationId,
      )

    if (
      current === null ||
      current.status === 'archived'
    ) {
      throw new ChronicleLocationNotFoundError(
        data.locationId,
      )
    }

    if (data.parentLocationId !== undefined) {
      await assertChronicleLocationParent(
        this.locations,
        data.chronicleId,
        data.locationId,
        data.parentLocationId,
      )
    }

    const updated =
      await this.locations.update(data)

    if (updated === null) {
      throw new ChronicleLocationNotFoundError(
        data.locationId,
      )
    }

    return updated
  }
}
