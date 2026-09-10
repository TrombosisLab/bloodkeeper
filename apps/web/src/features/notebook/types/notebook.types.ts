export type NotebookVisibility = 'PRIVATE' | 'CHRONICLE' | 'SELECTED_PLAYERS'
export type ResourceType = 'NPC' | 'LOCATION' | 'ORGANIZATION' | 'ARTIFACT' | 'DOCUMENT' | 'SESSION'
export type NotebookReference = { readonly id: string; readonly targetType: string; readonly targetId: string; readonly label: string | null }
export type NotebookPlayer = { readonly id: string; readonly displayName: string; readonly username: string }
export type NotebookNote = {
  readonly id: string; readonly sessionId: string | null; readonly title: string; readonly content: string
  readonly visibility: NotebookVisibility; readonly pinned: boolean; readonly tags: readonly string[]
  readonly canEdit: boolean; readonly updatedAt: string; readonly author: NotebookPlayer
  readonly audienceUserIds: readonly string[]
  readonly session: { readonly title: string | null; readonly sessionNumber: number | null } | null
  readonly references: readonly NotebookReference[]
}
export type NotebookPage = { readonly items: readonly NotebookNote[]; readonly canManage: boolean; readonly viewerUserId: string }
export type NotebookContextNpc = { readonly id: string; readonly name: string; readonly category: string | null; readonly description: string | null; readonly narrativeRole: string | null; readonly detailLevel: string }
export type NotebookContextLocation = { readonly id: string; readonly name: string; readonly category: string | null; readonly description: string | null; readonly parentLocationId: string | null; readonly imageUrl?: string }
export type NotebookContext = {
  readonly npcs: readonly NotebookContextNpc[]; readonly locations: readonly NotebookContextLocation[]
  readonly resources: readonly { id: string; kind: 'ORGANIZATION' | 'ARTIFACT' | 'DOCUMENT'; name: string; summary: string | null; visibility: string; locationId: string | null }[]
  readonly players: readonly NotebookPlayer[]; readonly viewerUserId: string
}
export type NotebookResourcePreview = {
  readonly id: string; readonly targetType: string; readonly targetId: string; readonly label: string
  readonly category: string; readonly status: string; readonly description: string | null
  readonly narrativeRole: string | null; readonly detailLevel: string | number | null
  readonly metrics: { readonly appearances: number | null; readonly histories: number | null }
  readonly narratorDetails: string | null; readonly privateNotice: string
  readonly deepProfile: unknown; readonly metadata: unknown; readonly canViewPrivateDetails: boolean
  readonly sessionDate: string | null; readonly sessionNumber: number | null; readonly parentLocationId: string | null
  readonly imageUrl: string | null
}
