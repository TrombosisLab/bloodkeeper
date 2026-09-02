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

export interface ChronicleNpcAttributesApiSnapshot { readonly strength:number; readonly dexterity:number; readonly stamina:number; readonly charisma:number; readonly manipulation:number; readonly composure:number; readonly intelligence:number; readonly wits:number; readonly resolve:number }

export interface ChronicleNpcDisciplineApiSnapshot { readonly name:string; readonly rating:number; readonly powers:readonly string[] }

export interface ChronicleNpcDeepProfileApiSnapshot { readonly alias:string|null; readonly clan:string|null; readonly generation:string|null; readonly sire:string|null; readonly sect:string|null; readonly title:string|null; readonly territory:string|null; readonly domain:string|null; readonly faction:string|null; readonly influence:number; readonly resources:number; readonly traits:readonly string[]; readonly disciplines:readonly string[]; readonly attributes:ChronicleNpcAttributesApiSnapshot; readonly disciplineDetails:readonly ChronicleNpcDisciplineApiSnapshot[]; readonly allies:readonly string[]; readonly rivals:readonly string[]; readonly history:string|null }

export interface ChronicleNpcApiSnapshot {
  readonly id: string
  readonly chronicleId: string
  readonly name: string
  readonly category: string | null
  readonly description: string | null
  readonly narrativeRole: string | null
  readonly notes: string | null
  readonly status: ChronicleNpcApiStatus
  readonly detailLevel: 'simple' | 'deep'
  readonly deepProfile: ChronicleNpcDeepProfileApiSnapshot | null
  readonly createdAt: string
  readonly updatedAt: string
}

export interface CreateChronicleNpcApiRequest {
  readonly name: string
  readonly category: string | null
  readonly description: string | null
  readonly narrativeRole: string | null
  readonly notes: string | null
  readonly deepProfile?: ChronicleNpcDeepProfileApiSnapshot | null
}

