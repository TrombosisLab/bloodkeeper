import type {
  ChronicleLocation,
  CreateChronicleLocationData,
  UpdateChronicleLocationData,
} from '../domain/chronicle-location.types'

export class InvalidChronicleLocationRequestError
  extends Error {
  constructor(message: string) {
    super(message)
    this.name =
      'InvalidChronicleLocationRequestError'
  }
}

export interface ChronicleLocationResponseDto {
  readonly id: string
  readonly chronicleId: string
  readonly parentLocationId: string | null
  readonly name: string
  readonly category: string | null
  readonly description: string | null
  readonly narratorNotes: string | null
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
    throw new InvalidChronicleLocationRequestError(
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
    throw new InvalidChronicleLocationRequestError(
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
    throw new InvalidChronicleLocationRequestError(
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
    throw new InvalidChronicleLocationRequestError(
      `${field} must be a string or null`,
    )
  }

  const trimmed = value.trim()

  return trimmed.length === 0
    ? null
    : trimmed
}

function optionalUuid(
  value: unknown,
  field: string,
): string | null {
  if (value === null) {
    return null
  }

  return uuid(
    value,
    field,
  )
}

const editableFields = [
  'name',
  'category',
  'description',
  'narratorNotes',
  'parentLocationId',
] as const

function supportedKeys(
  value: Record<string, unknown>,
): void {
  const allowed =
    new Set<string>(editableFields)

  if (
    Object.keys(value).some(
      (key) => !allowed.has(key),
    )
  ) {
    throw new InvalidChronicleLocationRequestError(
      'body contains unsupported fields',
    )
  }
}

export function parseChronicleLocationIdParam(
  value: unknown,
): string {
  return uuid(
    value,
    'locationId',
  )
}

export function parseCreateChronicleLocationRequest(
  chronicleId: string,
  body: unknown,
): CreateChronicleLocationData {
  const value = record(body)

  supportedKeys(value)

  return {
    chronicleId,
    name: requiredText(
      value.name,
      'body.name',
    ),
    category:
      value.category === undefined
        ? null
        : optionalText(
            value.category,
            'body.category',
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
    parentLocationId:
      value.parentLocationId === undefined
        ? null
        : optionalUuid(
            value.parentLocationId,
            'body.parentLocationId',
          ),
  }
}

export function parseUpdateChronicleLocationRequest(
  chronicleId: string,
  locationId: string,
  body: unknown,
): UpdateChronicleLocationData {
  const value = record(body)

  supportedKeys(value)

  if (Object.keys(value).length === 0) {
    throw new InvalidChronicleLocationRequestError(
      'body must contain at least one editable field',
    )
  }

  return {
    chronicleId,
    locationId,
    ...(value.name === undefined
      ? {}
      : {
          name: requiredText(
            value.name,
            'body.name',
          ),
        }),
    ...(value.category === undefined
      ? {}
      : {
          category: optionalText(
            value.category,
            'body.category',
          ),
        }),
    ...(value.description === undefined
      ? {}
      : {
          description: optionalText(
            value.description,
            'body.description',
          ),
        }),
    ...(value.narratorNotes === undefined
      ? {}
      : {
          narratorNotes: optionalText(
            value.narratorNotes,
            'body.narratorNotes',
          ),
        }),
    ...(value.parentLocationId === undefined
      ? {}
      : {
          parentLocationId: optionalUuid(
            value.parentLocationId,
            'body.parentLocationId',
          ),
        }),
  }
}

export function toChronicleLocationResponse(
  location: ChronicleLocation,
): ChronicleLocationResponseDto {
  return {
    id: location.id,
    chronicleId: location.chronicleId,
    parentLocationId:
      location.parentLocationId,
    name: location.name,
    category: location.category,
    description: location.description,
    narratorNotes:
      location.narratorNotes,
    status: location.status,
    createdAt:
      location.createdAt.toISOString(),
    updatedAt:
      location.updatedAt.toISOString(),
  }
}
