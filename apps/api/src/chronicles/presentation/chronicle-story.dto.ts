import {
  chronicleStoryProgress,
} from '../domain/chronicle-story.rules'
import type {
  ChronicleStoryListQuery,
  ChronicleStoryMilestoneKey,
  ChronicleStorySnapshot,
  ChronicleStoryStatus,
  ChronicleStoryType,
  ChronicleStoryVisibility,
} from '../domain/chronicle-story.types'
import type {
  CreateChronicleStoryCommand,
  UpdateChronicleStoryCommand,
} from '../application/chronicle-story.use-cases'

export class InvalidChronicleStoryRequestError
  extends Error {
  constructor(message: string) {
    super(message)
    this.name =
      'InvalidChronicleStoryRequestError'
  }
}

export interface ChronicleStoryResponseDto {
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
  readonly progress: {
    readonly completed: number
    readonly total: 5
    readonly percentage: number
  }
  readonly milestones: readonly {
    readonly id: string
    readonly key: ChronicleStoryMilestoneKey
    readonly sortOrder: number
    readonly note: string | null
    readonly completed: boolean
    readonly completedAt: string | null
    readonly completedById: string | null
    readonly revision: number
  }[]
  readonly reminders: readonly {
    readonly id: string
    readonly text: string
    readonly sortOrder: number
    readonly resolved: boolean
    readonly resolvedAt: string | null
    readonly revision: number
  }[]
  readonly sessions: readonly {
    readonly id: string
    readonly sessionNumber: number | null
    readonly title: string | null
    readonly realDate: string | null
    readonly status: string
    readonly progressNotes: string | null
  }[]
  readonly events: readonly {
    readonly id: string
    readonly title: string
    readonly status: string
    readonly narrativeTimeLabel: string | null
    readonly realDate: string | null
    readonly timelineOrder: number
  }[]
  readonly characters: readonly { readonly id: string }[]
  readonly npcs: readonly {
    readonly id: string
    readonly name: string
    readonly status: string
    readonly category: string | null
    readonly narrativeRole: string | null
  }[]
  readonly locations: readonly {
    readonly id: string
    readonly name: string
    readonly status: string
    readonly category: string | null
    readonly parentLocationId: string | null
  }[]
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

function record(
  value: unknown,
): Record<string, unknown> {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new InvalidChronicleStoryRequestError(
      'body must be an object',
    )
  }

  return value as Record<string, unknown>
}

function supportedKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
): void {
  const keys = new Set(allowed)
  if (
    Object.keys(value).some(
      (key) => !keys.has(key),
    )
  ) {
    throw new InvalidChronicleStoryRequestError(
      'body contains unsupported fields',
    )
  }
}

function uuid(
  value: unknown,
  field: string,
): string {
  if (
    typeof value !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  ) {
    throw new InvalidChronicleStoryRequestError(
      `${field} must be a UUID`,
    )
  }
  return value
}

function uuidArray(
  value: unknown,
  field: string,
  maximum = 200,
): readonly string[] {
  if (!Array.isArray(value) || value.length > maximum) {
    throw new InvalidChronicleStoryRequestError(
      `${field} must be an array with at most ${maximum} UUIDs`,
    )
  }
  const result = value.map((item) => uuid(item, field))
  if (new Set(result).size !== result.length) {
    throw new InvalidChronicleStoryRequestError(
      `${field} must not contain duplicates`,
    )
  }
  return result
}

function requiredText(
  value: unknown,
  field: string,
  maximum: number,
): string {
  if (typeof value !== 'string') {
    throw new InvalidChronicleStoryRequestError(
      `${field} must be a string`,
    )
  }
  const text = value.trim()
  if (
    text.length === 0 ||
    text.length > maximum
  ) {
    throw new InvalidChronicleStoryRequestError(
      `${field} must contain between 1 and ${maximum} characters`,
    )
  }
  return text
}

function optionalText(
  value: unknown,
  field: string,
  maximum: number,
): string | null {
  if (value === null) {
    return null
  }
  if (typeof value !== 'string') {
    throw new InvalidChronicleStoryRequestError(
      `${field} must be a string or null`,
    )
  }
  const text = value.trim()
  if (text.length > maximum) {
    throw new InvalidChronicleStoryRequestError(
      `${field} must not exceed ${maximum} characters`,
    )
  }
  return text.length === 0
    ? null
    : text
}

function revision(
  value: unknown,
): number {
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < 1
  ) {
    throw new InvalidChronicleStoryRequestError(
      'body.expectedRevision must be a positive integer',
    )
  }
  return value
}

function storyType(
  value: unknown,
): ChronicleStoryType {
  if (
    value !== 'main_arc' &&
    value !== 'secondary_arc' &&
    value !== 'personal_arc'
  ) {
    throw new InvalidChronicleStoryRequestError(
      'body.type is invalid',
    )
  }
  return value
}

