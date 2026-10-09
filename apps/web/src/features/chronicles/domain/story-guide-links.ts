import type { ChronicleStoryApiSnapshot, ChronicleStoryGuideCard } from '../types/chronicle-story-api.types.ts'

export type StoryGuideLink = NonNullable<ChronicleStoryGuideCard['storyLinks']>[number]

export function resolveStoryGuideLink(stories: readonly ChronicleStoryApiSnapshot[], link: StoryGuideLink) {
  const story = stories.find((item) => item.id === link.storyId)
  const card = link.cardId === undefined ? undefined : story?.narratorGuide?.cards.find((item) => item.id === link.cardId)
  const available = story !== undefined && (link.cardId === undefined || card !== undefined)
  return { story, card, available, label: story === undefined ? 'Historia no disponible' : `${story.title} · ${link.cardId === undefined ? 'Inicio del guion' : card?.title ?? 'Tarjeta no disponible'}` }
}
