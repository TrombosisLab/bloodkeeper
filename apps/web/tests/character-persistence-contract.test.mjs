import assert from 'node:assert/strict'
import test from 'node:test'

import {
  initialCharacterDraft,
} from '../src/features/character-creation/data/initial-character-draft.ts'

import {
  CHARACTER_PERSISTENCE_SCHEMA_VERSION,
  createPersistedCharacterSnapshot,
} from '../src/features/character-creation/domain/character-persistence-contract.ts'

function createSnapshot(overrides = {}) {
  return createPersistedCharacterSnapshot({
    characterId: 'character-001',
    ownerId: 'user-001',
    chronicleId: null,
    status: 'draft',
    revision: 1,
    createdAt: '2026-08-02T17:00:00.000Z',
    updatedAt: '2026-08-02T17:00:00.000Z',
    currentStepId: 'identity',
    draft: initialCharacterDraft,
    ...overrides,
  })
}

test(
  '004-A crea un contrato persistente versionado con identidad estable',
  () => {
    const snapshot = createSnapshot()

    assert.equal(
      snapshot.schemaVersion,
      CHARACTER_PERSISTENCE_SCHEMA_VERSION,
    )
    assert.equal(
      snapshot.characterId,
      'character-001',
    )
    assert.equal(snapshot.ownerId, 'user-001')
    assert.equal(snapshot.status, 'draft')
    assert.equal(snapshot.nature, 'vampire')
    assert.equal(snapshot.revision, 1)
  },
)

test(
  '004-A representa la crónica mediante una relación opcional explícita',
  () => {
    const draft = structuredClone(
      initialCharacterDraft,
    )
    draft.identity.chronicle =
      'texto heredado de interfaz'

    const snapshot = createSnapshot({
      chronicleId: 'chronicle-001',
      draft,
    })

    assert.equal(
      snapshot.chronicleId,
      'chronicle-001',
    )
    assert.equal(
      Object.hasOwn(
        snapshot.data.identity,
        'chronicle',
      ),
      false,
    )
  },
)

test(
  '004-A separa el progreso del creador de los datos del personaje',
  () => {
    const snapshot = createSnapshot({
      currentStepId: 'advantages',
    })

    assert.deepEqual(snapshot.creation, {
      currentStepId: 'advantages',
      creationMode: 'standard',
      skillDistributionMethod: 'balanced',
    })
    assert.equal(
      Object.hasOwn(
        snapshot.data,
        'skillDistributionMethod',
      ),
      false,
    )
  },
)

test(
  '004-A conserva un snapshot independiente del CharacterDraft mutable',
  () => {
    const draft = structuredClone(
      initialCharacterDraft,
    )
    const snapshot = createSnapshot({ draft })

    draft.identity.name = 'Mutado después'
    draft.attributes.strength = 4

    assert.equal(snapshot.data.identity.name, '')
    assert.equal(snapshot.data.attributes.strength, 1)
  },
)

test(
  '004-A rechaza metadatos técnicos que no pueden persistirse',
  () => {
    assert.throws(
      () => createSnapshot({ characterId: '' }),
      /characterId is required/,
    )
    assert.throws(
      () => createSnapshot({ ownerId: '  ' }),
      /ownerId is required/,
    )
    assert.throws(
      () => createSnapshot({ revision: 0 }),
      /revision must be a positive integer/,
    )
    assert.throws(
      () =>
        createSnapshot({
          updatedAt:
            '2026-08-01T17:00:00.000Z',
        }),
      /updatedAt cannot be earlier/,
    )
  },
)
