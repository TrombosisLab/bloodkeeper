import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DicePoolSelectionError,
  ExecuteCharacterDiceRollUseCase,
} from '../dist/dice/application/execute-character-dice-roll.use-case.js'

import {
  ExecuteManualDiceRollUseCase,
} from '../dist/dice/application/execute-manual-dice-roll.use-case.js'

function sequence(values) {
  let index = 0
  return {
    rollD10() {
      const value = values[index]
      index += 1
      return value
    },
  }
}

test('036-C ejecuta una tirada manual con aleatoriedad inyectable', () => {
  const useCase = new ExecuteManualDiceRollUseCase(
    sequence([10, 10, 1]),
  )
  const result = useCase.execute({
    pool: 3,
    hunger: 1,
    difficulty: 4,
  })

  assert.deepEqual(
    result.roll.dice.map(({ value, type }) => ({ value, type })),
    [
      { value: 10, type: 'normal' },
      { value: 10, type: 'normal' },
      { value: 1, type: 'hunger' },
    ],
  )
  assert.equal(result.roll.outcome, 'critical')
  assert.equal(result.roll.meetsDifficulty, true)
})

test('036-C construye desde lecturas autorizadas del personaje', async () => {
  const calls = []
  const useCase = new ExecuteCharacterDiceRollUseCase(
    {
      async execute(ownerId, characterId) {
        calls.push(['ratings', ownerId, characterId])
        return {
          attributes: { dexterity: 3 },
          skills: { stealth: 2 },
        }
      },
    },
    {
      async execute(ownerId, characterId) {
        calls.push(['hunger', ownerId, characterId])
        return { hunger: 2 }
      },
    },
    sequence([6, 7, 8, 1, 10]),
  )

  const result = await useCase.execute('owner-1', {
    characterId: 'character-1',
    attribute: 'dexterity',
    skill: 'stealth',
  })

  assert.equal(result.pool.basePool, 5)
  assert.equal(result.pool.normalDice, 3)
  assert.equal(result.pool.hungerDice, 2)
  assert.deepEqual(calls, [
    ['ratings', 'owner-1', 'character-1'],
    ['hunger', 'owner-1', 'character-1'],
  ])
})

test('036-C no revela personajes ausentes o ajenos', async () => {
  const useCase = new ExecuteCharacterDiceRollUseCase(
    { async execute() { return null } },
    { async execute() { return { hunger: 1 } } },
    sequence([]),
  )

  assert.equal(
    await useCase.execute('owner-1', {
      characterId: 'missing',
      attribute: 'dexterity',
    }),
    null,
  )
})

test('036-C rechaza selecciones que no existen en la ficha', async () => {
  const useCase = new ExecuteCharacterDiceRollUseCase(
    {
      async execute() {
        return {
          attributes: { dexterity: 3 },
          skills: {},
        }
      },
    },
    { async execute() { return { hunger: 1 } } },
    sequence([]),
  )

  await assert.rejects(
    useCase.execute('owner-1', {
      characterId: 'character-1',
      attribute: 'strength',
    }),
    DicePoolSelectionError,
  )
})