function visibility(
  value: unknown,
): ChronicleStoryVisibility {
  if (
    value !== 'narrator_only' &&
    value !== 'chronicle_participants'
  ) {
    throw new InvalidChronicleStoryRequestError(
      'body.visibility is invalid',
    )
  }
  return value
}

export function parseChronicleStoryIdParam(
  value: unknown,
): string {
  return uuid(value, 'storyId')
}

export function parseChronicleStoryReminderIdParam(
  value: unknown,
): string {
  return uuid(value, 'reminderId')
}

export function parseChronicleStorySessionIdParam(
  value: unknown,
): string {
  return uuid(value, 'sessionId')
}

export function parseChronicleStoryMilestoneKeyParam(
  value: unknown,
): ChronicleStoryMilestoneKey {
  if (
    value !== 'hook' &&
    value !== 'first_turn' &&
    value !== 'revelation' &&
    value !== 'climax' &&
    value !== 'resolution'
  ) {
    throw new InvalidChronicleStoryRequestError(
      'milestoneKey is invalid',
    )
  }
  return value
}

export function parseChronicleStoryFilters(
  input: Record<string, unknown> | undefined,
  pagination: {
    readonly limit: number
    readonly offset: number
  },
): ChronicleStoryListQuery {
  const status = input?.status
  if (
    status !== undefined &&
    status !== 'planned' &&
    status !== 'active' &&
    status !== 'completed' &&
    status !== 'archived'
  ) {
    throw new InvalidChronicleStoryRequestError(
      'query.status is invalid',
    )
  }

  const rawTitle = input?.title
  if (
    rawTitle !== undefined &&
    typeof rawTitle !== 'string'
  ) {
    throw new InvalidChronicleStoryRequestError(
      'query.title must be a string',
    )
  }
  const title =
    typeof rawTitle === 'string'
      ? rawTitle.trim()
      : ''
  if (title.length > 160) {
    throw new InvalidChronicleStoryRequestError(
      'query.title must not exceed 160 characters',
    )
  }

  return {
    ...pagination,
    ...(status === undefined
      ? {}
      : {
          status:
            status as ChronicleStoryStatus,
        }),
    ...(title.length === 0
      ? {}
      : { title }),
  }
}

export function parseCreateChronicleStoryRequest(
  chronicleId: string,
  body: unknown,
): CreateChronicleStoryCommand {
  const value = record(body)
  supportedKeys(value, [
    'title',
    'type',
    'premise',
    'stakes',
    'narratorNotes',
    'sharedSummary',
    'visibility',
  ])

  return {
    chronicleId,
    title: requiredText(
      value.title,
      'body.title',
      160,
    ),
    type:
      value.type === undefined
        ? 'main_arc'
        : storyType(value.type),
    premise:
      value.premise === undefined
        ? null
        : optionalText(
            value.premise,
            'body.premise',
            4000,
          ),
    stakes:
      value.stakes === undefined
        ? null
        : optionalText(
            value.stakes,
            'body.stakes',
            4000,
          ),
    narratorNotes:
      value.narratorNotes === undefined
        ? null
        : optionalText(
            value.narratorNotes,
            'body.narratorNotes',
            12000,
          ),
    sharedSummary:
      value.sharedSummary === undefined
        ? null
        : optionalText(
            value.sharedSummary,
            'body.sharedSummary',
            8000,
          ),
    visibility:
      value.visibility === undefined
        ? 'narrator_only'
        : visibility(value.visibility),
  }
}

export function parseUpdateChronicleStoryRequest(
  chronicleId: string,
  storyId: string,
  body: unknown,
): UpdateChronicleStoryCommand {
  const value = record(body)
  const fields = [
    'expectedRevision',
    'title',
    'type',
    'premise',
    'stakes',
    'narratorNotes',
    'sharedSummary',
    'visibility',
  ] as const
  supportedKeys(value, fields)
  if (
    Object.keys(value).every(
      (key) => key === 'expectedRevision',
    )
  ) {
    throw new InvalidChronicleStoryRequestError(
      'body must contain an editable field',
    )
  }

  return {
    chronicleId,
    storyId,
    expectedRevision:
      revision(value.expectedRevision),
    ...(value.title === undefined
      ? {}
      : {
          title: requiredText(
            value.title,
            'body.title',
            160,
          ),
        }),
    ...(value.type === undefined
      ? {}
      : { type: storyType(value.type) }),
    ...(value.premise === undefined
      ? {}
      : {
          premise: optionalText(
            value.premise,
            'body.premise',
            4000,
          ),
        }),
    ...(value.stakes === undefined
      ? {}
      : {
          stakes: optionalText(
            value.stakes,
            'body.stakes',
            4000,
          ),
        }),
    ...(value.narratorNotes === undefined
      ? {}
      : {
          narratorNotes: optionalText(
            value.narratorNotes,
            'body.narratorNotes',
            12000,
          ),
        }),
    ...(value.sharedSummary === undefined
      ? {}
      : {
          sharedSummary: optionalText(
            value.sharedSummary,
            'body.sharedSummary',
            8000,
          ),
        }),
    ...(value.visibility === undefined
      ? {}
      : {
          visibility:
            visibility(value.visibility),
        }),
  }
}

