import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DiceRollContextMismatchError,
  DiceRollContextNotFoundError,
  DiceRollContextPermissionError,
  DiceRollContextValidator,
} from '../dist/dice/application/dice-roll-context.js'
import {
  ExecuteCharacterDiceRollUseCase,
} from '../dist/dice/application/execute-character-dice-roll.use-case.js'
import {
  ExecuteManualDiceRollUseCase,
} from '../dist/dice/application/execute-manual-dice-roll.use-case.js'
import {
  RecordCharacterDiceRollUseCase,
} from '../dist/dice/application/record-character-dice-roll.use-case.js'
import {
  RecordManualDiceRollUseCase,
} from '../dist/dice/application/record-manual-dice-roll.use-case.js'

function sequence(values, counter = { rolls: 0 }) {
  let index = 0
  return {
    rollD10() {
      counter.rolls += 1
      return values[index++]
    },
  }
}

function memoryRecords(initial = []) {
  const entries = [...initial]
  return {
    entries,
    async create(data) {
      const record = {
        id: `roll-${entries.length + 1}`,
        actorId: data.actorId,
        actorDisplayName: 'Ejecutor',
        characterId: data.characterId,
        chronicleId: data.chronicleId,
        sessionId: data.sessionId,
        rerollParentId: data.rerollParentId,
        source: data.source,
        visibility: data.visibility,
        description: data.description,
        rulesVersion: data.rulesVersion,
        pool: data.pool,
        roll: data.roll,
        createdAt: new Date('2026-08-11T20:00:00.000Z'),
      }
      entries.push(record)
      return record
    },
    async findById(id) {
      return entries.find((entry) => entry.id === id) ?? null
    },
  }
}

function participants(active = true) {
  return {
    async findActiveMembership(chronicleId, userId) {
      return active
        ? { chronicleId, userId, role: 'player', status: 'active' }
        : null
    },
  }
}

function sessions(found = true) {
  return {
    async findById(chronicleId, sessionId) {
      return found ? { id: sessionId, chronicleId } : null
    },
  }
}

test('039-B1 persiste exactamente la ejecucion manual y su version de reglas', async () => {
  const records = memoryRecords()
  const contexts = new DiceRollContextValidator(
    records,
    participants(),
    sessions(),
  )
  const useCase = new RecordManualDiceRollUseCase(
    new ExecuteManualDiceRollUseCase(sequence([10, 1])),
    contexts,
    records,
  )

  const record = await useCase.execute('actor-1', {
    pool: 2,
    hunger: 1,
    description: '  Acechar  ',
    visibility: 'private',
  })

  assert.equal(records.entries.length, 1)
  assert.equal(record.actorId, 'actor-1')
  assert.equal(record.source, 'manual')
  assert.equal(record.visibility, 'private')
  assert.equal(record.description, 'Acechar')
  assert.equal(record.rulesVersion, 'v5r-spec-038-v1')
  assert.deepEqual(record.roll.dice.map(({ value }) => value), [10, 1])
})

test('039-B1 deniega contexto antes de consumir RNG o crear historial', async () => {
  const counter = { rolls: 0 }
  const records = memoryRecords()
  const contexts = new DiceRollContextValidator(
    records,
    participants(false),
    sessions(),
  )
  const useCase = new RecordManualDiceRollUseCase(
    new ExecuteManualDiceRollUseCase(sequence([6], counter)),
    contexts,
    records,
  )

  await assert.rejects(
    useCase.execute('actor-1', {
      pool: 1,
      hunger: 0,
      chronicleId: 'chronicle-1',
    }),
    DiceRollContextPermissionError,
  )
  assert.equal(counter.rolls, 0)
  assert.equal(records.entries.length, 0)
})

test('039-B1 exige que la sesion exista dentro de la cronica', async () => {
  const validator = new DiceRollContextValidator(
    memoryRecords(),
    participants(),
    sessions(false),
  )
  await assert.rejects(
    validator.validate({
      actorId: 'actor-1',
      characterId: null,
      characterChronicleId: null,
      command: {
        chronicleId: 'chronicle-1',
        sessionId: 'session-1',
      },
    }),
    DiceRollContextNotFoundError,
  )
})

test('039-B1 rechaza cronica distinta de la asociada al personaje', async () => {
  const validator = new DiceRollContextValidator(
    memoryRecords(),
    participants(),
    sessions(),
  )
  await assert.rejects(
    validator.validate({
      actorId: 'actor-1',
      characterId: 'character-1',
      characterChronicleId: 'chronicle-1',
      command: { chronicleId: 'chronicle-2' },
    }),
    DiceRollContextMismatchError,
  )
})

test('039-B1 deriva la cronica del personaje y guarda su snapshot autorizado', async () => {
  const records = memoryRecords()
  const contexts = new DiceRollContextValidator(
    records,
    participants(),
    sessions(),
  )
  const executor = new ExecuteCharacterDiceRollUseCase(
    { async execute() { return { attributes: { dexterity: 2 }, skills: { stealth: 1 } } } },
    { async execute() { return { hunger: 1 } } },
    sequence([6, 7, 1]),
  )
  const useCase = new RecordCharacterDiceRollUseCase(
    executor,
    { async execute() { return { chronicleId: 'chronicle-1' } } },
    contexts,
    records,
  )

  const record = await useCase.execute('owner-1', {
    characterId: 'character-1',
    attribute: 'dexterity',
    skill: 'stealth',
  })

  assert.equal(record.characterId, 'character-1')
  assert.equal(record.chronicleId, 'chronicle-1')
  assert.equal(record.source, 'character')
  assert.equal(record.pool.hungerDice, 1)
})

test('039-B1 relaciona rerolls propios y preserva el contexto original', async () => {
  const parent = {
    id: 'roll-parent',
    actorId: 'actor-1',
    actorDisplayName: 'Uno',
    characterId: null,
    chronicleId: null,
    sessionId: null,
    rerollParentId: null,
    source: 'manual',
    visibility: 'contextual',
    description: null,
    rulesVersion: 'v5r-spec-038-v1',
    pool: {},
    roll: {},
    createdAt: new Date(),
  }
  const records = memoryRecords([parent])
  const contexts = new DiceRollContextValidator(
    records,
    participants(),
    sessions(),
  )
  const useCase = new RecordManualDiceRollUseCase(
    new ExecuteManualDiceRollUseCase(sequence([8])),
    contexts,
    records,
  )

  await assert.rejects(
    useCase.execute('actor-2', {
      pool: 1,
      hunger: 0,
      rerollParentId: parent.id,
    }),
    DiceRollContextPermissionError,
  )
  const reroll = await useCase.execute('actor-1', {
    pool: 1,
    hunger: 0,
    rerollParentId: parent.id,
  })
  assert.equal(reroll.rerollParentId, parent.id)
  assert.equal(records.entries[0], parent)
})
