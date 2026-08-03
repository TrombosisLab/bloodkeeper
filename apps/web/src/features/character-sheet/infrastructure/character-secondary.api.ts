import {
  validateCharacterSecondaryData,
} from '../domain/character-secondary-rules.ts'

import type {
  CharacterSecondaryData,
  CharacterSecondarySection,
  CharacterSecondarySnapshot,
} from '../types/character-secondary.types.ts'

export class CharacterSecondaryApiError
  extends Error {
  readonly status: number
  readonly code: string

  constructor(
    status: number,
    code: string,
  ) {
    super(code)
    this.name = 'CharacterSecondaryApiError'
    this.status = status
    this.code = code
  }
}

export interface CharacterSecondaryGateway {
  load(
    characterId: string,
  ): Promise<CharacterSecondarySnapshot>

  update(
    characterId: string,
    expectedRevision: number,
    section: CharacterSecondarySection,
    data: CharacterSecondaryData,
  ): Promise<CharacterSecondarySnapshot>
}

type FetchImplementation =
  typeof globalThis.fetch

function invalidResponse(): never {
  throw new CharacterSecondaryApiError(
    502,
    'INVALID_CHARACTER_SECONDARY_RESPONSE',
  )
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function hasInventoryShape(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    Number.isInteger(value.quantity) &&
    (value.description === null ||
      typeof value.description === 'string') &&
    (value.category === null ||
      typeof value.category === 'string') &&
    (value.notes === null ||
      typeof value.notes === 'string') &&
    (value.status === 'active' ||
      value.status === 'archived')
  )
}

function hasNoteShape(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.content === 'string'
  )
}

function hasHistoryShape(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.description === 'string'
  )
}

function parseSnapshot(
  value: unknown,
): CharacterSecondarySnapshot {
  if (
    !isRecord(value) ||
    typeof value.characterId !== 'string' ||
    !Number.isInteger(value.revision) ||
    (value.revision as number) < 1 ||
    !Array.isArray(value.inventory) ||
    !value.inventory.every(hasInventoryShape) ||
    !Array.isArray(value.notes) ||
    !value.notes.every(hasNoteShape) ||
    !Array.isArray(value.history) ||
    !value.history.every(hasHistoryShape)
  ) {
    return invalidResponse()
  }

  const snapshot = {
    characterId: value.characterId,
    revision: value.revision,
    inventory: value.inventory,
    notes: value.notes,
    history: value.history,
  } as CharacterSecondarySnapshot

  try {
    if (
      validateCharacterSecondaryData(snapshot)
        .length > 0
    ) {
      return invalidResponse()
    }
  } catch {
    return invalidResponse()
  }

  return {
    ...snapshot,
    inventory: snapshot.inventory.map(
      (item) => ({ ...item }),
    ),
    notes: snapshot.notes.map(
      (note) => ({ ...note }),
    ),
    history: snapshot.history.map(
      (entry) => ({ ...entry }),
    ),
  }
}

async function errorFromResponse(
  response: Response,
): Promise<CharacterSecondaryApiError> {
  let code = 'CHARACTER_SECONDARY_REQUEST_FAILED'

  try {
    const body: unknown = await response.json()

    if (
      isRecord(body) &&
      typeof body.code === 'string'
    ) {
      code = body.code
    }
  } catch {
    // The status remains sufficient when the body is absent.
  }

  return new CharacterSecondaryApiError(
    response.status,
    code,
  )
}

async function snapshotFromResponse(
  response: Response,
): Promise<CharacterSecondarySnapshot> {
  if (!response.ok) {
    throw await errorFromResponse(response)
  }

  try {
    return parseSnapshot(await response.json())
  } catch (error: unknown) {
    if (
      error instanceof
        CharacterSecondaryApiError
    ) {
      throw error
    }

    return invalidResponse()
  }
}

function updateBody(
  expectedRevision: number,
  section: CharacterSecondarySection,
  data: CharacterSecondaryData,
): Record<string, unknown> {
  switch (section) {
    case 'inventory':
      return {
        expectedRevision,
        section,
        inventory: data.inventory,
      }

    case 'notes':
      return {
        expectedRevision,
        section,
        notes: data.notes,
      }

    case 'history':
      return {
        expectedRevision,
        section,
        history: data.history,
      }
  }
}

export function createCharacterSecondaryGateway(
  fetchImplementation: FetchImplementation =
    globalThis.fetch,
): CharacterSecondaryGateway {
  return {
    async load(characterId) {
      const response = await fetchImplementation(
        `/api/characters/${encodeURIComponent(characterId)}/secondary`,
        {
          credentials: 'include',
          headers: {
            Accept: 'application/json',
          },
        },
      )

      return snapshotFromResponse(response)
    },

    async update(
      characterId,
      expectedRevision,
      section,
      data,
    ) {
      const response = await fetchImplementation(
        `/api/characters/${encodeURIComponent(characterId)}/secondary`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(
            updateBody(
              expectedRevision,
              section,
              data,
            ),
          ),
        },
      )

      return snapshotFromResponse(response)
    },
  }
}
