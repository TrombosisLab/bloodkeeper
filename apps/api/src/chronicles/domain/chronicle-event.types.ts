export type ChronicleEventStatus =
  | 'active'
  | 'archived'

export interface ChronicleEvent {
  readonly id: string
  readonly chronicleId: string
  readonly title: string
  readonly description: string | null
  readonly narratorNotes: string | null
  readonly narrativeTimeLabel: string | null
  readonly realDate: Date | null
  readonly timelineOrder: number
  readonly status: ChronicleEventStatus
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface CreateChronicleEventData {
  readonly chronicleId: string
  readonly title: string
  readonly description: string | null
  readonly narratorNotes: string | null
  readonly narrativeTimeLabel: string | null
  readonly realDate: Date | null
}

export interface UpdateChronicleEventData {
  readonly chronicleId: string
  readonly eventId: string
  readonly title?: string
  readonly description?: string | null
  readonly narratorNotes?: string | null
  readonly narrativeTimeLabel?: string | null
  readonly realDate?: Date | null
}

export interface ReorderChronicleEventsData {
  readonly chronicleId: string
  readonly eventIds: readonly string[]
}
