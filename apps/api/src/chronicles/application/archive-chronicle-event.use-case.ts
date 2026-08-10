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
import {
  ChronicleEventNotFoundError,
} from './update-chronicle-event.use-case'
import type {
  ChronicleEventRepository,
} from './chronicle-event.repository'
import type {
  ChronicleParticipantRepository,
} from './chronicle-participant.repository'
import type {
  ChronicleEvent,
} from '../domain/chronicle-event.types'

@Injectable()
export class ArchiveChronicleEventUseCase {
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
    chronicleId: string,
    eventId: string,
  ): Promise<ChronicleEvent> {
    await assertChronicleEventNarrator(
      this.participants,
      actorUserId,
      chronicleId,
    )

    const current =
      await this.events.findById(
        chronicleId,
        eventId,
      )

    if (current === null) {
      throw new ChronicleEventNotFoundError(
        eventId,
      )
    }

    if (current.status === 'archived') {
      return current
    }

    const archived =
      await this.events.archive(
        chronicleId,
        eventId,
      )

    if (archived === null) {
      throw new ChronicleEventNotFoundError(
        eventId,
      )
    }

    return archived
  }
}
