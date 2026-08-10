import type {
  ChronicleEvent,
  CreateChronicleEventData,
  ReorderChronicleEventsData,
  UpdateChronicleEventData,
} from '../domain/chronicle-event.types'

export class InvalidChronicleEventRequestError
  extends Error {
  constructor(message: string) {
    super(message)
    this.name =
      'InvalidChronicleEventRequestError'
  }
}

export interface ChronicleEventResponseDto {
  readonly id: string
  readonly chronicleId: string
  readonly title: string
  readonly description: string | null
  readonly narratorNotes: string | null
  readonly narrativeTimeLabel: string | null
  readonly realDate: string | null
  readonly timelineOrder: number
  readonly status: 'active' | 'archived'
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
    throw new InvalidChronicleEventRequestError(
      'body must be an object',
    )
  }

  return value as Record<string, unknown>
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
    throw new InvalidChronicleEventRequestError(
      `${field} must be a UUID`,
    )
  }

  return value
}

function requiredText(
  value: unknown,
  field: string,
): string {
  if (
    typeof value !== 'string' ||
    value.trim().length === 0
  ) {
    throw new InvalidChronicleEventRequestError(
      `${field} must be a non-empty string`,
    )
  }

  return value.trim()
}

function optionalText(
  value: unknown,
  field: string,
): string | null {
  if (value === null) {
    return null
  }

  if (typeof value !== 'string') {
    throw new InvalidChronicleEventRequestError(
      `${field} must be a string or null`,
    )
  }

  const trimmed =
    value.trim()

  return trimmed.length === 0
    ? null
    : trimmed
}

function optionalTimestamp(
  value: unknown,
  field: string,
): Date | null {
  if (value === null) {
    return null
  }

  if (
    typeof value !== 'string' ||
    Number.isNaN(
      Date.parse(value),
    )
  ) {
    throw new InvalidChronicleEventRequestError(
      `${field} must be a valid timestamp or null`,
    )
  }

  return new Date(value)
}

const editableFields = [
  'title',
  'description',
  'narratorNotes',
  'narrativeTimeLabel',
  'realDate',
] as const

function supportedEditableKeys(
  value: Record<string, unknown>,
): void {
  const allowed =
    new Set<string>(editableFields)

  if (
    Object.keys(value).some(
      (key) => !allowed.has(key),
    )
  ) {
    throw new InvalidChronicleEventRequestError(
      'body contains unsupported fields',
    )
  }
}

export function parseChronicleEventIdParam(
  value: unknown,
): string {
  return uuid(
    value,
    'eventId',
  )
}

export function parseCreateChronicleEventRequest(
  chronicleId: string,
  body: unknown,
): CreateChronicleEventData {
  const value =
    record(body)

  supportedEditableKeys(value)

  return {
    chronicleId,
    title: requiredText(
      value.title,
      'body.title',
    ),
    description:
      value.description === undefined
        ? null
        : optionalText(
            value.description,
            'body.description',
          ),
    narratorNotes:
      value.narratorNotes === undefined
        ? null
        : optionalText(
            value.narratorNotes,
            'body.narratorNotes',
          ),
    narrativeTimeLabel:
      value.narrativeTimeLabel === undefined
        ? null
        : optionalText(
            value.narrativeTimeLabel,
            'body.narrativeTimeLabel',
          ),
    realDate:
      value.realDate === undefined
        ? null
        : optionalTimestamp(
            value.realDate,
            'body.realDate',
          ),
  }
}

export function parseUpdateChronicleEventRequest(
  chronicleId: string,
  eventId: string,
  body: unknown,
): UpdateChronicleEventData {
  const value =
    record(body)

  supportedEditableKeys(value)

  if (Object.keys(value).length === 0) {
    throw new InvalidChronicleEventRequestError(
      'body must contain at least one editable field',
    )
  }

  return {
    chronicleId,
    eventId,
    ...(value.title === undefined
      ? {}
      : {
          title: requiredText(
            value.title,
            'body.title',
          ),
        }),
    ...(value.description === undefined
      ? {}
      : {
          description:
            optionalText(
              value.description,
              'body.description',
            ),
        }),
    ...(value.narratorNotes === undefined
      ? {}
      : {
          narratorNotes:
            optionalText(
              value.narratorNotes,
              'body.narratorNotes',
            ),
        }),
    ...(value.narrativeTimeLabel === undefined
      ? {}
      : {
          narrativeTimeLabel:
            optionalText(
              value.narrativeTimeLabel,
              'body.narrativeTimeLabel',
            ),
        }),
    ...(value.realDate === undefined
      ? {}
      : {
          realDate:
            optionalTimestamp(
              value.realDate,
              'body.realDate',
            ),
        }),
  }
}

export function parseReorderChronicleEventsRequest(
  chronicleId: string,
  body: unknown,
): ReorderChronicleEventsData {
  const value =
    record(body)

  if (
    Object.keys(value).length !== 1 ||
    !Object.hasOwn(
      value,
      'eventIds',
    )
  ) {
    throw new InvalidChronicleEventRequestError(
      'body must contain only eventIds',
    )
  }

  if (!Array.isArray(value.eventIds)) {
    throw new InvalidChronicleEventRequestError(
      'body.eventIds must be an array',
    )
  }

  const eventIds =
    value.eventIds.map(
      (eventId, index) =>
        uuid(
          eventId,
          `body.eventIds[${index}]`,
        ),
    )

  if (
    new Set(eventIds).size !==
    eventIds.length
  ) {
    throw new InvalidChronicleEventRequestError(
      'body.eventIds must not contain duplicates',
    )
  }

  return {
    chronicleId,
    eventIds,
  }
}

export function toChronicleEventResponse(
  event: ChronicleEvent,
): ChronicleEventResponseDto {
  return {
    id: event.id,
    chronicleId: event.chronicleId,
    title: event.title,
    description: event.description,
    narratorNotes: event.narratorNotes,
    narrativeTimeLabel:
      event.narrativeTimeLabel,
    realDate:
      event.realDate === null
        ? null
        : event.realDate.toISOString(),
    timelineOrder:
      event.timelineOrder,
    status: event.status,
    createdAt:
      event.createdAt.toISOString(),
    updatedAt:
      event.updatedAt.toISOString(),
  }
}
