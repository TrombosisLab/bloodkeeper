import type {
  ChronicleNpc,
  CreateChronicleNpcData,
  UpdateChronicleNpcData,
} from '../domain/chronicle-npc.types'

export class InvalidChronicleNpcRequestError
  extends Error {
  constructor(message: string) {
    super(message)
    this.name =
      'InvalidChronicleNpcRequestError'
  }
}

export interface ChronicleNpcResponseDto {
  readonly id: string
  readonly chronicleId: string
  readonly name: string
  readonly category: string | null
  readonly description: string | null
  readonly narrativeRole: string | null
  readonly notes: string | null
  readonly status: 'active' | 'archived'
  readonly detailLevel: 'simple'
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
    throw new InvalidChronicleNpcRequestError(
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
    throw new InvalidChronicleNpcRequestError(
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
    throw new InvalidChronicleNpcRequestError(
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
    throw new InvalidChronicleNpcRequestError(
      `${field} must be a string or null`,
    )
  }

  const trimmed = value.trim()

  return trimmed.length === 0
    ? null
    : trimmed
}

const editableFields = [
  'name',
  'category',
  'description',
  'narrativeRole',
  'notes',
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
    throw new InvalidChronicleNpcRequestError(
      'body contains unsupported fields',
    )
  }
}

export function parseChronicleNpcIdParam(
  value: unknown,
): string {
  return uuid(value, 'npcId')
}

export function parseCreateChronicleNpcRequest(
  chronicleId: string,
  body: unknown,
): CreateChronicleNpcData {
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
    narrativeRole:
      value.narrativeRole === undefined
        ? null
        : optionalText(
            value.narrativeRole,
            'body.narrativeRole',
          ),
    notes:
      value.notes === undefined
        ? null
        : optionalText(
            value.notes,
            'body.notes',
          ),
  }
}

export function parseUpdateChronicleNpcRequest(
  chronicleId: string,
  npcId: string,
  body: unknown,
): UpdateChronicleNpcData {
  const value = record(body)

  supportedKeys(value)

  if (Object.keys(value).length === 0) {
    throw new InvalidChronicleNpcRequestError(
      'body must contain at least one editable field',
    )
  }

  return {
    chronicleId,
    npcId,
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
    ...(value.narrativeRole === undefined
      ? {}
      : {
          narrativeRole: optionalText(
            value.narrativeRole,
            'body.narrativeRole',
          ),
        }),
    ...(value.notes === undefined
      ? {}
      : {
          notes: optionalText(
            value.notes,
            'body.notes',
          ),
        }),
  }
}

export function toChronicleNpcResponse(
  npc: ChronicleNpc,
): ChronicleNpcResponseDto {
  return {
    id: npc.id,
    chronicleId: npc.chronicleId,
    name: npc.name,
    category: npc.category,
    description: npc.description,
    narrativeRole:
      npc.narrativeRole,
    notes: npc.notes,
    status: npc.status,
    detailLevel: npc.detailLevel,
    createdAt:
      npc.createdAt.toISOString(),
    updatedAt:
      npc.updatedAt.toISOString(),
  }
}
