import {
  Inject,
  Injectable,
} from '@nestjs/common'
import {
  CHRONICLE_EVENT_REPOSITORY,
} from './chronicle-event.repository'
import {
  CHRONICLE_PARTICIPANT_REPOSITORY,
} from './chronicle-participant.repository'
import {
  assertChronicleEventNarrator,
} from './chronicle-event-permission'
import type {
  ChronicleEventRepository,
} from './chronicle-event.repository'
import type {
  ChronicleParticipantRepository,
} from './chronicle-participant.repository'
import type {
  ChronicleEvent,
  UpdateChronicleEventData,
} from '../domain/chronicle-event.types'

export class ChronicleEventNotFoundError
  extends Error {
  constructor(eventId: string) {
    super(
      `Chronicle event not found: ${eventId}`,
    )
    this.name =
      'ChronicleEventNotFoundError'
  }
}

@Injectable()
export class UpdateChronicleEventUseCase {
  constructor(
    @Inject(CHRONICLE_EVENT_REPOSITORY)
    private readonly events:
      ChronicleEventRepository,
    @Inject(CHRONICLE_PARTICIPANT_REPOSITORY)
    private readonly participants:
      ChronicleParticipantRepository,
  ) {}

  async execute(
    actorUserId: string,
    data: UpdateChronicleEventData,
  ): Promise<ChronicleEvent> {
    await assertChronicleEventNarrator(
      this.participants,
      actorUserId,
      data.chronicleId,
    )

    const current =
      await this.events.findById(
        data.chronicleId,
        data.eventId,
      )

    if (
      current === null ||
      current.status === 'archived'
    ) {
      throw new ChronicleEventNotFoundError(
        data.eventId,
      )
    }

    const updated =
      await this.events.update(data)

    if (updated === null) {
      throw new ChronicleEventNotFoundError(
        data.eventId,
      )
    }

    return updated
  }
}
