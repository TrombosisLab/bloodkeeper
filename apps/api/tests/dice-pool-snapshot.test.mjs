import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DicePoolInputError,
  buildDicePool,
} from '../dist/dice/domain/dice-pool.rules.js'

test('037-A combina fuentes genericas sin una formula universal', () => {
  const attributePair = buildDicePool({
    components: [
      { key: 'strength', label: 'Fuerza', value: 3 },
      { key: 'dexterity', label: 'Destreza', value: 2 },
    ],
    hunger: 1,
  })
  const singleValue = buildDicePool({
    components: [
      { key: 'bloodPotency', label: 'Potencia de Sangre', value: 2 },
    ],
    hunger: 0,
  })
  const actionPool = buildDicePool({
    components: [
      { key: 'resolve', label: 'Resolucion', value: 3 },
      { key: 'animalism', label: 'Animalismo', value: 2 },
    ],
    hunger: 2,
    context: {
      source: 'action',
      description: 'Poder de Animalismo',
    },
  })

  assert.equal(attributePair.basePool, 5)
  assert.equal(singleValue.basePool, 2)
  assert.equal(actionPool.basePool, 5)
  assert.equal(actionPool.context.description, 'Poder de Animalismo')
})

test('037-A conserva modificadores positivos negativos y su origen', () => {
  const pool = buildDicePool({
    components: [
      { key: 'attribute', label: 'Compostura', value: 3 },
      { key: 'skill', label: 'Armas de Fuego', value: 2 },
    ],
    modifiers: [
      { key: 'equipment', label: 'Equipo adecuado', value: 2 },
      { key: 'wounded', label: 'Herido', value: -1 },
    ],
    hunger: 1,
  })

  assert.equal(pool.basePool, 5)
  assert.equal(pool.modifier, 1)
  assert.equal(pool.finalPool, 6)
  assert.deepEqual(pool.modifiers.map(({ key, value }) => ({ key, value })), [
    { key: 'equipment', value: 2 },
    { key: 'wounded', value: -1 },
  ])
})

test('037-A congela una copia independiente de los datos de entrada', () => {
  const component = { key: 'manual', label: 'Reserva manual', value: 3 }
  const modifier = { key: 'bonus', label: 'Bonificacion', value: 1 }
  const context = { source: 'manual', description: '  Percepcion  ' }
  const pool = buildDicePool({
    components: [component],
    modifiers: [modifier],
    hunger: 1,
    context,
  })

  component.value = 5
  modifier.value = 4
  context.description = 'Cambiada'

  assert.equal(pool.basePool, 3)
  assert.equal(pool.modifier, 1)
  assert.deepEqual(pool.context, {
    source: 'manual',
    description: 'Percepcion',
  })
  assert.equal(Object.isFrozen(pool), true)
  assert.equal(Object.isFrozen(pool.components), true)
  assert.equal(Object.isFrozen(pool.components[0]), true)
  assert.equal(Object.isFrozen(pool.modifiers), true)
  assert.equal(Object.isFrozen(pool.modifiers[0]), true)
  assert.equal(Object.isFrozen(pool.context), true)
})

test('037-A resuelve explicitamente reservas reducidas a cero', () => {
  assert.throws(
    () => buildDicePool({
      components: [
        { key: 'base', label: 'Base', value: 2 },
      ],
      modifiers: [
        { key: 'penalty', label: 'Penalizacion', value: -2 },
      ],
      hunger: 1,
    }),
    (error) => error instanceof DicePoolInputError &&
      /at least one die/.test(error.message),
  )
})

test('037-A rechaza modificadores ambiguos y contexto invalido', () => {
  const base = {
    components: [
      { key: 'base', label: 'Base', value: 3 },
    ],
    hunger: 0,
  }

  assert.throws(
    () => buildDicePool({
      ...base,
      modifier: 1,
      modifiers: [
        { key: 'bonus', label: 'Bonus', value: 1 },
      ],
    }),
    DicePoolInputError,
  )
  assert.throws(
    () => buildDicePool({
      ...base,
      modifiers: [
        { key: 'same', label: 'Uno', value: 1 },
        { key: 'same', label: 'Dos', value: -1 },
      ],
    }),
    DicePoolInputError,
  )
  assert.throws(
    () => buildDicePool({
      ...base,
      context: {
        source: 'manual',
        description: 'x'.repeat(161),
      },
    }),
    DicePoolInputError,
  )
})