export function parseStoryRevisionRequest(
  body: unknown,
): number {
  const value = record(body)
  supportedKeys(value, ['expectedRevision'])
  if (Object.keys(value).length !== 1) {
    throw new InvalidChronicleStoryRequestError(
      'body must contain only expectedRevision',
    )
  }
  return revision(value.expectedRevision)
}

export function parseCompleteChronicleStoryRequest(
  body: unknown,
): {
  readonly expectedRevision: number
  readonly operationId: string
  readonly resolution: string
  readonly confirmed: true
} {
  const value = record(body)
  supportedKeys(value, [
    'expectedRevision',
    'operationId',
    'resolution',
    'confirmed',
  ])
  if (value.confirmed !== true) {
    throw new InvalidChronicleStoryRequestError(
      'body.confirmed must be true',
    )
  }
  return {
    expectedRevision: revision(value.expectedRevision),
    operationId: uuid(value.operationId, 'body.operationId'),
    resolution: requiredText(value.resolution, 'body.resolution', 8000),
    confirmed: true,
  }
}

export function parseUpdateStoryMilestoneRequest(
  body: unknown,
): {
  readonly expectedRevision: number
  readonly completed: boolean
  readonly note?: string | null
} {
  const value = record(body)
  supportedKeys(value, [
    'expectedRevision',
    'completed',
    'note',
  ])
  if (typeof value.completed !== 'boolean') {
    throw new InvalidChronicleStoryRequestError(
      'body.completed must be boolean',
    )
  }
  return {
    expectedRevision:
      revision(value.expectedRevision),
    completed: value.completed,
    ...(value.note === undefined
      ? {}
      : {
          note: optionalText(
            value.note,
            'body.note',
            2000,
          ),
        }),
  }
}

export function parseCreateStoryReminderRequest(
  body: unknown,
): {
  readonly expectedRevision: number
  readonly text: string
} {
  const value = record(body)
  supportedKeys(value, [
    'expectedRevision',
    'text',
  ])
  return {
    expectedRevision:
      revision(value.expectedRevision),
    text: requiredText(
      value.text,
      'body.text',
      500,
    ),
  }
}

export function parseUpdateStoryReminderRequest(
  body: unknown,
): {
  readonly expectedRevision: number
  readonly text?: string
  readonly resolved?: boolean
} {
  const value = record(body)
  supportedKeys(value, [
    'expectedRevision',
    'text',
    'resolved',
  ])
  if (
    value.text === undefined &&
    value.resolved === undefined
  ) {
    throw new InvalidChronicleStoryRequestError(
      'body must contain text or resolved',
    )
  }
  if (
    value.resolved !== undefined &&
    typeof value.resolved !== 'boolean'
  ) {
    throw new InvalidChronicleStoryRequestError(
      'body.resolved must be boolean',
    )
  }
  return {
    expectedRevision:
      revision(value.expectedRevision),
    ...(value.text === undefined
      ? {}
      : {
          text: requiredText(
            value.text,
            'body.text',
            500,
          ),
        }),
    ...(value.resolved === undefined
      ? {}
      : { resolved: value.resolved }),
  }
}

export function parseReplaceStoryContextRequest(
  body: unknown,
): {
  readonly expectedRevision: number
  readonly sessionIds: readonly string[]
  readonly eventIds: readonly string[]
  readonly characterIds: readonly string[]
  readonly npcIds: readonly string[]
  readonly locationIds: readonly string[]
} {
  const value = record(body)
  supportedKeys(value, [
    'expectedRevision',
    'sessionIds',
    'eventIds',
    'characterIds',
    'npcIds',
    'locationIds',
  ])
  return {
    expectedRevision: revision(value.expectedRevision),
    sessionIds: uuidArray(value.sessionIds, 'body.sessionIds'),
    eventIds: uuidArray(value.eventIds, 'body.eventIds'),
    characterIds: uuidArray(value.characterIds, 'body.characterIds'),
    npcIds: uuidArray(value.npcIds, 'body.npcIds'),
    locationIds: uuidArray(value.locationIds, 'body.locationIds'),
  }
}

export function parseUpdateStorySessionProgressRequest(
  body: unknown,
): {
  readonly expectedRevision: number
  readonly progressNotes: string | null
} {
  const value = record(body)
  supportedKeys(value, ['expectedRevision', 'progressNotes'])
  return {
    expectedRevision: revision(value.expectedRevision),
    progressNotes: optionalText(
      value.progressNotes,
      'body.progressNotes',
      2000,
    ),
  }
}

