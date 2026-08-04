import type {
  Chronicle,
  CreateChronicleData,
} from '../domain/chronicle.types'

type UnknownRecord =
  Record<string, unknown>

export interface CreateChronicleRequestDto {
  readonly name: string
  readonly description?: string | null
}

export interface ChronicleResponseDto {
  readonly id: string
  readonly narratorId: string
  readonly name: string
  readonly description: string | null
  readonly status:
    | 'preparation'
    | 'active'
    | 'archived'
  readonly createdAt: string
  readonly updatedAt: string
}

export class InvalidChronicleRequestError
  extends Error {
  constructor(
    path: string,
    expectation: string,
  ) {
    super(`${path} ${expectation}`)
    this.name =
      'InvalidChronicleRequestError'
  }
}

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function record(
  value: unknown,
  path: string,
): UnknownRecord {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new InvalidChronicleRequestError(
      path,
      'must be an object',
    )
  }

  return value as UnknownRecord
}

function onlyKeys(
  value: UnknownRecord,
  keys: readonly string[],
  path: string,
): void {
  const allowed = new Set(keys)

  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new InvalidChronicleRequestError(
        `${path}.${key}`,
        'is not allowed',
      )
    }
  }
}

function required(
  value: UnknownRecord,
  key: string,
  path: string,
): unknown {
  if (!Object.hasOwn(value, key)) {
    throw new InvalidChronicleRequestError(
      `${path}.${key}`,
      'is required',
    )
  }

  return value[key]
}

function stringValue(
  value: unknown,
  path: string,
): string {
  if (typeof value !== 'string') {
    throw new InvalidChronicleRequestError(
      path,
      'must be a string',
    )
  }

  return value
}

function uuid(
  value: unknown,
  path: string,
): string {
  const parsed = stringValue(value, path)

  if (!uuidPattern.test(parsed)) {
    throw new InvalidChronicleRequestError(
      path,
      'must be a UUID',
    )
  }

  return parsed
}

export function parseChronicleNarratorId(
  input: unknown,
): string {
  return uuid(
    input,
    'request.user.id',
  )
}

export function parseCreateChronicleRequest(
  narratorIdInput: unknown,
  input: unknown,
): CreateChronicleData {
  const narratorId =
    parseChronicleNarratorId(
      narratorIdInput,
    )
  const body = record(input, 'body')

  onlyKeys(
    body,
    ['name', 'description'],
    'body',
  )

  const name = stringValue(
    required(body, 'name', 'body'),
    'body.name',
  )

  const descriptionInput =
    Object.hasOwn(body, 'description')
      ? body.description
      : null

  if (
    descriptionInput !== null &&
    typeof descriptionInput !== 'string'
  ) {
    throw new InvalidChronicleRequestError(
      'body.description',
      'must be a string or null',
    )
  }

  return {
    narratorId,
    name,
    description: descriptionInput,
  }
}

export function toChronicleResponse(
  chronicle: Chronicle,
): ChronicleResponseDto {
  return {
    id: chronicle.id,
    narratorId: chronicle.narratorId,
    name: chronicle.name,
    description: chronicle.description,
    status: chronicle.status,
    createdAt:
      chronicle.createdAt.toISOString(),
    updatedAt:
      chronicle.updatedAt.toISOString(),
  }
}
