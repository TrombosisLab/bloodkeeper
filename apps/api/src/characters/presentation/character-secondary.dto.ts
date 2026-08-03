import type {
  CharacterInventoryItemStatus,
  PersistedCharacterHistoryEntry,
  PersistedCharacterInventoryItem,
  PersistedCharacterNote,
  PersistedCharacterSecondaryData,
  UpdateCharacterSecondaryData,
} from '../domain/persisted-character-secondary.types'

type UnknownRecord = Record<string, unknown>

export type CharacterSecondaryResponseDto =
  PersistedCharacterSecondaryData

type WithoutCharacterId<T> =
  T extends unknown
    ? Omit<T, 'characterId'>
    : never

export type UpdateCharacterSecondaryRequestDto =
  WithoutCharacterId<UpdateCharacterSecondaryData>

export class InvalidCharacterSecondaryRequestError
  extends Error {
  constructor(path: string, expectation: string) {
    super(`${path} ${expectation}`)
    this.name =
      'InvalidCharacterSecondaryRequestError'
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
    throw new InvalidCharacterSecondaryRequestError(
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
      throw new InvalidCharacterSecondaryRequestError(
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
    throw new InvalidCharacterSecondaryRequestError(
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
    throw new InvalidCharacterSecondaryRequestError(
      path,
      'must be a string',
    )
  }

  return value
}

function nullableString(
  value: unknown,
  path: string,
): string | null {
  return value === null
    ? null
    : stringValue(value, path)
}

function integer(
  value: unknown,
  path: string,
): number {
  if (!Number.isInteger(value)) {
    throw new InvalidCharacterSecondaryRequestError(
      path,
      'must be an integer',
    )
  }

  return value as number
}

function positiveInteger(
  value: unknown,
  path: string,
): number {
  const parsed = integer(value, path)

  if (parsed < 1) {
    throw new InvalidCharacterSecondaryRequestError(
      path,
      'must be greater than zero',
    )
  }

  return parsed
}

function uuid(value: unknown, path: string): string {
  const parsed = stringValue(value, path)

  if (!uuidPattern.test(parsed)) {
    throw new InvalidCharacterSecondaryRequestError(
      path,
      'must be a UUID',
    )
  }

  return parsed
}

function arrayValue(
  value: unknown,
  path: string,
): unknown[] {
  if (!Array.isArray(value)) {
    throw new InvalidCharacterSecondaryRequestError(
      path,
      'must be an array',
    )
  }

  return value
}

function oneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
  path: string,
): T {
  const parsed = stringValue(value, path)

  if (!allowed.includes(parsed as T)) {
    throw new InvalidCharacterSecondaryRequestError(
      path,
      'contains an unsupported value',
    )
  }

  return parsed as T
}

function parseInventory(
  input: unknown,
  path: string,
): PersistedCharacterInventoryItem[] {
  return arrayValue(input, path).map(
    (inputItem, index) => {
      const itemPath = `${path}[${index}]`
      const item = record(inputItem, itemPath)
      const keys = [
        'id',
        'name',
        'quantity',
        'description',
        'category',
        'notes',
        'status',
      ] as const

      onlyKeys(item, keys, itemPath)

      return {
        id: uuid(
          required(item, 'id', itemPath),
          `${itemPath}.id`,
        ),
        name: stringValue(
          required(item, 'name', itemPath),
          `${itemPath}.name`,
        ),
        quantity: integer(
          required(item, 'quantity', itemPath),
          `${itemPath}.quantity`,
        ),
        description: nullableString(
          required(item, 'description', itemPath),
          `${itemPath}.description`,
        ),
        category: nullableString(
          required(item, 'category', itemPath),
          `${itemPath}.category`,
        ),
        notes: nullableString(
          required(item, 'notes', itemPath),
          `${itemPath}.notes`,
        ),
        status: oneOf<
          CharacterInventoryItemStatus
        >(
          required(item, 'status', itemPath),
          ['active', 'archived'],
          `${itemPath}.status`,
        ),
      }
    },
  )
}

function parseNotes(
  input: unknown,
  path: string,
): PersistedCharacterNote[] {
  return arrayValue(input, path).map(
    (inputNote, index) => {
      const notePath = `${path}[${index}]`
      const note = record(inputNote, notePath)

      onlyKeys(note, ['id', 'content'], notePath)

      return {
        id: uuid(
          required(note, 'id', notePath),
          `${notePath}.id`,
        ),
        content: stringValue(
          required(note, 'content', notePath),
          `${notePath}.content`,
        ),
      }
    },
  )
}

function parseHistory(
  input: unknown,
  path: string,
): PersistedCharacterHistoryEntry[] {
  return arrayValue(input, path).map(
    (inputEntry, index) => {
      const entryPath = `${path}[${index}]`
      const entry = record(inputEntry, entryPath)

      onlyKeys(
        entry,
        ['id', 'title', 'description'],
        entryPath,
      )

      return {
        id: uuid(
          required(entry, 'id', entryPath),
          `${entryPath}.id`,
        ),
        title: stringValue(
          required(entry, 'title', entryPath),
          `${entryPath}.title`,
        ),
        description: stringValue(
          required(
            entry,
            'description',
            entryPath,
          ),
          `${entryPath}.description`,
        ),
      }
    },
  )
}

export function parseCharacterSecondaryOwnerId(
  input: unknown,
): string {
  return uuid(input, 'request.user.id')
}

export function parseCharacterSecondaryIdParam(
  input: unknown,
): string {
  return uuid(input, 'characterId')
}

export function parseUpdateCharacterSecondaryRequest(
  characterIdInput: unknown,
  body: unknown,
): UpdateCharacterSecondaryData {
  const characterId =
    parseCharacterSecondaryIdParam(
      characterIdInput,
    )
  const value = record(body, 'body')
  const expectedRevision = positiveInteger(
    required(value, 'expectedRevision', 'body'),
    'body.expectedRevision',
  )
  const section = oneOf(
    required(value, 'section', 'body'),
    ['inventory', 'notes', 'history'] as const,
    'body.section',
  )

  switch (section) {
    case 'inventory':
      onlyKeys(
        value,
        ['expectedRevision', 'section', 'inventory'],
        'body',
      )
      return {
        characterId,
        expectedRevision,
        section,
        inventory: parseInventory(
          required(value, 'inventory', 'body'),
          'body.inventory',
        ),
      }

    case 'notes':
      onlyKeys(
        value,
        ['expectedRevision', 'section', 'notes'],
        'body',
      )
      return {
        characterId,
        expectedRevision,
        section,
        notes: parseNotes(
          required(value, 'notes', 'body'),
          'body.notes',
        ),
      }

    case 'history':
      onlyKeys(
        value,
        ['expectedRevision', 'section', 'history'],
        'body',
      )
      return {
        characterId,
        expectedRevision,
        section,
        history: parseHistory(
          required(value, 'history', 'body'),
          'body.history',
        ),
      }
  }
}

export function toCharacterSecondaryResponse(
  data: PersistedCharacterSecondaryData,
): CharacterSecondaryResponseDto {
  return {
    characterId: data.characterId,
    revision: data.revision,
    inventory: data.inventory.map(
      (item) => ({ ...item }),
    ),
    notes: data.notes.map(
      (note) => ({ ...note }),
    ),
    history: data.history.map(
      (entry) => ({ ...entry }),
    ),
  }
}
