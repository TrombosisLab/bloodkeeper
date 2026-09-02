import type {
  ChronicleSharedStoryApiPage,
  ChronicleSharedStoryApiSnapshot,
  ChronicleStoryApiPage,
  ChronicleStoryApiSnapshot,
  ChronicleStoryMilestoneApiKey,
  CreateChronicleStoryApiRequest,
  CompleteChronicleStoryApiRequest,
  ReplaceChronicleStoryContextApiRequest,
  UpdateChronicleStoryApiRequest,
} from '../types/chronicle-story-api.types'

type FetchImplementation = typeof globalThis.fetch
type UnknownRecord = Record<string, unknown>

export class ChronicleStoryApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code)
    this.name = 'ChronicleStoryApiError'
  }
}

function record(value: unknown): UnknownRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ChronicleStoryApiError(502, 'INVALID_CHRONICLE_STORY_RESPONSE')
  }
  return value as UnknownRecord
}

function nullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

function parseStory(value: unknown): ChronicleStoryApiSnapshot {
  const item = record(value)
  if (
    typeof item.id !== 'string' ||
    typeof item.chronicleId !== 'string' ||
    typeof item.createdById !== 'string' ||
    typeof item.title !== 'string' ||
    !['main_arc', 'secondary_arc', 'personal_arc'].includes(String(item.type)) ||
    !['planned', 'active', 'completed', 'archived'].includes(String(item.status)) ||
    !['narrator_only', 'chronicle_participants'].includes(String(item.visibility)) ||
    !nullableString(item.premise) ||
    !nullableString(item.stakes) ||
    !nullableString(item.resolution) ||
    !nullableString(item.narratorNotes) ||
    !nullableString(item.sharedSummary) ||
    typeof item.sortOrder !== 'number' ||
    typeof item.revision !== 'number' ||
    !Array.isArray(item.milestones) ||
    !(item.sessionIds === undefined || Array.isArray(item.sessionIds)) ||
    !Array.isArray(item.reminders) ||
    !Array.isArray(item.sessions) ||
    !Array.isArray(item.events) ||
    !Array.isArray(item.characters) ||
    !Array.isArray(item.npcs) ||
    !Array.isArray(item.locations)
    || typeof item.closure !== 'object'
    || item.closure === null
  ) {
    throw new ChronicleStoryApiError(502, 'INVALID_CHRONICLE_STORY_RESPONSE')
  }
  return {
    ...item,
    sessionIds: Array.isArray(item.sessionIds) ? item.sessionIds : [],
  } as unknown as ChronicleStoryApiSnapshot
}

function parseSharedStory(value: unknown): ChronicleSharedStoryApiSnapshot {
  const item = record(value)
  if (
    typeof item.id !== 'string' ||
    typeof item.chronicleId !== 'string' ||
    typeof item.title !== 'string' ||
    !['main_arc', 'secondary_arc', 'personal_arc'].includes(String(item.type)) ||
    !['planned', 'active', 'completed', 'archived'].includes(String(item.status)) ||
    !nullableString(item.sharedSummary) ||
    typeof item.progress !== 'object' ||
    item.progress === null ||
    !Array.isArray(item.milestones) ||
    !nullableString(item.startedAt) ||
    !nullableString(item.completedAt) ||
    typeof item.createdAt !== 'string' ||
    typeof item.updatedAt !== 'string'
  ) {
    throw new ChronicleStoryApiError(502, 'INVALID_SHARED_CHRONICLE_STORY_RESPONSE')
  }
  return {
    ...item,
    sessionIds: Array.isArray(item.sessionIds) ? item.sessionIds : [],
  } as unknown as ChronicleSharedStoryApiSnapshot
}

async function responseError(response: Response): Promise<ChronicleStoryApiError> {
  let code = `HTTP_${response.status}`
  try {
    const body = record(await response.json())
    if (typeof body.code === 'string') code = body.code
  } catch {
    // El estado HTTP conserva el diagnóstico mínimo.
  }
  return new ChronicleStoryApiError(response.status, code)
}

async function json(response: Response): Promise<unknown> {
  if (!response.ok) throw await responseError(response)
  return response.json()
}

function request(method: string, body?: unknown): RequestInit {
  return {
    method,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }
}

