export type ChronicleStoryStatus =
  | 'planned'
  | 'active'
  | 'completed'
  | 'archived'

export type ChronicleStoryType =
  | 'main_arc'
  | 'secondary_arc'
  | 'personal_arc'

export type ChronicleStoryVisibility =
  | 'narrator_only'
  | 'chronicle_participants'

export type ChronicleStoryMilestoneKey =
  | 'hook'
  | 'first_turn'
  | 'revelation'
  | 'climax'
  | 'resolution'

export interface ChronicleStoryMilestoneDefinition {
  readonly key: ChronicleStoryMilestoneKey
  readonly label: string
  readonly sortOrder: number
}

export interface ChronicleStoryMilestoneSnapshot {
  readonly id: string
  readonly storyId: string
  readonly chronicleId: string
  readonly key: ChronicleStoryMilestoneKey
  readonly sortOrder: number
  readonly note: string | null
  readonly completedAt: Date | null
  readonly completedById: string | null
  readonly revision: number
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface ChronicleStoryReminderSnapshot {
  readonly id: string
  readonly storyId: string
  readonly chronicleId: string
  readonly text: string
  readonly sortOrder: number
  readonly resolvedAt: Date | null
  readonly revision: number
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface ChronicleStorySessionSnapshot {
  readonly id: string
  readonly sessionNumber: number | null
  readonly title: string | null
  readonly realDate: Date | null
  readonly status: string
  readonly progressNotes: string | null
}

export interface ChronicleStoryEventSnapshot {
  readonly id: string
  readonly title: string
  readonly status: string
  readonly narrativeTimeLabel: string | null
  readonly realDate: Date | null
  readonly timelineOrder: number
}

export interface ChronicleStoryCharacterSnapshot {
  readonly id: string
}

export interface ChronicleStoryNpcSnapshot {
  readonly id: string
  readonly name: string
  readonly status: string
  readonly category: string | null
  readonly narrativeRole: string | null
}

export interface ChronicleStoryLocationSnapshot {
  readonly id: string
  readonly name: string
  readonly status: string
  readonly category: string | null
  readonly parentLocationId: string | null
}

export type ChronicleStoryClosureExclusionReason =
  | 'no_eligible_attendance'

export interface ChronicleStoryCompletionSnapshot {
  readonly operationId: string
  readonly eligibleCount: number
  readonly grantedCount: number
  readonly skippedCount: number
  readonly completedAt: Date
}

export interface ChronicleStoryClosureSnapshot {
  readonly hasEligibleSession: boolean
  readonly hasPreparationSession: boolean
  readonly eligibleCharacterCount: number
  readonly excludedCharacters: readonly {
    readonly characterId: string
    readonly reason: ChronicleStoryClosureExclusionReason
  }[]
  readonly completion: ChronicleStoryCompletionSnapshot | null
}

export interface ChronicleStorySnapshot {
  readonly id: string
  readonly chronicleId: string
  readonly createdById: string
  readonly title: string
  readonly type: ChronicleStoryType
  readonly premise: string | null
  readonly stakes: string | null
  readonly resolution: string | null
  readonly narratorNotes: string | null
  readonly sharedSummary: string | null
  readonly visibility: ChronicleStoryVisibility
  readonly status: ChronicleStoryStatus
  readonly sortOrder: number
  readonly revision: number
  readonly startedAt: Date | null
  readonly completedAt: Date | null
  readonly archivedAt: Date | null
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly milestones: readonly ChronicleStoryMilestoneSnapshot[]
  readonly reminders: readonly ChronicleStoryReminderSnapshot[]
  readonly sessions: readonly ChronicleStorySessionSnapshot[]
  readonly events: readonly ChronicleStoryEventSnapshot[]
  readonly characters: readonly ChronicleStoryCharacterSnapshot[]
  readonly npcs: readonly ChronicleStoryNpcSnapshot[]
  readonly locations: readonly ChronicleStoryLocationSnapshot[]
  readonly closure: ChronicleStoryClosureSnapshot
}

export interface ChronicleStoryListQuery {
  readonly limit: number
  readonly offset: number
  readonly status?: ChronicleStoryStatus
  readonly title?: string
}

export interface CreateChronicleStoryData {
  readonly chronicleId: string
  readonly createdById: string
  readonly title: string
  readonly type: ChronicleStoryType
  readonly premise: string | null
  readonly stakes: string | null
  readonly narratorNotes: string | null
  readonly sharedSummary: string | null
  readonly visibility: ChronicleStoryVisibility
}

export interface UpdateChronicleStoryData {
  readonly chronicleId: string
  readonly storyId: string
  readonly expectedRevision: number
  readonly title?: string
  readonly type?: ChronicleStoryType
  readonly premise?: string | null
  readonly stakes?: string | null
  readonly narratorNotes?: string | null
  readonly sharedSummary?: string | null
  readonly visibility?: ChronicleStoryVisibility
}

export interface TransitionChronicleStoryData {
  readonly chronicleId: string
  readonly storyId: string
  readonly expectedRevision: number
  readonly to: 'active' | 'archived'
}

export interface UpdateChronicleStoryMilestoneData {
  readonly chronicleId: string
  readonly storyId: string
  readonly key: ChronicleStoryMilestoneKey
  readonly expectedRevision: number
  readonly actorUserId: string
  readonly completed: boolean
  readonly note?: string | null
}

export interface CreateChronicleStoryReminderData {
  readonly chronicleId: string
  readonly storyId: string
  readonly expectedRevision: number
  readonly text: string
}

export interface UpdateChronicleStoryReminderData {
  readonly chronicleId: string
  readonly storyId: string
  readonly reminderId: string
  readonly expectedRevision: number
  readonly text?: string
  readonly resolved?: boolean
}

export interface RemoveChronicleStoryReminderData {
  readonly chronicleId: string
  readonly storyId: string
  readonly reminderId: string
  readonly expectedRevision: number
}

export interface ReplaceChronicleStoryContextData {
  readonly chronicleId: string
  readonly storyId: string
  readonly expectedRevision: number
  readonly sessionIds: readonly string[]
  readonly eventIds: readonly string[]
  readonly characterIds: readonly string[]
  readonly npcIds: readonly string[]
  readonly locationIds: readonly string[]
}

export interface UpdateChronicleStorySessionProgressData {
  readonly chronicleId: string
  readonly storyId: string
  readonly sessionId: string
  readonly expectedRevision: number
  readonly progressNotes: string | null
}

export interface CompleteChronicleStoryData {
  readonly chronicleId: string
  readonly storyId: string
  readonly actorUserId: string
  readonly expectedRevision: number
  readonly operationId: string
  readonly resolution: string
}
