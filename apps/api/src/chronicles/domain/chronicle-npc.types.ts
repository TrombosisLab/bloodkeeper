export type ChronicleNpcStatus =
  | 'active'
  | 'archived'

export type ChronicleNpcDetailLevel =
  'simple'

export interface ChronicleNpc {
  readonly id: string
  readonly chronicleId: string
  readonly name: string
  readonly category: string | null
  readonly description: string | null
  readonly narrativeRole: string | null
  readonly notes: string | null
  readonly status: ChronicleNpcStatus
  readonly detailLevel: ChronicleNpcDetailLevel
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface CreateChronicleNpcData {
  readonly chronicleId: string
  readonly name: string
  readonly category: string | null
  readonly description: string | null
  readonly narrativeRole: string | null
  readonly notes: string | null
}

export interface UpdateChronicleNpcData {
  readonly chronicleId: string
  readonly npcId: string
  readonly name?: string
  readonly category?: string | null
  readonly description?: string | null
  readonly narrativeRole?: string | null
  readonly notes?: string | null
}
