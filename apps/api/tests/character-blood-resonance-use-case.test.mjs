import assert from 'node:assert/strict'
import test from 'node:test'

import {
  ApplyCharacterBloodResonanceUseCase,
  CharacterBloodResonanceNatureError,
  CharacterBloodResonancePermissionError,
} from '../dist/characters/application/apply-character-blood-resonance.use-case.js'

import {
  CharacterBloodResonanceOperationConflictError,
} from '../dist/characters/application/character-draft.repository.js'

const characterId =
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const ownerId =
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const operationId =
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc'

function current(overrides = {}) {
  return {
    characterId,
    ownerId,
    chronicleId: null,
    status: 'active',
    nature: 'vampire',
    revision: 7,
    blood: {
      bloodPotency: 1,
      hunger: 3,
      resonance: null,
    },
    ...overrides,
  }
}

test('058-B deriva hambre y persiste una sola mutación revisionada', async () => {
  const calls = []
  const repository = {
    async findByCharacterId() {
      return current()
    },
    async findBloodResonanceOperation() {
      return null
    },
    async applyBloodResonance(data) {
      calls.push(data)
      return current({
        revision: 8,
        blood: {
          bloodPotency: 1,
          hunger: 2,
          resonance: {
            sourceKind: 'human',
            resonanceKey: 'choleric',
            specialAffinityKey: null,
            temperament: 'intense',
          },
        },
      })
    },
  }

  const useCase =
    new ApplyCharacterBloodResonanceUseCase(
      repository,
      {
        async findActiveMembership() {
          throw new Error('not expected')
        },
      },
    )

  const result = await useCase.execute(
    ownerId,
    {
      characterId,
      expectedRevision: 7,
      operationId,
      sourceKind: 'human',
      resonanceKey: 'choleric',
      specialAffinityKey: null,
      temperament: 'intense',
      hungerSlaked: 1,
    },
  )

  assert.equal(calls.length, 1)
  assert.equal(calls[0].hungerBefore, 3)
  assert.equal(calls[0].hungerAfter, 2)
  assert.equal(result.revision, 8)
})

test('058-B reintento ya aplicado no vuelve a mutar aunque la revision avance', async () => {
  let writes = 0
  const existing = {
    characterId,
    operationId,
    sourceKind: 'human',
    resonanceKey: 'choleric',
    specialAffinityKey: null,
    temperament: 'intense',
    hungerSlaked: 1,
    hungerBefore: 3,
    hungerAfter: 2,
    createdAt: new Date(),
  }
  const repository = {
    async findByCharacterId() {
      return current({ revision: 12 })
    },
    async findBloodResonanceOperation() {
      return existing
    },
    async applyBloodResonance() {
      writes += 1
      throw new Error('not expected')
    },
  }
  const useCase =
    new ApplyCharacterBloodResonanceUseCase(
      repository,
      {
        async findActiveMembership() {
          throw new Error('not expected')
        },
      },
    )

  const result = await useCase.execute(
    ownerId,
    {
      characterId,
      expectedRevision: 7,
      operationId,
      sourceKind: 'human',
      resonanceKey: 'choleric',
      specialAffinityKey: null,
      temperament: 'intense',
      hungerSlaked: 1,
    },
  )

  assert.equal(writes, 0)
  assert.equal(result.revision, 12)
})

test('058-B reutilizar operationId con otro payload es conflicto', async () => {
  const repository = {
    async findByCharacterId() {
      return current()
    },
    async findBloodResonanceOperation() {
      return {
        characterId,
        operationId,
        sourceKind: 'human',
        resonanceKey: 'choleric',
        specialAffinityKey: null,
        temperament: 'intense',
        hungerSlaked: 1,
        hungerBefore: 3,
        hungerAfter: 2,
        createdAt: new Date(),
      }
    },
  }
  const useCase =
    new ApplyCharacterBloodResonanceUseCase(
      repository,
      {
        async findActiveMembership() {
          throw new Error('not expected')
        },
      },
    )

  await assert.rejects(
    useCase.execute(
      ownerId,
      {
        characterId,
        expectedRevision: 7,
        operationId,
        sourceKind: 'human',
        resonanceKey: 'sanguine',
        specialAffinityKey: null,
        temperament: 'intense',
        hungerSlaked: 1,
      },
    ),
    CharacterBloodResonanceOperationConflictError,
  )
})

test('058-B protege humano y propietario', async () => {
  const baseRepository = {
    async findBloodResonanceOperation() {
      return null
    },
  }

  const wrongOwner =
    new ApplyCharacterBloodResonanceUseCase(
      {
        ...baseRepository,
        async findByCharacterId() {
          return current({
            ownerId:
              'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
          })
        },
      },
      {
        async findActiveMembership() {
          return null
        },
      },
    )

  await assert.rejects(
    wrongOwner.execute(ownerId, {
      characterId,
      expectedRevision: 7,
      operationId,
      sourceKind: 'human',
      resonanceKey: null,
      specialAffinityKey: null,
      temperament: null,
      hungerSlaked: 1,
    }),
    CharacterBloodResonancePermissionError,
  )

  const human =
    new ApplyCharacterBloodResonanceUseCase(
      {
        ...baseRepository,
        async findByCharacterId() {
          return current({
            nature: 'human',
            blood: null,
          })
        },
      },
      {
        async findActiveMembership() {
          throw new Error('not expected')
        },
      },
    )

  await assert.rejects(
    human.execute(ownerId, {
      characterId,
      expectedRevision: 7,
      operationId,
      sourceKind: 'human',
      resonanceKey: null,
      specialAffinityKey: null,
      temperament: null,
      hungerSlaked: 1,
    }),
    CharacterBloodResonanceNatureError,
  )
})
