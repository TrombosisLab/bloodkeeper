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
  CreateChronicleEventData,
} from '../domain/chronicle-event.types'

@Injectable()
export class CreateChronicleEventUseCase {
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
    data: CreateChronicleEventData,
  ): Promise<ChronicleEvent> {
    await assertChronicleEventNarrator(
      this.participants,
      actorUserId,
      data.chronicleId,
    )

    return this.events.create(data)
  }
}
