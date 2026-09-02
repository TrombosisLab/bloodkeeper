import type {
  ChronicleSession,
  CreateChronicleSessionData,
  UpdateChronicleSessionData,
} from '../domain/chronicle-session.types'

export class InvalidChronicleSessionRequestError
  extends Error {
  constructor(message: string) {
    super(message)
    this.name =
      'InvalidChronicleSessionRequestError'
  }
}

export interface ChronicleSessionResponseDto {
  readonly id: string
  readonly chronicleId: string
  readonly sessionNumber: number | null
  readonly title: string | null
  readonly realDate: string | null
  readonly status:
    | 'preparation'
    | 'completed'
    | 'archived'
  readonly summary: string | null
  readonly narratorNotes: string | null
  readonly objective: string | null
  readonly plannedSummary: string | null
  readonly revision: number
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
    throw new InvalidChronicleSessionRequestError(
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
    throw new InvalidChronicleSessionRequestError(
      field + ' must be a UUID',
    )
  }

  return value
}

function optionalText(
  value: unknown,
  field: string,
): string | null {
  if (value === null) {
    return null
  }

  if (typeof value !== 'string') {
    throw new InvalidChronicleSessionRequestError(
      field + ' must be a string or null',
    )
  }

  const trimmed = value.trim()

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
    Number.isNaN(Date.parse(value))
  ) {
    throw new InvalidChronicleSessionRequestError(
      field + ' must be a valid timestamp or null',
    )
  }

  return new Date(value)
}

function optionalSessionNumber(
  value: unknown,
): number | null {
  if (value === null) {
    return null
  }

  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < 0
  ) {
    throw new InvalidChronicleSessionRequestError(
      'body.sessionNumber must be a non-negative integer or null',
    )
  }

  return value
}

const editableFields = [
  'sessionNumber',
  'title',
  'realDate',
  'summary',
  'narratorNotes',
  'objective',
  'plannedSummary',
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
    throw new InvalidChronicleSessionRequestError(
      'body contains unsupported fields',
    )
  }
}

export function parseChronicleSessionIdParam(
  value: unknown,
): string {
  return uuid(value, 'sessionId')
}

export function parseCreateChronicleSessionRequest(
  chronicleId: string,
  body: unknown,
): CreateChronicleSessionData {
  const value = record(body)
  supportedEditableKeys(value)

  return {
    chronicleId,
    sessionNumber:
      value.sessionNumber === undefined
        ? null
        : optionalSessionNumber(
            value.sessionNumber,
          ),
    title:
      value.title === undefined
        ? null
        : optionalText(
            value.title,
            'body.title',
          ),
    realDate:
      value.realDate === undefined
        ? null
        : optionalTimestamp(
            value.realDate,
            'body.realDate',
          ),
    summary:
      value.summary === undefined
        ? null
        : optionalText(
            value.summary,
            'body.summary',
          ),
    narratorNotes:
      value.narratorNotes === undefined
        ? null
        : optionalText(
            value.narratorNotes,
            'body.narratorNotes',
          ),
    objective:
      value.objective === undefined
        ? null
        : optionalText(value.objective, 'body.objective'),
    plannedSummary:
      value.plannedSummary === undefined
        ? null
        : optionalText(value.plannedSummary, 'body.plannedSummary'),
  }
}

export function parseUpdateChronicleSessionRequest(
  chronicleId: string,
  sessionId: string,
  body: unknown,
): UpdateChronicleSessionData {
  const value = record(body)
  supportedEditableKeys(value)

  if (Object.keys(value).length === 0) {
    throw new InvalidChronicleSessionRequestError(
      'body must contain at least one editable field',
    )
  }

  return {
    chronicleId,
    sessionId,
    ...(value.sessionNumber === undefined
      ? {}
      : {
          sessionNumber:
            optionalSessionNumber(
              value.sessionNumber,
            ),
        }),
    ...(value.title === undefined
      ? {}
      : {
          title:
            optionalText(
              value.title,
              'body.title',
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
    ...(value.summary === undefined
      ? {}
      : {
          summary:
            optionalText(
              value.summary,
              'body.summary',
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
    ...(value.objective === undefined
      ? {}
      : { objective: optionalText(value.objective, 'body.objective') }),
    ...(value.plannedSummary === undefined
      ? {}
      : { plannedSummary: optionalText(value.plannedSummary, 'body.plannedSummary') }),
  }
}

export function toChronicleSessionResponse(
  session: ChronicleSession,
): ChronicleSessionResponseDto {
  return {
    id: session.id,
    chronicleId: session.chronicleId,
    sessionNumber: session.sessionNumber,
    title: session.title,
    realDate:
      session.realDate === null
        ? null
        : session.realDate.toISOString(),
    status: session.status,
    summary: session.summary,
    narratorNotes: session.narratorNotes,
    objective: session.objective,
    plannedSummary: session.plannedSummary,
    revision: session.revision,
    createdAt:
      session.createdAt.toISOString(),
    updatedAt:
      session.updatedAt.toISOString(),
  }
}
