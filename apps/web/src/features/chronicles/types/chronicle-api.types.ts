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

export type ChronicleParticipantApiRole =
  | 'narrator'
  | 'player'

export type ChronicleParticipantApiStatus =
  | 'active'
  | 'retired'

export interface ChronicleParticipantApiSnapshot {
  readonly id: string
  readonly chronicleId: string
  readonly userId: string
  readonly username: string
  readonly displayName: string
  readonly role: ChronicleParticipantApiRole
  readonly status: ChronicleParticipantApiStatus
  readonly createdAt: string
  readonly updatedAt: string
}

export interface ChronicleParticipantCandidateApiSnapshot {
  readonly id: string
  readonly username: string
  readonly displayName: string
}

export interface ChronicleCharacterApiSummary {
  readonly characterId: string
  readonly ownerId: string
  readonly chronicleId: string
  readonly status:
    | 'draft'
    | 'active'
    | 'archived'
  readonly name: string
  readonly concept: string | null
  readonly updatedAt: string
}

export interface AddChronicleParticipantApiRequest {
  readonly userId: string
  readonly role: ChronicleParticipantApiRole
}

export type ChronicleNpcApiStatus =
  | 'active'
  | 'archived'

export interface ChronicleNpcApiSnapshot {
  readonly id: string
  readonly chronicleId: string
  readonly name: string
  readonly category: string | null
  readonly description: string | null
  readonly narrativeRole: string | null
  readonly notes: string | null
  readonly status: ChronicleNpcApiStatus
  readonly detailLevel: 'simple'
  readonly createdAt: string
  readonly updatedAt: string
}

export interface CreateChronicleNpcApiRequest {
  readonly name: string
  readonly category: string | null
  readonly description: string | null
  readonly narrativeRole: string | null
  readonly notes: string | null
}

export interface UpdateChronicleNpcApiRequest {
  readonly name?: string
  readonly category?: string | null
  readonly description?: string | null
  readonly narrativeRole?: string | null
  readonly notes?: string | null
}

export type ChronicleLocationApiStatus =
  | 'active'
  | 'archived'

export interface ChronicleLocationApiSnapshot {
  readonly id: string
  readonly chronicleId: string
  readonly parentLocationId: string | null
  readonly name: string
  readonly category: string | null
  readonly description: string | null
  readonly narratorNotes: string | null
  readonly status: ChronicleLocationApiStatus
  readonly createdAt: string
  readonly updatedAt: string
}

export interface CreateChronicleLocationApiRequest {
  readonly name: string
  readonly category: string | null
  readonly description: string | null
  readonly narratorNotes: string | null
  readonly parentLocationId: string | null
}

export interface UpdateChronicleLocationApiRequest {
  readonly name?: string
  readonly category?: string | null
  readonly description?: string | null
  readonly narratorNotes?: string | null
  readonly parentLocationId?: string | null
}
