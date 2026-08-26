import type {
  ChronicleStoryMilestoneDefinition,
  ChronicleStoryMilestoneKey,
  ChronicleStoryStatus,
} from './chronicle-story.types'

export const CHRONICLE_STORY_MILESTONES = [
  { key: 'hook', label: 'Gancho', sortOrder: 0 },
  { key: 'first_turn', label: 'Primer giro', sortOrder: 1 },
  { key: 'revelation', label: 'Revelación', sortOrder: 2 },
  { key: 'climax', label: 'Clímax', sortOrder: 3 },
  { key: 'resolution', label: 'Resolución', sortOrder: 4 },
] as const satisfies readonly ChronicleStoryMilestoneDefinition[]

export function normalizeChronicleStoryTitle(value: string): string {
  const title = value.trim()
  if (title.length === 0 || title.length > 160) {
    throw new Error('Chronicle story title must contain between 1 and 160 characters')
  }
  return title
}

export function chronicleStoryProgress(
  completed: readonly ChronicleStoryMilestoneKey[],
): { readonly completed: number; readonly total: 5; readonly percentage: number } {
  const known = new Set(CHRONICLE_STORY_MILESTONES.map((item) => item.key))
  const unique = new Set(completed.filter((key) => known.has(key)))
  const count = unique.size
  return { completed: count, total: 5, percentage: count * 20 }
}

export function canEditChronicleStory(status: ChronicleStoryStatus): boolean {
  return status === 'planned' || status === 'active'
}

export function canTransitionChronicleStory(
  from: ChronicleStoryStatus,
  to: ChronicleStoryStatus,
): boolean {
  return (
    (from === 'planned' && (to === 'active' || to === 'archived')) ||
    (from === 'active' && (to === 'completed' || to === 'archived')) ||
    (from === 'completed' && to === 'archived')
  )
}
