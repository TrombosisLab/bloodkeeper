export type ChronicleNpcStatus =
  | 'active'
  | 'archived'

export type ChronicleNpcDetailLevel =
  | 'simple'
  | 'deep'

export interface ChronicleNpcAttributes {
  readonly strength: number
  readonly dexterity: number
  readonly stamina: number
  readonly charisma: number
  readonly manipulation: number
  readonly composure: number
  readonly intelligence: number
  readonly wits: number
  readonly resolve: number
}

export interface ChronicleNpcDiscipline {
  readonly name: string
  readonly rating: number
  readonly powers: readonly string[]
}

export interface ChronicleNpcDeepProfile {
  readonly alias: string | null
  readonly clan: string | null
  readonly generation: string | null
  readonly sire: string | null
  readonly sect: string | null
  readonly title: string | null
  readonly territory: string | null
  readonly domain: string | null
  readonly faction: string | null
  readonly influence: number
  readonly resources: number
  readonly traits: readonly string[]
  readonly disciplines: readonly string[]
  readonly attributes: ChronicleNpcAttributes
  readonly disciplineDetails: readonly ChronicleNpcDiscipline[]
  readonly allies: readonly string[]
  readonly rivals: readonly string[]
  readonly history: string | null
}

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
  readonly deepProfile: ChronicleNpcDeepProfile | null
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
  readonly deepProfile?: ChronicleNpcDeepProfile | null
}

export interface UpdateChronicleNpcData {
  readonly chronicleId: string
  readonly npcId: string
  readonly name?: string
  readonly category?: string | null
  readonly description?: string | null
  readonly narrativeRole?: string | null
  readonly notes?: string | null
  readonly deepProfile?: ChronicleNpcDeepProfile | null
}
