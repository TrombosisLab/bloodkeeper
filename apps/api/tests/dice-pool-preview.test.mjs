import assert from 'node:assert/strict'
import test from 'node:test'
import 'reflect-metadata'

import {
  RequestMethod,
} from '@nestjs/common'

import {
  ExecuteCharacterDiceRollUseCase,
} from '../dist/dice/application/execute-character-dice-roll.use-case.js'

import {
  ExecuteManualDiceRollUseCase,
} from '../dist/dice/application/execute-manual-dice-roll.use-case.js'

import {
  DiceController,
} from '../dist/dice/presentation/dice.controller.js'

import {
  parseManualDiceRollRequest,
} from '../dist/dice/presentation/dice.dto.js'

function sequence(values) {
  let index = 0
  return {
    calls: 0,
    rollD10() {
      this.calls += 1
      const value = values[index]
      index += 1
      return value
    },
  }
}

test('037-B previsualiza manual sin consumir aleatoriedad', () => {
  const random = sequence([6, 7, 8, 9])
  const useCase = new ExecuteManualDiceRollUseCase(random)
  const pool = useCase.preview({
    pool: 3,
    hunger: 1,
    modifiers: [
      { key: 'darkness', label: 'Oscuridad', value: -1 },
    ],
    description: 'Buscar una salida',
  })

  assert.equal(random.calls, 0)
  assert.equal(pool.finalPool, 2)
  assert.equal(pool.context.source, 'manual')
  assert.equal(pool.context.description, 'Buscar una salida')
})

test('037-B previsualiza una ficha autorizada con valores actuales', async () => {
  const ratings = {
    attributes: { dexterity: 3 },
    skills: { stealth: 2 },
  }
  const useCase = new ExecuteCharacterDiceRollUseCase(
    { async execute() { return ratings } },
    { async execute() { return { hunger: 2 } } },
    sequence([6, 7, 8, 9, 10]),
  )
  const pool = await useCase.preview('owner-1', {
    characterId: 'character-1',
    attribute: 'dexterity',
    skill: 'stealth',
    description: 'Cruzar sin ser visto',
  })

  ratings.attributes.dexterity = 5
  assert.equal(pool.basePool, 5)
  assert.equal(pool.hungerDice, 2)
  assert.equal(pool.context.source, 'character')
})

test('037-B repite como ejecuciones nuevas sin alterar la anterior', () => {
  const useCase = new ExecuteManualDiceRollUseCase(
    sequence([6, 1, 10, 2]),
  )
  const command = { pool: 2, hunger: 1 }
  const first = useCase.execute(command)
  const second = useCase.execute(command)

  assert.deepEqual(first.roll.dice.map(({ value }) => value), [6, 1])
  assert.deepEqual(second.roll.dice.map(({ value }) => value), [10, 2])
  assert.equal(Object.isFrozen(first), true)
  assert.equal(Object.isFrozen(first.roll), true)
  assert.equal(Object.isFrozen(first.roll.dice), true)
  assert.equal(Object.isFrozen(first.roll.dice[0]), true)
})

test('037-B publica previews manual y de personaje por POST', () => {
  const manual = DiceController.prototype.manualPreview
  const character = DiceController.prototype.characterPreview
  assert.equal(Reflect.getMetadata('path', manual), 'manual/preview')
  assert.equal(Reflect.getMetadata('method', manual), RequestMethod.POST)
  assert.equal(
    Reflect.getMetadata('path', character),
    'characters/:characterId/preview',
  )
  assert.equal(Reflect.getMetadata('method', character), RequestMethod.POST)
})

test('037-B DTO conserva descripcion y modificadores estructurados', () => {
  assert.deepEqual(
    parseManualDiceRollRequest({
      pool: 4,
      hunger: 1,
      description: 'Perseguir al objetivo',
      modifiers: [
        { key: 'rain', label: 'Lluvia', value: -1 },
        { key: 'help', label: 'Ayuda', value: 1 },
      ],
    }),
    {
      pool: 4,
      hunger: 1,
      modifier: undefined,
      modifiers: [
        { key: 'rain', label: 'Lluvia', value: -1 },
        { key: 'help', label: 'Ayuda', value: 1 },
      ],
      difficulty: undefined,
      description: 'Perseguir al objetivo',
    },
  )
})