export function toChronicleStoryResponse(
  story: ChronicleStorySnapshot,
): ChronicleStoryResponseDto {
  const completedKeys =
    story.milestones
      .filter(
        (milestone) =>
          milestone.completedAt !== null,
      )
      .map((milestone) => milestone.key)

  return {
    id: story.id,
    chronicleId: story.chronicleId,
    createdById: story.createdById,
    title: story.title,
    type: story.type,
    premise: story.premise,
    stakes: story.stakes,
    resolution: story.resolution,
    narratorNotes: story.narratorNotes,
    sharedSummary: story.sharedSummary,
    visibility: story.visibility,
    status: story.status,
    sortOrder: story.sortOrder,
    revision: story.revision,
    progress:
      chronicleStoryProgress(
        completedKeys,
      ),
    milestones:
      story.milestones.map(
        (milestone) => ({
          id: milestone.id,
          key: milestone.key,
          sortOrder:
            milestone.sortOrder,
          note: milestone.note,
          completed:
            milestone.completedAt !== null,
          completedAt:
            milestone.completedAt === null
              ? null
              : milestone.completedAt.toISOString(),
          completedById:
            milestone.completedById,
          revision: milestone.revision,
        }),
      ),
    reminders:
      story.reminders.map(
        (reminder) => ({
          id: reminder.id,
          text: reminder.text,
          sortOrder: reminder.sortOrder,
          resolved:
            reminder.resolvedAt !== null,
          resolvedAt:
            reminder.resolvedAt === null
              ? null
              : reminder.resolvedAt.toISOString(),
          revision: reminder.revision,
        }),
      ),
    sessions: story.sessions.map((session) => ({
      ...session,
      realDate: session.realDate === null
        ? null
        : session.realDate.toISOString(),
    })),
    events: story.events.map((event) => ({
      ...event,
      realDate: event.realDate === null
        ? null
        : event.realDate.toISOString(),
    })),
    characters: story.characters,
    npcs: story.npcs,
    locations: story.locations,
    counts: {
      sessions: story.sessions.length,
      events: story.events.length,
      characters: story.characters.length,
      npcs: story.npcs.length,
      locations: story.locations.length,
    },
    closure: {
      ...story.closure,
      completion: story.closure.completion === null
        ? null
        : {
            ...story.closure.completion,
            completedAt: story.closure.completion.completedAt.toISOString(),
          },
    },
    startedAt:
      story.startedAt === null
        ? null
        : story.startedAt.toISOString(),
    completedAt:
      story.completedAt === null
        ? null
        : story.completedAt.toISOString(),
    archivedAt:
      story.archivedAt === null
        ? null
        : story.archivedAt.toISOString(),
    createdAt: story.createdAt.toISOString(),
    updatedAt: story.updatedAt.toISOString(),
  }
}


export interface SharedChronicleStoryResponseDto {
  readonly id: string
  readonly chronicleId: string
  readonly title: string
  readonly type: ChronicleStoryType
  readonly sharedSummary: string | null
  readonly status: ChronicleStoryStatus
  readonly progress: {
    readonly completed: number
    readonly total: 5
    readonly percentage: number
  }
  readonly milestones: readonly {
    readonly key: ChronicleStoryMilestoneKey
    readonly sortOrder: number
    readonly completed: boolean
    readonly completedAt: string | null
  }[]
  readonly sessionIds: readonly string[]
  readonly startedAt: string | null
  readonly completedAt: string | null
  readonly createdAt: string
  readonly updatedAt: string
}

export function toSharedChronicleStoryResponse(
  story: ChronicleStorySnapshot,
): SharedChronicleStoryResponseDto {
  const completedKeys = story.milestones
    .filter((milestone) => milestone.completedAt !== null)
    .map((milestone) => milestone.key)

  return {
    id: story.id,
    chronicleId: story.chronicleId,
    title: story.title,
    type: story.type,
    sharedSummary: story.sharedSummary,
    status: story.status,
    progress: chronicleStoryProgress(completedKeys),
    milestones: story.milestones.map((milestone) => ({
      key: milestone.key,
      sortOrder: milestone.sortOrder,
      completed: milestone.completedAt !== null,
      completedAt: milestone.completedAt === null
        ? null
        : milestone.completedAt.toISOString(),
    })),
    sessionIds: story.sessions.map((session) => session.id),
    startedAt: story.startedAt === null
      ? null
      : story.startedAt.toISOString(),
    completedAt: story.completedAt === null
      ? null
      : story.completedAt.toISOString(),
    createdAt: story.createdAt.toISOString(),
    updatedAt: story.updatedAt.toISOString(),
  }
}
