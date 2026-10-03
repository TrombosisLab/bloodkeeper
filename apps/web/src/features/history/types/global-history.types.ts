export type GlobalHistoryCategory =
  | 'event'
  | 'era'
  | 'person'
  | 'organization'
  | 'place'
  | 'other'

export type GlobalHistorySourceKind =
  | 'canon'
  | 'custom'
  | 'alternate'

export type GlobalHistoryVisibility =
  | 'all_users'
  | 'narrators_only'
  | 'private'

export type GlobalHistoryStatus =
  | 'draft'
  | 'published'
  | 'archived'

export interface GlobalHistoryChronicle {
  readonly id: string
  readonly name: string
}

export interface GlobalHistoryAuthor {
  readonly id: string
  readonly displayName: string
}

export interface GlobalHistoryEntry {
  readonly references: readonly HistoryReference[]
  readonly imageCaption: string | null
  readonly imageCredit: string | null
  readonly imageUpdatedAt: string | null
  readonly id: string
  readonly title: string
  readonly periodLabel: string | null
  readonly startYear: number | null
  readonly endYear: number | null
  readonly category: GlobalHistoryCategory
  readonly summary: string | null
  readonly content: string
  readonly sourceKind: GlobalHistorySourceKind
  readonly visibility: GlobalHistoryVisibility
  readonly status: GlobalHistoryStatus
  readonly tags: readonly string[]
  readonly author: GlobalHistoryAuthor
  readonly chronicles: readonly GlobalHistoryChronicle[]
  readonly canEdit: boolean
  readonly createdAt: string
  readonly updatedAt: string
}

export interface GlobalHistoryList {
  readonly canManage: boolean
  readonly availableChronicles:
    readonly GlobalHistoryChronicle[]
  readonly items: readonly GlobalHistoryEntry[]
}

export interface GlobalHistoryEntryInput {
  readonly references: readonly HistoryReference[]
  readonly imageCaption: string | null
  readonly imageCredit: string | null
  readonly title: string
  readonly periodLabel: string | null
  readonly startYear: number | null
  readonly endYear: number | null
  readonly category: GlobalHistoryCategory
  readonly summary: string | null
  readonly content: string
  readonly sourceKind: GlobalHistorySourceKind
  readonly visibility: GlobalHistoryVisibility
  readonly status: Exclude<
    GlobalHistoryStatus,
    'archived'
  >
  readonly tags: readonly string[]
  readonly chronicleIds: readonly string[]
}

export interface HistoryReference {
  readonly key: string
  readonly type: 'resource' | 'character' | 'npc' | 'location'
  readonly id: string
  readonly label: string
  readonly category?: string
}
