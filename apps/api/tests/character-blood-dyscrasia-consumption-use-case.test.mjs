import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CharacterBloodDyscrasiaNotActiveError,
  ConsumeCharacterBloodDyscrasiaUseCase,
} from '../dist/characters/application/consume-character-blood-dyscrasia.use-case.js'

import {
  CharacterBloodDyscrasiaAlreadyConsumedError,
  CharacterBloodDyscrasiaConsumptionOperationConflictError,
} from '../dist/characters/application/character-blood-dyscrasia-consumption.repository.js'

import {
  InvalidCharacterBloodDyscrasiaConsumptionError,
} from '../dist/characters/domain/character-blood-dyscrasia-consumption.types.js'

function character(overrides = {}) {
  return {
    characterId: 'character-1',
    ownerId: 'owner-1',
    chronicleId: null,
    revision: 8,
    status: 'active',
    nature: 'vampire',
    blood: {
      bloodPotency: 1,
      hunger: 2,
      resonance: {
        sourceKind: 'human',
        resonanceKey: 'choleric',
        specialAffinityKey: null,
        temperament: 'acute',
      },
      dyscrasia: {
        key: 'energetic',
        acquisitionMode: 'drainAndKill',
      },
    },
    ...overrides,
  }
}

function command(overrides = {}) {
  return {
    characterId: 'character-1',
    expectedRevision: 8,
    operationId: 'consume-1',
    sourceBloodOperationId: 'feed-1',
    dyscrasiaKey: 'energetic',
    ...overrides,
  }
}

function setup({
  current = character(),
  existingOperation = null,
  consumedSource = null,
  active = {
    characterId: 'character-1',
    sourceBloodOperationId: 'feed-1',
    dyscrasiaKey: 'energetic',
  },
} = {}) {
  const calls = []

  const characters = {
    async findByCharacterId() {
      return current
    },
  }

  const consumptions = {
    async findBloodDyscrasiaConsumptionOperation() {
      return existingOperation
    },
    async findBloodDyscrasiaConsumptionBySource() {
      return consumedSource
    },
    async findActiveBloodDyscrasia() {
      return active
    },
    async consumeBloodDyscrasia(data) {
      calls.push(data)
      return {
        ...current,
        revision:
          current.revision + 1,
        blood: {
          ...current.blood,
          dyscrasia: null,
        },
      }
    },
  }

  const participants = {
    async findActiveMembership() {
      throw new Error(
        'No chronicle membership expected',
      )
    },
  }

  return {
    useCase:
      new ConsumeCharacterBloodDyscrasiaUseCase(
        characters,
        consumptions,
        participants,
      ),
    calls,
  }
}

test('058-D3 consume exactamente la instancia activa consumible', async () => {
  const { useCase, calls } = setup()

  const result =
    await useCase.execute(
      'owner-1',
      command(),
    )

  assert.equal(calls.length, 1)
  assert.deepEqual(
    calls[0],
    command(),
  )
  assert.equal(result.revision, 9)
  assert.equal(
    result.blood.dyscrasia,
    null,
  )
  assert.equal(
    result.blood.resonance.resonanceKey,
    'choleric',
  )
})

test('058-D3 retry con mismo operationId es idempotente antes de revisar revision', async () => {
  const current =
    character({
      revision: 9,
      blood: {
        ...character().blood,
        dyscrasia: null,
      },
    })

  const existingOperation = {
    characterId: 'character-1',
    operationId: 'consume-1',
    sourceBloodOperationId: 'feed-1',
    dyscrasiaKey: 'energetic',
    createdAt: new Date(),
  }

  const { useCase, calls } =
    setup({
      current,
      existingOperation,
      active: null,
    })

  const result =
    await useCase.execute(
      'owner-1',
      command({
        expectedRevision: 8,
      }),
    )

  assert.equal(result.revision, 9)
  assert.equal(calls.length, 0)
})

test('058-D3 mismo operationId con otra instancia produce conflicto', async () => {
  const { useCase } =
    setup({
      existingOperation: {
        characterId: 'character-1',
        operationId: 'consume-1',
        sourceBloodOperationId: 'other-feed',
        dyscrasiaKey: 'energetic',
        createdAt: new Date(),
      },
    })

  await assert.rejects(
    useCase.execute(
      'owner-1',
      command(),
    ),
    CharacterBloodDyscrasiaConsumptionOperationConflictError,
  )
})

test('058-D3 una instancia ya consumida no puede reutilizarse', async () => {
  const { useCase } =
    setup({
      consumedSource: {
        characterId: 'character-1',
        operationId: 'consume-old',
        sourceBloodOperationId: 'feed-1',
        dyscrasiaKey: 'energetic',
        createdAt: new Date(),
      },
    })

  await assert.rejects(
    useCase.execute(
      'owner-1',
      command({
        operationId: 'consume-2',
      }),
    ),
    CharacterBloodDyscrasiaAlreadyConsumedError,
  )
})

test('058-D3 rechaza Discrasia no consumible', async () => {
  const current =
    character({
      blood: {
        ...character().blood,
        dyscrasia: {
          key: 'aggressive',
          acquisitionMode: 'drainAndKill',
        },
      },
    })

  const { useCase } =
    setup({
      current,
      active: {
        characterId: 'character-1',
        sourceBloodOperationId: 'feed-1',
        dyscrasiaKey: 'aggressive',
      },
    })

  await assert.rejects(
    useCase.execute(
      'owner-1',
      command({
        dyscrasiaKey: 'aggressive',
      }),
    ),
    InvalidCharacterBloodDyscrasiaConsumptionError,
  )
})

test('058-D3 exige la instancia activa exacta', async () => {
  const { useCase } =
    setup({
      active: {
        characterId: 'character-1',
        sourceBloodOperationId: 'feed-other',
        dyscrasiaKey: 'energetic',
      },
    })

  await assert.rejects(
    useCase.execute(
      'owner-1',
      command(),
    ),
    CharacterBloodDyscrasiaNotActiveError,
  )
})
