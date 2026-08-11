import assert from 'node:assert/strict'
import test from 'node:test'
import {
  DicePoolInputError,
  buildDicePool,
} from '../dist/dice/domain/dice-pool.rules.js'

test('036-B construye reserva base modificador y reparto de Hambre', () => {
  const pool = buildDicePool({
    components: [
      { key: 'attribute', label: 'Destreza', value: 3 },
      { key: 'skill', label: 'Sigilo', value: 2 },
    ],
    modifier: 2,
    hunger: 2,
    difficulty: 3,
  })

  assert.deepEqual(pool, {
    components: [
      { key: 'attribute', label: 'Destreza', value: 3 },
      { key: 'skill', label: 'Sigilo', value: 2 },
    ],
    modifiers: [
      { key: 'general', label: 'Modificador general', value: 2 },
    ],
    basePool: 5,
    modifier: 2,
    finalPool: 7,
    normalDice: 5,
    hungerDice: 2,
    difficulty: 3,
    context: null,
  })
})

test('036-B Hambre cero conserva toda la reserva como dados normales', () => {
  const pool = buildDicePool({
    components: [
      { key: 'manual', label: 'Reserva manual', value: 4 },
    ],
    hunger: 0,
  })

  assert.equal(pool.normalDice, 4)
  assert.equal(pool.hungerDice, 0)
  assert.equal(pool.difficulty, null)
})

test('036-B Hambre igual o superior sustituye todos los dados disponibles', () => {
  const equalPool = buildDicePool({
    components: [
      { key: 'manual', label: 'Reserva manual', value: 3 },
    ],
    hunger: 3,
  })
  const higherPool = buildDicePool({
    components: [
      { key: 'manual', label: 'Reserva manual', value: 2 },
    ],
    hunger: 5,
  })

  assert.deepEqual(
    [equalPool.normalDice, equalPool.hungerDice],
    [0, 3],
  )
  assert.deepEqual(
    [higherPool.normalDice, higherPool.hungerDice],
    [0, 2],
  )
})

test('036-B aplica modificadores antes de sustituir Dados de Hambre', () => {
  const pool = buildDicePool({
    components: [
      { key: 'base', label: 'Reserva base', value: 5 },
    ],
    modifier: -3,
    hunger: 4,
  })

  assert.equal(pool.basePool, 5)
  assert.equal(pool.finalPool, 2)
  assert.equal(pool.normalDice, 0)
  assert.equal(pool.hungerDice, 2)
})

test('036-B conserva componentes sin depender de tipos de Personajes', () => {
  const pool = buildDicePool({
    components: [
      { key: 'power', label: 'Poder', value: 4 },
      { key: 'blood', label: 'Potencia de Sangre', value: 2 },
    ],
    hunger: 1,
  })

  assert.equal(pool.basePool, 6)
  assert.deepEqual(
    pool.components.map(({ key }) => key),
    ['power', 'blood'],
  )
})

test('036-B rechaza componentes límites y reserva final inválidos', () => {
  assert.throws(
    () => buildDicePool({ components: [], hunger: 0 }),
    DicePoolInputError,
  )
  assert.throws(
    () => buildDicePool({
      components: [
        { key: 'base', label: 'Base', value: 1 },
        { key: 'base', label: 'Otra', value: 1 },
      ],
      hunger: 0,
    }),
    DicePoolInputError,
  )
  assert.throws(
    () => buildDicePool({
      components: [
        { key: 'base', label: 'Base', value: 2 },
      ],
      modifier: -2,
      hunger: 0,
    }),
    DicePoolInputError,
  )
  assert.throws(
    () => buildDicePool({
      components: [
        { key: 'base', label: 'Base', value: 2 },
      ],
      hunger: 6,
    }),
    DicePoolInputError,
  )
  assert.throws(
    () => buildDicePool({
      components: [
        { key: 'base', label: 'Base', value: 2 },
      ],
      hunger: 0,
      difficulty: 0,
    }),
    DicePoolInputError,
  )
})
