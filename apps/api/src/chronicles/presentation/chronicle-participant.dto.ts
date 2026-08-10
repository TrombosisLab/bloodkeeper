import type {
  AddChronicleParticipantData,
  ChronicleParticipant,
  ChronicleParticipantRole,
  ChronicleParticipantStatus,
} from '../domain/chronicle-participant.types'

export class InvalidChronicleParticipantRequestError
  extends Error {
  constructor(message: string) {
    super(message)
    this.name =
      'InvalidChronicleParticipantRequestError'
  }
}

export interface ChronicleParticipantResponseDto {
  readonly id: string
  readonly chronicleId: string
  readonly userId: string
  readonly username: string
  readonly displayName: string
  readonly role: ChronicleParticipantRole
  readonly status: ChronicleParticipantStatus
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
    throw new InvalidChronicleParticipantRequestError(
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
    throw new InvalidChronicleParticipantRequestError(
      `${field} must be a UUID`,
    )
  }

  return value
}

export function parseParticipantIdParam(
  value: unknown,
): string {
  return uuid(
    value,
    'participantId',
  )
}

export function parseAddChronicleParticipantRequest(
  chronicleId: string,
  body: unknown,
): AddChronicleParticipantData {
  const value = record(body)
  const keys = Object.keys(value)

  if (
    keys.some(
      (key) =>
        key !== 'userId' &&
        key !== 'role',
    )
  ) {
    throw new InvalidChronicleParticipantRequestError(
      'body contains unsupported fields',
    )
  }

  const userId =
    uuid(
      value.userId,
      'body.userId',
    )

  if (
    value.role !== 'narrator' &&
    value.role !== 'player'
  ) {
    throw new InvalidChronicleParticipantRequestError(
      'body.role must be narrator or player',
    )
  }

  return {
    chronicleId,
    userId,
    role: value.role,
  }
}

export function toChronicleParticipantResponse(
  participant: ChronicleParticipant,
): ChronicleParticipantResponseDto {
  return {
    id: participant.id,
    chronicleId:
      participant.chronicleId,
    userId: participant.userId,
    username: participant.username,
    displayName:
      participant.displayName,
    role: participant.role,
    status: participant.status,
    createdAt:
      participant.createdAt.toISOString(),
    updatedAt:
      participant.updatedAt.toISOString(),
  }
}
