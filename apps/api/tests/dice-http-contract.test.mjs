import assert from 'node:assert/strict'
import test from 'node:test'
import 'reflect-metadata'
import { RequestMethod } from '@nestjs/common'

import { DiceController } from '../dist/dice/presentation/dice.controller.js'
import {
  InvalidDiceRollRequestError,
  parseCharacterDiceRollRequest,
  parseManualDiceRollRequest,
} from '../dist/dice/presentation/dice.dto.js'

const characterId = '39c1801e-68fe-4c92-8795-723cac284bdf'
const chronicleId = 'c586fa12-50bc-44dd-a4d1-4bbdaec35d99'
const sessionId = '08a83c53-47f6-4e82-bced-282821c6e0d5'

function hasStatus(status) {
  return (error) => {
    assert.equal(error.getStatus(), status)
    return true
  }
}

function executed() {
  return {
    pool: {
      components: [], modifiers: [], basePool: 2, modifier: 0,
      finalPool: 2, normalDice: 1, hungerDice: 1,
      difficulty: null, context: null,
    },
    roll: {
      dice: [], difficulty: null, regularSuccesses: 1,
      criticalPairs: 0, criticalBonusSuccesses: 0,
      totalSuccesses: 1, isSuccessful: true,
      specialResult: 'none', specialEvidence: {
        criticalTenIndices: [], hungerCriticalTenIndices: [],
        criticalPairs: [], bestialFailureDieIndices: [],
      },
      outcome: 'success', meetsDifficulty: null,
    },
  }
}

function recorded() {
  return {
    id: 'roll-1', actorId: 'owner-1', actorDisplayName: 'Owner',
    characterId: null, chronicleId: null, sessionId: null,
    rerollParentId: null, source: 'manual', visibility: 'contextual',
    description: null, rulesVersion: 'v5r-spec-038-v1',
    ...executed(), createdAt: new Date('2026-08-11T20:00:00.000Z'),
  }
}

function controller(recordManual = {}, recordCharacter = {}) {
  return new DiceController(
    { preview() { return executed().pool } },
    { async preview() { return executed().pool } },
    { async execute() { return recorded() }, ...recordManual },
    { async execute() { return recorded() }, ...recordCharacter },
  )
}

test('036-C publica tirada manual y de personaje por POST', () => {
  assert.equal(Reflect.getMetadata('path', DiceController), 'dice')
  const manual = DiceController.prototype.manual
  const character = DiceController.prototype.character
  assert.equal(Reflect.getMetadata('path', manual), 'manual')
  assert.equal(Reflect.getMetadata('method', manual), RequestMethod.POST)
  assert.equal(Reflect.getMetadata('path', character), 'characters/:characterId')
  assert.equal(Reflect.getMetadata('method', character), RequestMethod.POST)
})

test('036-C DTO limita campos y conserva dificultad opcional', () => {
  assert.deepEqual(parseManualDiceRollRequest({ pool: 4, hunger: 2 }), {
    pool: 4, hunger: 2, modifier: undefined, difficulty: undefined,
  })
  assert.deepEqual(parseCharacterDiceRollRequest(characterId, {
    attribute: 'dexterity', skill: 'stealth', modifier: -1,
    difficulty: null, chronicleId, sessionId, visibility: 'private',
  }), {
    characterId, attribute: 'dexterity', skill: 'stealth', modifier: -1,
    difficulty: null, chronicleId, sessionId, visibility: 'private',
  })
  assert.throws(
    () => parseManualDiceRollRequest({ pool: 4, hunger: 2, result: 10 }),
    InvalidDiceRollRequestError,
  )
})

test('036-C exige autenticacion en ambos endpoints', async () => {
  const instance = controller()
  await assert.rejects(
    instance.manual({}, { pool: 2, hunger: 1 }),
    hasStatus(401),
  )
  await assert.rejects(
    instance.character({}, characterId, { attribute: 'dexterity' }),
    hasStatus(401),
  )
})

test('036-C entrega identidad autenticada al caso de personaje', async () => {
  const calls = []
  const instance = controller({}, {
    async execute(ownerId, command) {
      calls.push([ownerId, command])
      return { ...recorded(), characterId: command.characterId }
    },
  })
  const response = await instance.character(
    { user: { id: 'owner-1' } },
    characterId,
    { attribute: 'dexterity' },
  )
  assert.equal(calls[0][0], 'owner-1')
  assert.equal(calls[0][1].characterId, characterId)
  assert.equal(response.id, 'roll-1')
  assert.equal(response.createdAt, '2026-08-11T20:00:00.000Z')
})

test('036-C traduce peticion invalida y personaje ausente', async () => {
  const instance = controller({}, { async execute() { return null } })
  await assert.rejects(
    instance.manual(
      { user: { id: 'owner-1' } },
      { pool: '2', hunger: 1 },
    ),
    hasStatus(400),
  )
  await assert.rejects(
    instance.character(
      { user: { id: 'owner-1' } },
      characterId,
      { attribute: 'dexterity' },
    ),
    hasStatus(404),
  )
})

test('036-C registra un modulo independiente en AppModule', async () => {
  const source = await import('node:fs/promises')
  const appModule = await source.readFile(
    new URL('../src/app.module.ts', import.meta.url), 'utf8',
  )
  const diceModule = await source.readFile(
    new URL('../src/dice/dice.module.ts', import.meta.url), 'utf8',
  )
  assert.match(appModule, /DiceModule/)
  assert.match(diceModule, /imports: \[CharactersModule, ChroniclesModule\]/)
  assert.match(diceModule, /DICE_RANDOM_SOURCE/)
  assert.match(diceModule, /DICE_ROLL_REPOSITORY/)
  assert.match(diceModule, /PrismaDiceRollRepository/)
})
