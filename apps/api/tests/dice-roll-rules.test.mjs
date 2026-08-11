import assert from 'node:assert/strict'
import test from 'node:test'
import {
  DiceRollInputError,
  resolveDiceRoll,
} from '../dist/dice/domain/dice-roll.rules.js'

test('036-A cuenta éxitos normales y críticos V5', () => {
  const result = resolveDiceRoll({
    dice: [
      { value: 6, type: 'normal' },
      { value: 4, type: 'normal' },
      { value: 10, type: 'normal' },
      { value: 10, type: 'normal' },
    ],
  })

  assert.equal(result.regularSuccesses, 3)
  assert.equal(result.criticalPairs, 1)
  assert.equal(result.criticalBonusSuccesses, 2)
  assert.equal(result.totalSuccesses, 5)
  assert.equal(result.outcome, 'critical')
  assert.equal(result.meetsDifficulty, null)
})

test('036-A conserva el tipo de dado y reconoce crítico conflictivo', () => {
  const result = resolveDiceRoll({
    dice: [
      { value: 10, type: 'normal' },
      { value: 10, type: 'hunger' },
      { value: 6, type: 'hunger' },
    ],
    difficulty: 5,
  })

  assert.deepEqual(
    result.dice.map((die) => die.type),
    ['normal', 'hunger', 'hunger'],
  )
  assert.equal(result.dice[1].isCriticalTen, true)
  assert.equal(result.totalSuccesses, 5)
  assert.equal(result.outcome, 'messy_critical')
  assert.equal(result.meetsDifficulty, true)
})

test('036-A reconoce fallo bestial solo si no hay éxitos', () => {
  const bestial = resolveDiceRoll({
    dice: [
      { value: 1, type: 'hunger' },
      { value: 5, type: 'normal' },
    ],
    difficulty: 1,
  })
  const avoided = resolveDiceRoll({
    dice: [
      { value: 1, type: 'hunger' },
      { value: 6, type: 'normal' },
    ],
  })

  assert.equal(bestial.outcome, 'bestial_failure')
  assert.equal(bestial.meetsDifficulty, false)
  assert.equal(avoided.outcome, 'success')
})

test('036-A aplica dificultad sin exigirla', () => {
  const result = resolveDiceRoll({
    dice: [
      { value: 7, type: 'normal' },
      { value: 8, type: 'normal' },
    ],
    difficulty: 3,
  })

  assert.equal(result.totalSuccesses, 2)
  assert.equal(result.outcome, 'success')
  assert.equal(result.meetsDifficulty, false)
})

test('036-A rechaza entradas fuera de los límites del motor', () => {
  assert.throws(
    () => resolveDiceRoll({ dice: [] }),
    DiceRollInputError,
  )
  assert.throws(
    () => resolveDiceRoll({
      dice: [{ value: 11, type: 'normal' }],
    }),
    DiceRollInputError,
  )
  assert.throws(
    () => resolveDiceRoll({
      dice: [{ value: 6, type: 'normal' }],
      difficulty: 0,
    }),
    DiceRollInputError,
  )
})
