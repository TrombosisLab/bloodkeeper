import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CharacterRouseCheckArchivedError,
  CharacterRouseCheckNatureError,
  CharacterRouseCheckPermissionError,
  ExecuteCharacterRouseCheckUseCase,
} from '../dist/characters/application/execute-character-rouse-check.use-case.js'

import {
  CharacterRouseCheckOperationConflictError,
  CharacterRouseCheckWriteConflictError,
} from '../dist/characters/application/character-rouse-check.repository.js'

import {
  InvalidCharacterRouseCheckError,
} from '../dist/characters/domain/character-rouse-check.rules.js'

function character(overrides = {}) {
  return {
    characterId: 'character-1',
    ownerId: 'owner-1',
    chronicleId: null,
    revision: 8,
    status: 'active',
    nature: 'vampire',
    blood: {
      bloodPotency: 3,
      hunger: 2,
      resonance: null,
      dyscrasia: null,
    },
    ...overrides,
  }
}

function operation(overrides = {}) {
  return {
    characterId: 'character-1',
    operationId: 'operation-1',
    actorId: 'owner-1',
    reason: 'bloodSurge',
    forced: false,
    bloodPotency: null,
    disciplinePowerLevel: null,
    rolls: [7],
    selectedResult: 7,
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

function setup({
  current = character(),
  existing = null,
  randomValues = [7],
  membership = null,
} = {}) {
  const persisted = []
  let randomCalls = 0

  const characters = {
    async findByCharacterId() {
      return current
    },
  }

  const rouseChecks = {
    async findOperation() {
      return existing
    },
    async persist(data) {
      persisted.push(data)
      return operation({
        operationId: data.operationId,
        actorId: data.actorId,
        reason: data.reason,
        forced: data.forced,
        bloodPotency: data.bloodPotency,
        disciplinePowerLevel:
          data.disciplinePowerLevel,
        rolls: [...data.rolls],
        selectedResult:
          data.selectedResult,
        success: data.success,
        hungerBefore:
          data.hungerBefore,
        hungerAfter:
          data.hungerAfter,
        consequence:
          data.consequence,
        consequenceDifficulty:
          data.consequenceDifficulty,
        characterRevision:
          data.expectedRevision + 1,
      })
    },
  }

  const participants = {
    async findActiveMembership() {
      return membership
    },
  }

  const random = {
    d10() {
      const value =
        randomValues[randomCalls]
      randomCalls += 1
      return value
    },
  }

  return {
    useCase:
      new ExecuteCharacterRouseCheckUseCase(
        characters,
        rouseChecks,
        participants,
        random,
      ),
    persisted,
    randomCalls: () => randomCalls,
  }
}

test(
  '059-B fallo ordinario incrementa Hambre una vez y persiste resultado backend',
  async () => {
    const { useCase, persisted } =
      setup({
        randomValues: [4],
      })

    const result =
      await useCase.execute(
        'owner-1',
        {
          characterId: 'character-1',
          expectedRevision: 8,
          operationId: 'operation-1',
          reason: 'bloodSurge',
        },
      )

    assert.equal(result.hungerBefore, 2)
    assert.equal(result.hungerAfter, 3)
    assert.equal(result.success, false)
    assert.equal(persisted.length, 1)
    assert.equal(
      persisted[0].actorId,
      'owner-1',
    )
  },
)

test(
  '059-B retry aplicado precede revision y no vuelve a consumir RNG',
  async () => {
    const existing =
      operation({
        characterRevision: 9,
      })

    const {
      useCase,
      persisted,
      randomCalls,
    } =
      setup({
        current:
          character({
            revision: 12,
          }),
        existing,
        randomValues: [1],
      })

    const retry =
      await useCase.execute(
        'owner-1',
        {
          characterId: 'character-1',
          expectedRevision: 8,
          operationId: 'operation-1',
          reason: 'bloodSurge',
        },
      )

    assert.equal(retry, existing)
    assert.equal(randomCalls(), 0)
    assert.equal(persisted.length, 0)
  },
)

test(
  '059-B mismo operationId con intención distinta produce conflicto',
  async () => {
    const { useCase } =
      setup({
        existing: operation(),
      })

    await assert.rejects(
      useCase.execute(
        'owner-1',
        {
          characterId: 'character-1',
          expectedRevision: 8,
          operationId: 'operation-1',
          reason: 'healing',
        },
      ),
      CharacterRouseCheckOperationConflictError,
    )
  },
)

test(
  '059-B revision incompatible se rechaza antes de tirar',
  async () => {
    const { useCase, randomCalls } =
      setup()

    await assert.rejects(
      useCase.execute(
        'owner-1',
        {
          characterId: 'character-1',
          expectedRevision: 7,
          operationId: 'operation-2',
          reason: 'other',
        },
      ),
      CharacterRouseCheckWriteConflictError,
    )

    assert.equal(randomCalls(), 0)
  },
)

test(
  '059-B bloquea humano archivado y voluntario en Hambre 5',
  async () => {
    await assert.rejects(
      setup({
        current:
          character({
            nature: 'human',
            blood: null,
          }),
      }).useCase.execute(
        'owner-1',
        {
          characterId: 'character-1',
          expectedRevision: 8,
          operationId: 'operation-human',
          reason: 'other',
        },
      ),
      CharacterRouseCheckNatureError,
    )

    await assert.rejects(
      setup({
        current:
          character({
            status: 'archived',
          }),
      }).useCase.execute(
        'owner-1',
        {
          characterId: 'character-1',
          expectedRevision: 8,
          operationId: 'operation-archived',
          reason: 'other',
        },
      ),
      CharacterRouseCheckArchivedError,
    )

    await assert.rejects(
      setup({
        current:
          character({
            blood: {
              bloodPotency: 3,
              hunger: 5,
              resonance: null,
              dyscrasia: null,
            },
          }),
      }).useCase.execute(
        'owner-1',
        {
          characterId: 'character-1',
          expectedRevision: 8,
          operationId: 'operation-h5',
          reason: 'other',
        },
      ),
      InvalidCharacterRouseCheckError,
    )
  },
)

test(
  '059-B consumidor interno forzado conserva Hambre 5 y estructura Torpor',
  async () => {
    const { useCase, persisted } =
      setup({
        current:
          character({
            blood: {
              bloodPotency: 3,
              hunger: 5,
              resonance: null,
              dyscrasia: null,
            },
          }),
        randomValues: [2],
      })

    const result =
      await useCase.execute(
        'owner-1',
        {
          characterId: 'character-1',
          expectedRevision: 8,
          operationId: 'forced-awakening',
          reason: 'awakening',
          forced: true,
        },
      )

    assert.equal(result.hungerAfter, 5)
    assert.equal(
      persisted[0].consequence,
      'torporTriggered',
    )
    assert.equal(
      persisted[0].consequenceDifficulty,
      null,
    )
  },
)

test(
  '059-B Poder interno deriva repetición desde Potencia real y conserva mejor dado',
  async () => {
    const {
      useCase,
      persisted,
      randomCalls,
    } =
      setup({
        randomValues: [3, 8],
      })

    const result =
      await useCase.execute(
        'owner-1',
        {
          characterId: 'character-1',
          expectedRevision: 8,
          operationId: 'power-operation',
          reason: 'disciplinePower',
          disciplinePowerLevel: 2,
        },
      )

    assert.equal(randomCalls(), 2)
    assert.deepEqual(
      result.rolls,
      [3, 8],
    )
    assert.equal(
      result.selectedResult,
      8,
    )
    assert.equal(
      persisted[0].bloodPotency,
      3,
    )
  },
)

test(
  '059-B propietario y Narrador contextual pueden ejecutar; tercero no',
  async () => {
    await assert.doesNotReject(
      setup().useCase.execute(
        'owner-1',
        {
          characterId: 'character-1',
          expectedRevision: 8,
          operationId: 'owner-operation',
          reason: 'other',
        },
      ),
    )

    await assert.doesNotReject(
      setup({
        current:
          character({
            chronicleId: 'chronicle-1',
          }),
        membership: {
          role: 'narrator',
        },
      }).useCase.execute(
        'narrator-1',
        {
          characterId: 'character-1',
          expectedRevision: 8,
          operationId: 'narrator-operation',
          reason: 'other',
        },
      ),
    )

    await assert.rejects(
      setup({
        current:
          character({
            chronicleId: 'chronicle-1',
          }),
        membership: {
          role: 'player',
        },
      }).useCase.execute(
        'player-2',
        {
          characterId: 'character-1',
          expectedRevision: 8,
          operationId: 'forbidden-operation',
          reason: 'other',
        },
      ),
      CharacterRouseCheckPermissionError,
    )
  },
)
