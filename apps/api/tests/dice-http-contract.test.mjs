import assert from 'node:assert/strict'
import test from 'node:test'
import 'reflect-metadata'

import {
  RequestMethod,
} from '@nestjs/common'

import {
  DiceController,
} from '../dist/dice/presentation/dice.controller.js'

import {
  InvalidDiceRollRequestError,
  parseCharacterDiceRollRequest,
  parseManualDiceRollRequest,
} from '../dist/dice/presentation/dice.dto.js'

const characterId =
  '39c1801e-68fe-4c92-8795-723cac284bdf'

function hasStatus(status) {
  return (error) => {
    assert.equal(error.getStatus(), status)
    return true
  }
}

function executed() {
  return {
    pool: {
      components: [],
      basePool: 2,
      modifier: 0,
      finalPool: 2,
      normalDice: 1,
      hungerDice: 1,
      difficulty: null,
    },
    roll: {
      dice: [],
      difficulty: null,
      regularSuccesses: 1,
      criticalPairs: 0,
      criticalBonusSuccesses: 0,
      totalSuccesses: 1,
      outcome: 'success',
      meetsDifficulty: null,
    },
  }
}

test('036-C publica tirada manual y de personaje por POST', () => {
  assert.equal(
    Reflect.getMetadata('path', DiceController),
    'dice',
  )
  const manual = DiceController.prototype.manual
  const character = DiceController.prototype.character
  assert.equal(Reflect.getMetadata('path', manual), 'manual')
  assert.equal(Reflect.getMetadata('method', manual), RequestMethod.POST)
  assert.equal(
    Reflect.getMetadata('path', character),
    'characters/:characterId',
  )
  assert.equal(Reflect.getMetadata('method', character), RequestMethod.POST)
})

test('036-C DTO limita campos y conserva dificultad opcional', () => {
  assert.deepEqual(
    parseManualDiceRollRequest({ pool: 4, hunger: 2 }),
    {
      pool: 4,
      hunger: 2,
      modifier: undefined,
      difficulty: undefined,
    },
  )
  assert.deepEqual(
    parseCharacterDiceRollRequest(characterId, {
      attribute: 'dexterity',
      skill: 'stealth',
      modifier: -1,
      difficulty: null,
    }),
    {
      characterId,
      attribute: 'dexterity',
      skill: 'stealth',
      modifier: -1,
      difficulty: null,
    },
  )
  assert.throws(
    () => parseManualDiceRollRequest({
      pool: 4,
      hunger: 2,
      result: 10,
    }),
    InvalidDiceRollRequestError,
  )
})

test('036-C exige autenticación en ambos endpoints', async () => {
  const controller = new DiceController(
    { execute() { return executed() } },
    { async execute() { return executed() } },
  )
  assert.throws(
    () => controller.manual({}, { pool: 2, hunger: 1 }),
    hasStatus(401),
  )
  await assert.rejects(
    controller.character({}, characterId, {
      attribute: 'dexterity',
    }),
    hasStatus(401),
  )
})

test('036-C entrega identidad autenticada al caso de personaje', async () => {
  const calls = []
  const controller = new DiceController(
    { execute() { return executed() } },
    {
      async execute(ownerId, command) {
        calls.push([ownerId, command])
        return executed()
      },
    },
  )
  await controller.character(
    { user: { id: 'owner-1' } },
    characterId,
    { attribute: 'dexterity' },
  )
  assert.equal(calls[0][0], 'owner-1')
  assert.equal(calls[0][1].characterId, characterId)
})

test('036-C traduce petición inválida y personaje ausente', async () => {
  const controller = new DiceController(
    { execute() { return executed() } },
    { async execute() { return null } },
  )
  assert.throws(
    () => controller.manual(
      { user: { id: 'owner-1' } },
      { pool: '2', hunger: 1 },
    ),
    hasStatus(400),
  )
  await assert.rejects(
    controller.character(
      { user: { id: 'owner-1' } },
      characterId,
      { attribute: 'dexterity' },
    ),
    hasStatus(404),
  )
})

test('036-C registra un módulo independiente en AppModule', async () => {
  const source = await import('node:fs/promises')
  const appModule = await source.readFile(
    new URL('../src/app.module.ts', import.meta.url),
    'utf8',
  )
  const diceModule = await source.readFile(
    new URL('../src/dice/dice.module.ts', import.meta.url),
    'utf8',
  )
  assert.match(appModule, /DiceModule/)
  assert.match(diceModule, /imports: \[CharactersModule\]/)
  assert.match(diceModule, /DICE_RANDOM_SOURCE/)
  assert.doesNotMatch(diceModule, /Prisma/)
})
