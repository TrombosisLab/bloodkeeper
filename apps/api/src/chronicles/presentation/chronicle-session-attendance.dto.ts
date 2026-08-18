import type {
  ChronicleSessionAttendance,
} from '../domain/chronicle-session-attendance.types'

export class InvalidChronicleSessionAttendanceRequestError
  extends Error {
  constructor(message: string) {
    super(message)
    this.name =
      'InvalidChronicleSessionAttendanceRequestError'
  }
}

export interface ChronicleSessionAttendanceResponseDto {
  readonly id: string
  readonly sessionId: string
  readonly characterId: string
  readonly createdAt: string
  readonly updatedAt: string
}

export interface ChronicleSessionAttendanceRemovalResponseDto {
  readonly sessionId: string
  readonly characterId: string
  readonly attending: false
}

function record(
  value: unknown,
): Record<string, unknown> {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new InvalidChronicleSessionAttendanceRequestError(
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
    throw new InvalidChronicleSessionAttendanceRequestError(
      `${field} must be a UUID`,
    )
  }

  return value
}

export function parseChronicleSessionAttendanceCharacterIdParam(
  value: unknown,
): string {
  return uuid(
    value,
    'characterId',
  )
}

export function parseAddChronicleSessionAttendanceRequest(
  body: unknown,
): string {
  const value = record(body)

  if (
    Object.keys(value).length !== 1 ||
    !Object.hasOwn(value, 'characterId')
  ) {
    throw new InvalidChronicleSessionAttendanceRequestError(
      'body must contain only characterId',
    )
  }

  return uuid(
    value.characterId,
    'body.characterId',
  )
}

export function toChronicleSessionAttendanceResponse(
  attendance:
    ChronicleSessionAttendance,
): ChronicleSessionAttendanceResponseDto {
  return {
    id: attendance.id,
    sessionId: attendance.sessionId,
    characterId: attendance.characterId,
    createdAt:
      attendance.createdAt.toISOString(),
    updatedAt:
      attendance.updatedAt.toISOString(),
  }
}
