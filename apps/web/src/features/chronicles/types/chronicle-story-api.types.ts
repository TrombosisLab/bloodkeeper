export type ChronicleStoryApiStatus =
  | 'planned'
  | 'active'
  | 'completed'
  | 'archived'

export type ChronicleStoryApiType =
  | 'main_arc'
  | 'secondary_arc'
  | 'personal_arc'

export type ChronicleStoryApiVisibility =
  | 'narrator_only'
  | 'chronicle_participants'

export type ChronicleStoryMilestoneApiKey =
  | 'hook'
  | 'first_turn'
  | 'revelation'
  | 'climax'
  | 'resolution'

export interface ChronicleStoryApiSnapshot {
  readonly id: string
  readonly chronicleId: string
  readonly createdById: string
  readonly title: string
  readonly type: ChronicleStoryApiType
  readonly premise: string | null
  readonly stakes: string | null
  readonly resolution: string | null
  readonly narratorNotes: string | null
  readonly sharedSummary: string | null
  readonly visibility: ChronicleStoryApiVisibility
  readonly status: ChronicleStoryApiStatus
  readonly sortOrder: number
  readonly revision: number
  readonly progress: {
    readonly completed: number
    readonly total: 5
    readonly percentage: number
  }
  readonly milestones: readonly ChronicleStoryMilestoneApiSnapshot[]
  readonly reminders: readonly ChronicleStoryReminderApiSnapshot[]
  readonly sessions: readonly ChronicleStorySessionApiSnapshot[]
  readonly events: readonly ChronicleStoryEventApiSnapshot[]
  readonly characters: readonly { readonly id: string }[]
  readonly npcs: readonly ChronicleStoryNpcApiSnapshot[]
  readonly locations: readonly ChronicleStoryLocationApiSnapshot[]
  readonly counts: {
    readonly sessions: number
    readonly events: number
    readonly characters: number
    readonly npcs: number
    readonly locations: number
  }
  readonly closure: {
    readonly hasEligibleSession: boolean
    readonly hasPreparationSession: boolean
    readonly eligibleCharacterCount: number
    readonly excludedCharacters: readonly {
      readonly characterId: string
      readonly reason: 'no_eligible_attendance'
    }[]
    readonly completion: null | {
      readonly operationId: string
      readonly eligibleCount: number
      readonly grantedCount: number
      readonly skippedCount: number
      readonly completedAt: string
    }
  }
  readonly startedAt: string | null
  readonly completedAt: string | null
  readonly archivedAt: string | null
  readonly createdAt: string
  readonly updatedAt: string
}

export interface ChronicleStoryMilestoneApiSnapshot {
  readonly id: string
  readonly key: ChronicleStoryMilestoneApiKey
  readonly sortOrder: number
  readonly note: string | null
  readonly completed: boolean
  readonly completedAt: string | null
  readonly completedById: string | null
  readonly revision: number
}

export interface ChronicleStoryReminderApiSnapshot {
  readonly id: string
  readonly text: string
  readonly sortOrder: number
  readonly resolved: boolean
  readonly resolvedAt: string | null
  readonly revision: number
}

export interface ChronicleStorySessionApiSnapshot {
  readonly id: string
  readonly sessionNumber: number | null
  readonly title: string | null
  readonly realDate: string | null
  readonly status: string
  readonly progressNotes: string | null
}

export interface ChronicleStoryEventApiSnapshot {
  readonly id: string
  readonly title: string
  readonly status: string
  readonly narrativeTimeLabel: string | null
  readonly realDate: string | null
  readonly timelineOrder: number
}

export interface ChronicleStoryNpcApiSnapshot {
  readonly id: string
  readonly name: string
  readonly status: string
  readonly category: string | null
  readonly narrativeRole: string | null
}

export interface ChronicleStoryLocationApiSnapshot {
  readonly id: string
  readonly name: string
  readonly status: string
  readonly category: string | null
  readonly parentLocationId: string | null
}

export interface ChronicleStoryApiPage {
  readonly items: readonly ChronicleStoryApiSnapshot[]
  readonly nextOffset: number | null
}

export interface CreateChronicleStoryApiRequest {
  readonly title: string
  readonly type: ChronicleStoryApiType
  readonly premise: string | null
  readonly stakes: string | null
  readonly narratorNotes: string | null
  readonly sharedSummary: string | null
  readonly visibility: ChronicleStoryApiVisibility
}

export interface UpdateChronicleStoryApiRequest {
  readonly expectedRevision: number
  readonly title?: string
  readonly type?: ChronicleStoryApiType
  readonly premise?: string | null
  readonly stakes?: string | null
  readonly narratorNotes?: string | null
  readonly sharedSummary?: string | null
  readonly visibility?: ChronicleStoryApiVisibility
}

export interface ReplaceChronicleStoryContextApiRequest {
  readonly expectedRevision: number
  readonly sessionIds: readonly string[]
  readonly eventIds: readonly string[]
  readonly characterIds: readonly string[]
  readonly npcIds: readonly string[]
  readonly locationIds: readonly string[]
}

export interface CompleteChronicleStoryApiRequest {
  readonly expectedRevision: number
  readonly operationId: string
  readonly resolution: string
  readonly confirmed: true
}


export interface ChronicleSharedStoryApiSnapshot {
  readonly id: string
  readonly chronicleId: string
  readonly title: string
  readonly type: ChronicleStoryApiType
  readonly sharedSummary: string | null
  readonly status: ChronicleStoryApiStatus
  readonly progress: {
    readonly completed: number
    readonly total: 5
    readonly percentage: number
  }
  readonly milestones: readonly {
    readonly key: ChronicleStoryMilestoneApiKey
    readonly sortOrder: number
    readonly completed: boolean
    readonly completedAt: string | null
  }[]
  readonly startedAt: string | null
  readonly completedAt: string | null
  readonly createdAt: string
  readonly updatedAt: string
}

export interface ChronicleSharedStoryApiPage {
  readonly items: readonly ChronicleSharedStoryApiSnapshot[]
  readonly nextOffset: number | null
}
