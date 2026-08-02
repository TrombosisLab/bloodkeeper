import type {
  CreatePersistedCharacterSnapshotInput,
  PersistedCharacter,
} from '../types/persisted-character.types.ts'

export const CHARACTER_PERSISTENCE_SCHEMA_VERSION = 1

function requireIdentifier(
  value: string,
  field: string,
) {
  if (value.trim().length === 0) {
    throw new Error(`${field} is required`)
  }
}

function requireTimestamp(
  value: string,
  field: string,
) {
  if (
    value.trim().length === 0 ||
    Number.isNaN(Date.parse(value))
  ) {
    throw new Error(`${field} must be a valid timestamp`)
  }
}

export function createPersistedCharacterSnapshot(
  input: CreatePersistedCharacterSnapshotInput,
): PersistedCharacter {
  requireIdentifier(
    input.characterId,
    'characterId',
  )

  requireIdentifier(
    input.ownerId,
    'ownerId',
  )

  if (input.chronicleId !== null) {
    requireIdentifier(
      input.chronicleId,
      'chronicleId',
    )
  }

  if (
    !Number.isInteger(input.revision) ||
    input.revision < 1
  ) {
    throw new Error(
      'revision must be a positive integer',
    )
  }

  requireTimestamp(
    input.createdAt,
    'createdAt',
  )

  requireTimestamp(
    input.updatedAt,
    'updatedAt',
  )

  if (
    Date.parse(input.updatedAt) <
    Date.parse(input.createdAt)
  ) {
    throw new Error(
      'updatedAt cannot be earlier than createdAt',
    )
  }

  const draft = structuredClone(input.draft)
  const {
    chronicle: _legacyChronicle,
    ...identity
  } = draft.identity

  const {
    identity: _draftIdentity,
    skillDistributionMethod,
    ...data
  } = draft

  return {
    schemaVersion:
      CHARACTER_PERSISTENCE_SCHEMA_VERSION,
    characterId: input.characterId,
    ownerId: input.ownerId,
    chronicleId: input.chronicleId,
    status: input.status,
    revision: input.revision,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
    creation: {
      currentStepId: input.currentStepId,
      skillDistributionMethod,
    },
    data: {
      ...data,
      identity,
    },
  }
}