export interface UpdateChronicleNpcApiRequest {
  readonly name?: string
  readonly category?: string | null
  readonly description?: string | null
  readonly narrativeRole?: string | null
  readonly notes?: string | null
  readonly deepProfile?: ChronicleNpcDeepProfileApiSnapshot | null
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

export type ChronicleEventApiStatus =
  | 'active'
  | 'archived'

export interface ChronicleEventApiSnapshot {
  readonly id: string
  readonly chronicleId: string
  readonly title: string
  readonly description: string | null
  readonly narratorNotes: string | null
  readonly narrativeTimeLabel: string | null
  readonly realDate: string | null
  readonly timelineOrder: number
  readonly status: ChronicleEventApiStatus
  readonly createdAt: string
  readonly updatedAt: string
}

export interface CreateChronicleEventApiRequest {
  readonly title: string
  readonly description: string | null
  readonly narratorNotes: string | null
  readonly narrativeTimeLabel: string | null
  readonly realDate: string | null
}

export interface UpdateChronicleEventApiRequest {
  readonly title?: string
  readonly description?: string | null
  readonly narratorNotes?: string | null
  readonly narrativeTimeLabel?: string | null
  readonly realDate?: string | null
}

export interface ReorderChronicleEventsApiRequest {
  readonly eventIds: readonly string[]
}

export interface ChronicleSessionAttendanceApiSnapshot {
  readonly id: string
  readonly sessionId: string
  readonly characterId: string
  readonly createdAt: string
  readonly updatedAt: string
}

export interface ChronicleSessionAttendanceApiPage {
  readonly items:
    readonly ChronicleSessionAttendanceApiSnapshot[]
  readonly nextOffset: number | null
}

export interface AddChronicleSessionAttendanceApiRequest {
  readonly characterId: string
}

export interface ChronicleSessionAttendanceRemovalApiResponse {
  readonly sessionId: string
  readonly characterId: string
  readonly attending: false
}

export interface ChronicleSessionContextEventApiSnapshot {
  readonly id: string
  readonly title: string
  readonly status:
    | 'active'
    | 'archived'
  readonly narrativeTimeLabel: string | null
  readonly realDate: string | null
  readonly timelineOrder: number
}

export interface ChronicleSessionContextNpcApiSnapshot {
  readonly id: string
  readonly name: string
  readonly status:
    | 'active'
    | 'archived'
  readonly category: string | null
  readonly narrativeRole: string | null
}

export interface ChronicleSessionContextLocationApiSnapshot {
  readonly id: string
  readonly name: string
  readonly status:
    | 'active'
    | 'archived'
  readonly category: string | null
  readonly parentLocationId: string | null
}

export interface ChronicleSessionContextResourceApiSnapshot {
  readonly id: string
  readonly kind: 'document' | 'artifact' | 'organization'
  readonly name: string
  readonly summary: string | null
  readonly status: 'active' | 'archived'
  readonly visibility: 'narrator_only' | 'chronicle_participants'
}

export interface ChronicleSessionContextApiSnapshot {
  readonly sessionId: string
  readonly events:
    readonly ChronicleSessionContextEventApiSnapshot[]
  readonly npcs:
    readonly ChronicleSessionContextNpcApiSnapshot[]
  readonly locations:
    readonly ChronicleSessionContextLocationApiSnapshot[]
  readonly resources:
    readonly ChronicleSessionContextResourceApiSnapshot[]
}

export interface ReplaceChronicleSessionContextApiRequest {
  readonly eventIds: readonly string[]
  readonly npcIds: readonly string[]
  readonly locationIds: readonly string[]
  readonly resourceIds?: readonly string[]
}


export type ChronicleSessionApiStatus =
  | 'preparation'
  | 'completed'
  | 'archived'

export interface ChronicleSessionApiSnapshot {
  readonly id: string
  readonly chronicleId: string
  readonly sessionNumber: number | null
  readonly title: string | null
  readonly realDate: string | null
  readonly status: ChronicleSessionApiStatus
  readonly summary: string | null
  readonly narratorNotes: string | null
  readonly createdAt: string
  readonly updatedAt: string
}

export interface CreateChronicleSessionApiRequest {
  readonly sessionNumber: number | null
  readonly title: string | null
  readonly realDate: string | null
  readonly summary: string | null
  readonly narratorNotes: string | null
}

export interface UpdateChronicleSessionApiRequest {
  readonly sessionNumber?: number | null
  readonly title?: string | null
  readonly realDate?: string | null
  readonly summary?: string | null
  readonly narratorNotes?: string | null
}

export interface ChronicleListQuery {
  readonly limit?: number
  readonly offset?: number
}

export interface ChronicleApiPage {
  readonly items:
    readonly ChronicleApiSnapshot[]
  readonly nextOffset: number | null
}

export interface ChronicleParticipantApiPage {
  readonly items:
    readonly ChronicleParticipantApiSnapshot[]
  readonly nextOffset: number | null
}

export interface ChronicleCharacterApiPage {
  readonly items:
    readonly ChronicleCharacterApiSummary[]
  readonly nextOffset: number | null
}

export interface ChronicleNpcApiPage {
  readonly items:
    readonly ChronicleNpcApiSnapshot[]
  readonly nextOffset: number | null
}

export interface ChronicleLocationApiPage {
  readonly items:
    readonly ChronicleLocationApiSnapshot[]
  readonly nextOffset: number | null
}

export interface ChronicleSessionApiPage {
  readonly items:
    readonly ChronicleSessionApiSnapshot[]
  readonly nextOffset: number | null
}


export interface ChronicleEventApiPage {
  readonly items:
    readonly ChronicleEventApiSnapshot[]
  readonly nextOffset: number | null
}


export interface ChronicleParticipantCandidateApiPage {
  readonly items:
    readonly ChronicleParticipantCandidateApiSnapshot[]
  readonly nextOffset: number | null
}
