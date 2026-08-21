import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CharacterBlushOfLifeOperationConflictError,
} from '../dist/characters/application/character-blush-of-life.repository.js'

import {
  UseCharacterBlushOfLifeUseCase,
} from '../dist/characters/application/use-character-blush-of-life.use-case.js'

function character(overrides = {}) {
  return {
    characterId: 'character-1',
    ownerId: 'owner-1',
    chronicleId: null,
    revision: 8,
    status: 'active',
    nature: 'vampire',
    blood: {
      bloodPotency: 2,
      hunger: 2,
    },
    ...overrides,
  }
}

function command(overrides = {}) {
  return {
    characterId: 'character-1',
    expectedRevision: 8,
    operationId: 'operation-1',
    ...overrides,
  }
}

function rouseOperation(overrides = {}) {
  return {
    characterId: 'character-1',
    operationId: 'operation-1',
    actorId: 'owner-1',
    reason: 'blushOfLife',
    forced: false,
    bloodPotency: null,
    disciplinePowerLevel: null,
    rolls: [8],
    selectedResult: 8,
    success: true,
    hungerBefore: 2,
    hungerAfter: 2,
    consequence: 'none',
    consequenceDifficulty: null,
    rollHistoryId: 'history-1',
    characterRevision: 9,
    createdAt: new Date(),
    ...overrides,
  }
}

function exemptionOperation(overrides = {}) {
  return {
    characterId: 'character-1',
    operationId: 'operation-1',
    actorId: 'owner-1',
    dyscrasiaKey:
      'enthusiasticAboutLife',
    sourceBloodOperationId: 'feed-1',
    hungerBefore: 5,
    hungerAfter: 5,
    characterRevision: 9,
    createdAt: new Date(),
    ...overrides,
  }
}

function setup({
  current = character(),
  existingExemption = null,
  existingRouse = null,
  active = {
    sourceBloodOperationId: 'feed-1',
    dyscrasiaKey:
      'enthusiasticAboutLife',
  },
  membership = null,
} = {}) {
  const calls = {
    active: 0,
    persist: [],
    rouse: [],
  }

  const characters = {
    async findByCharacterId() {
      return current
    },
  }

  const blush = {
    async findExemptionOperation() {
      return existingExemption
    },
    async findActiveDyscrasia() {
      calls.active += 1
      return active
    },
    async persistExemption(data) {
      calls.persist.push(data)
      return exemptionOperation({
        actorId: data.actorId,
        hungerBefore:
          data.hungerBefore,
        hungerAfter:
          data.hungerBefore,
        characterRevision:
          data.expectedRevision + 1,
      })
    },
  }

  const rouseChecks = {
    async findOperation() {
      return existingRouse
    },
  }

  const participants = {
    async findActiveMembership() {
      return membership
    },
  }

  const executeRouse = {
    async execute(actorId, data) {
      calls.rouse.push({
        actorId,
        data,
      })
      return rouseOperation({
        actorId,
        operationId:
          data.operationId,
      })
    },
  }

  return {
    useCase:
      new UseCharacterBlushOfLifeUseCase(
        characters,
        blush,
        rouseChecks,
        participants,
        executeRouse,
      ),
    calls,
  }
}

test(
  '059-D1A exención se evalúa antes de Hambre 5 y no ejecuta Rouse',
  async () => {
    const { useCase, calls } =
      setup({
        current: character({
          blood: {
            bloodPotency: 2,
            hunger: 5,
          },
        }),
      })

    const result =
      await useCase.execute(
        'owner-1',
        command(),
      )

    assert.equal(
      result.outcome,
      'rouseExempted',
    )
    assert.equal(
      calls.rouse.length,
      0,
    )
    assert.equal(
      calls.persist.length,
      1,
    )
    assert.equal(
      calls.persist[0]
        .hungerBefore,
      5,
    )
    assert.equal(
      result.operation.hungerAfter,
      5,
    )
  },
)

test(
  '059-D1A sin exención delega al Rouse canónico blushOfLife',
  async () => {
    const { useCase, calls } =
      setup({
        active: null,
      })

    const result =
      await useCase.execute(
        'owner-1',
        command(),
      )

    assert.equal(
      result.outcome,
      'rouseResolved',
    )
    assert.equal(
      calls.persist.length,
      0,
    )
    assert.deepEqual(
      calls.rouse[0].data,
      {
        characterId: 'character-1',
        expectedRevision: 8,
        operationId: 'operation-1',
        reason: 'blushOfLife',
      },
    )
  },
)

test(
  '059-D1A Discrasia distinta no exime',
  async () => {
    const { useCase, calls } =
      setup({
        active: {
          sourceBloodOperationId:
            'feed-1',
          dyscrasiaKey:
            'excited',
        },
      })

    const result =
      await useCase.execute(
        'owner-1',
        command(),
      )

    assert.equal(
      result.outcome,
      'rouseResolved',
    )
    assert.equal(
      calls.persist.length,
      0,
    )
    assert.equal(
      calls.rouse.length,
      1,
    )
  },
)

test(
  '059-D1A retry exento precede revisión y no reevalúa Discrasia',
  async () => {
    const existing =
      exemptionOperation()

    const { useCase, calls } =
      setup({
        current:
          character({
            revision: 99,
          }),
        existingExemption:
          existing,
      })

    const result =
      await useCase.execute(
        'owner-1',
        command(),
      )

    assert.equal(
      result.operation,
      existing,
    )
    assert.equal(
      calls.active,
      0,
    )
    assert.equal(
      calls.rouse.length,
      0,
    )
  },
)

test(
  '059-D1A retry Rouse precede revisión y no vuelve a tirar',
  async () => {
    const existing =
      rouseOperation()

    const { useCase, calls } =
      setup({
        current:
          character({
            revision: 99,
          }),
        existingRouse:
          existing,
      })

    const result =
      await useCase.execute(
        'owner-1',
        command(),
      )

    assert.equal(
      result.operation,
      existing,
    )
    assert.equal(
      calls.active,
      0,
    )
    assert.equal(
      calls.rouse.length,
      0,
    )
  },
)

test(
  '059-D1A operationId exento con otro actor autorizado produce conflicto',
  async () => {
    const { useCase } =
      setup({
        current: character({
          chronicleId:
            'chronicle-1',
        }),
        existingExemption:
          exemptionOperation(),
        membership: {
          role: 'narrator',
        },
      })

    await assert.rejects(
      useCase.execute(
        'narrator-2',
        command(),
      ),
      CharacterBlushOfLifeOperationConflictError,
    )
  },
)
