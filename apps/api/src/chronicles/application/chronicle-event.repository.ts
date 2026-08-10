import type {
  ChronicleEvent,
  CreateChronicleEventData,
  UpdateChronicleEventData,
} from '../domain/chronicle-event.types'

export const CHRONICLE_EVENT_REPOSITORY =
  Symbol('CHRONICLE_EVENT_REPOSITORY')

export class ChronicleEventReorderMismatchError
  extends Error {
  constructor() {
    super(
      'Event order must contain every active Chronicle event exactly once',
    )
    this.name =
      'ChronicleEventReorderMismatchError'
  }
}

export interface ChronicleEventRepository {
  listByChronicleId(
    chronicleId: string,
  ): Promise<readonly ChronicleEvent[]>

  findById(
    chronicleId: string,
    eventId: string,
  ): Promise<ChronicleEvent | null>

  create(
    data: CreateChronicleEventData,
  ): Promise<ChronicleEvent>

  update(
    data: UpdateChronicleEventData,
  ): Promise<ChronicleEvent | null>

  reorderActive(
    chronicleId: string,
    eventIds: readonly string[],
  ): Promise<readonly ChronicleEvent[]>

  archive(
    chronicleId: string,
    eventId: string,
  ): Promise<ChronicleEvent | null>
}
