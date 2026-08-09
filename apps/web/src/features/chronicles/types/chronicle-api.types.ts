export type ChronicleApiStatus =
  | 'preparation'
  | 'active'
  | 'archived'

export interface ChronicleApiSnapshot {
  readonly id: string
  readonly narratorId: string
  readonly name: string
  readonly description: string | null
  readonly status: ChronicleApiStatus
  readonly createdAt: string
  readonly updatedAt: string
}

export interface CreateChronicleApiRequest {
  readonly name: string
  readonly description: string | null
}

export interface TransitionChronicleLifecycleApiRequest {
  readonly nextStatus:
    | 'active'
    | 'archived'
}
