export type ChronicleLocationStatus =
  | 'active'
  | 'archived'

export interface ChronicleLocation {
  readonly id: string
  readonly chronicleId: string
  readonly parentLocationId: string | null
  readonly name: string
  readonly category: string | null
  readonly description: string | null
  readonly narratorNotes: string | null
  readonly status: ChronicleLocationStatus
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface CreateChronicleLocationData {
  readonly chronicleId: string
  readonly parentLocationId: string | null
  readonly name: string
  readonly category: string | null
  readonly description: string | null
  readonly narratorNotes: string | null
}

export interface UpdateChronicleLocationData {
  readonly chronicleId: string
  readonly locationId: string
  readonly parentLocationId?: string | null
  readonly name?: string
  readonly category?: string | null
  readonly description?: string | null
  readonly narratorNotes?: string | null
}
