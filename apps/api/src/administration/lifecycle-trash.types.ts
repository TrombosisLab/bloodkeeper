export const lifecycleTrashKinds = [
  'user',
  'participant',
  'chronicle',
  'character',
  'story',
  'session',
  'event',
  'npc',
  'location',
  'resource',
] as const

export type LifecycleTrashKind =
  (typeof lifecycleTrashKinds)[number]

export interface LifecycleTrashItem {
  readonly kind: LifecycleTrashKind
  readonly id: string
  readonly label: string
  readonly status: string
  readonly context: string | null
  readonly updatedAt: string
  readonly canRestore: boolean
  readonly canPurge: boolean
  readonly blockers: readonly string[]
}

export interface LifecycleTrashPage {
  readonly items: readonly LifecycleTrashItem[]
  readonly nextOffset: number | null
  readonly counts: Readonly<Record<LifecycleTrashKind, number>>
}

export interface LifecycleTrashDependencies {
  readonly kind: LifecycleTrashKind
  readonly id: string
  readonly label: string
  readonly canRestore: boolean
  readonly canPurge: boolean
  readonly blockers: readonly string[]
  readonly counts: Readonly<Record<string, number>>
}
