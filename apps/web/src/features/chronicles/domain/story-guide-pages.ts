import type { ChronicleStoryGuide, ChronicleStoryGuideCard } from '../types/chronicle-story-api.types'

export const FIRST_GUIDE_PAGE = '00000000-0000-4000-8000-000000000001'

export function normalizeGuidePages(guide: ChronicleStoryGuide): ChronicleStoryGuide {
  const pages = guide.pages?.length ? guide.pages : [{ id: FIRST_GUIDE_PAGE, title: 'Inicio' }]
  return {
    ...guide,
    pages,
    cards: guide.cards.map((card) => ({ ...card, pageId: card.pageId ?? pages[0]!.id })),
  }
}

export function guidePageCards(guide: ChronicleStoryGuide, pageId: string) {
  return guide.cards.flatMap((card) => {
    if (card.pageId === pageId) return [card]
    const appearance = card.appearances?.find((item) => item.pageId === pageId)
    return appearance ? [{ ...card, x: appearance.x, y: appearance.y }] : []
  })
}

export function guidePageConnections(guide: ChronicleStoryGuide, pageId: string) {
  const cards = new Set(guidePageCards(guide, pageId).map((card) => card.id))
  return guide.connections.filter((connection) =>
    cards.has(connection.from) && cards.has(connection.to))
}

export function guideCardPages(card: ChronicleStoryGuideCard): readonly string[] {
  return [card.pageId ?? FIRST_GUIDE_PAGE, ...(card.appearances ?? []).map((item) => item.pageId)]
}

export function updateGuideCardPosition(guide: ChronicleStoryGuide, cardId: string, pageId: string, x: number, y: number): ChronicleStoryGuide {
  return {
    ...guide,
    cards: guide.cards.map((card) => card.id !== cardId ? card : card.pageId === pageId
      ? { ...card, x, y }
      : { ...card, appearances: card.appearances?.map((item) => item.pageId === pageId ? { ...item, x, y } : item) }),
  }
}

export function continueGuideOnNewPage(guide: ChronicleStoryGuide, cardId: string, sourcePageId: string, newPageId: string, title: string): ChronicleStoryGuide {
  const card = guide.cards.find((item) => item.id === cardId)
  const pages = guide.pages ?? []
  if (!card || !guideCardPages(card).includes(sourcePageId) || pages.length >= 30 ||
    pages.some((page) => page.id === newPageId) || !title.trim() || title.trim().length > 80) {
    throw new Error('Invalid guide continuation')
  }
  return {
    ...guide,
    pages: [...pages, { id: newPageId, title: title.trim() }],
    cards: guide.cards.map((item) => item.id !== cardId ? item : {
      ...item,
      appearances: [...(item.appearances ?? []), { pageId: newPageId, sourcePageId, x: 32, y: 32 }],
    }),
  }
}

export function removeGuideCardAppearance(guide: ChronicleStoryGuide, cardId: string, pageId: string): ChronicleStoryGuide {
  return {
    ...guide,
    cards: guide.cards.map((card) => card.id !== cardId || card.pageId === pageId ? card : {
      ...card,
      appearances: card.appearances?.filter((item) => item.pageId !== pageId)
        .map((item) => item.sourcePageId === pageId ? { ...item, sourcePageId: card.pageId ?? FIRST_GUIDE_PAGE } : item),
    }),
  }
}