export interface ChronicleStoryGateway {
  list(chronicleId: string, query?: { readonly title?: string; readonly status?: string }): Promise<ChronicleStoryApiPage>
  listShared(chronicleId: string, query?: { readonly title?: string; readonly status?: string }): Promise<ChronicleSharedStoryApiPage>
  create(chronicleId: string, body: CreateChronicleStoryApiRequest): Promise<ChronicleStoryApiSnapshot>
  update(chronicleId: string, storyId: string, body: UpdateChronicleStoryApiRequest): Promise<ChronicleStoryApiSnapshot>
  activate(chronicleId: string, storyId: string, expectedRevision: number): Promise<ChronicleStoryApiSnapshot>
  archive(chronicleId: string, storyId: string, expectedRevision: number): Promise<ChronicleStoryApiSnapshot>
  milestone(chronicleId: string, storyId: string, key: ChronicleStoryMilestoneApiKey, body: { readonly expectedRevision: number; readonly completed: boolean; readonly note?: string | null }): Promise<ChronicleStoryApiSnapshot>
  addReminder(chronicleId: string, storyId: string, body: { readonly expectedRevision: number; readonly text: string }): Promise<ChronicleStoryApiSnapshot>
  updateReminder(chronicleId: string, storyId: string, reminderId: string, body: { readonly expectedRevision: number; readonly text?: string; readonly resolved?: boolean }): Promise<ChronicleStoryApiSnapshot>
  removeReminder(chronicleId: string, storyId: string, reminderId: string, expectedRevision: number): Promise<ChronicleStoryApiSnapshot>
  replaceContext(chronicleId: string, storyId: string, body: ReplaceChronicleStoryContextApiRequest): Promise<ChronicleStoryApiSnapshot>
  updateSessionProgress(chronicleId: string, storyId: string, sessionId: string, body: { readonly expectedRevision: number; readonly progressNotes: string | null }): Promise<ChronicleStoryApiSnapshot>
  complete(chronicleId: string, storyId: string, body: CompleteChronicleStoryApiRequest): Promise<ChronicleStoryApiSnapshot>
}

export function createChronicleStoryGateway(
  fetchImplementation: FetchImplementation = globalThis.fetch,
): ChronicleStoryGateway {
  const base = (chronicleId: string) => `/api/chronicles/${chronicleId}/stories`
  const parsed = async (promise: Promise<Response>) => parseStory(await json(await promise))

  return {
    async list(chronicleId, query = {}) {
      const items: ChronicleStoryApiSnapshot[] = []
      let offset: number | null = 0
      while (offset !== null) {
        const parameters = new URLSearchParams({ limit: '50', offset: String(offset) })
        if (query.title !== undefined && query.title.trim().length > 0) parameters.set('title', query.title.trim())
        if (query.status !== undefined && query.status.length > 0) parameters.set('status', query.status)
        const value = record(await json(await fetchImplementation(`${base(chronicleId)}?${parameters}`, request('GET'))))
        if (!Array.isArray(value.items) || !(value.nextOffset === null || typeof value.nextOffset === 'number')) {
          throw new ChronicleStoryApiError(502, 'INVALID_CHRONICLE_STORY_RESPONSE')
        }
        items.push(...value.items.map(parseStory))
        offset = value.nextOffset
      }
      return { items, nextOffset: null }
    },
    async listShared(chronicleId, query = {}) {
      const items: ChronicleSharedStoryApiSnapshot[] = []
      let offset: number | null = 0
      while (offset !== null) {
        const parameters = new URLSearchParams({ limit: '50', offset: String(offset) })
        if (query.title !== undefined && query.title.trim().length > 0) parameters.set('title', query.title.trim())
        if (query.status !== undefined && query.status.length > 0) parameters.set('status', query.status)
        const value = record(await json(await fetchImplementation(`${base(chronicleId)}/shared?${parameters}`, request('GET'))))
        if (!Array.isArray(value.items) || !(value.nextOffset === null || typeof value.nextOffset === 'number')) {
          throw new ChronicleStoryApiError(502, 'INVALID_SHARED_CHRONICLE_STORY_RESPONSE')
        }
        items.push(...value.items.map(parseSharedStory))
        offset = value.nextOffset
      }
      return { items, nextOffset: null }
    },
    create: (chronicleId, body) => parsed(fetchImplementation(base(chronicleId), request('POST', body))),
    update: (chronicleId, storyId, body) => parsed(fetchImplementation(`${base(chronicleId)}/${storyId}`, request('PATCH', body))),
    activate: (chronicleId, storyId, expectedRevision) => parsed(fetchImplementation(`${base(chronicleId)}/${storyId}/activate`, request('POST', { expectedRevision }))),
    archive: (chronicleId, storyId, expectedRevision) => parsed(fetchImplementation(`${base(chronicleId)}/${storyId}/archive`, request('POST', { expectedRevision }))),
    milestone: (chronicleId, storyId, key, body) => parsed(fetchImplementation(`${base(chronicleId)}/${storyId}/milestones/${key}`, request('PATCH', body))),
    addReminder: (chronicleId, storyId, body) => parsed(fetchImplementation(`${base(chronicleId)}/${storyId}/reminders`, request('POST', body))),
    updateReminder: (chronicleId, storyId, reminderId, body) => parsed(fetchImplementation(`${base(chronicleId)}/${storyId}/reminders/${reminderId}`, request('PATCH', body))),
    removeReminder: (chronicleId, storyId, reminderId, expectedRevision) => parsed(fetchImplementation(`${base(chronicleId)}/${storyId}/reminders/${reminderId}`, request('DELETE', { expectedRevision }))),
    replaceContext: (chronicleId, storyId, body) => parsed(fetchImplementation(`${base(chronicleId)}/${storyId}/context`, request('PUT', body))),
    updateSessionProgress: (chronicleId, storyId, sessionId, body) => parsed(fetchImplementation(`${base(chronicleId)}/${storyId}/sessions/${sessionId}`, request('PATCH', body))),
    complete: (chronicleId, storyId, body) => parsed(fetchImplementation(`${base(chronicleId)}/${storyId}/complete`, request('POST', body))),
  }
}
