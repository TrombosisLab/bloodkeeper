import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DiceApiError,
  parseExecutedDiceRoll,
} from '../src/features/dice/infrastructure/dice.api.ts'

function response() {
  return {
    pool: {
      components: [{ key: 'manual_pool', label: 'Reserva manual', value: 3 }],
      modifiers: [],
      basePool: 3,
      modifier: 0,
      finalPool: 3,
      normalDice: 1,
      hungerDice: 2,
      difficulty: 3,
      context: { source: 'manual', description: null },
    },
    roll: {
      dice: [
        { value: 10, type: 'normal', isSuccess: true, isCriticalTen: true, isBestialFailureDie: false },
        { value: 10, type: 'hunger', isSuccess: true, isCriticalTen: true, isBestialFailureDie: false },
        { value: 1, type: 'hunger', isSuccess: false, isCriticalTen: false, isBestialFailureDie: true },
      ],
      difficulty: 3,
      regularSuccesses: 2,
      criticalPairs: 1,
      criticalBonusSuccesses: 2,
      totalSuccesses: 4,
      isSuccessful: true,
      specialResult: 'messy_critical',
      specialEvidence: {
        criticalTenIndices: [0, 1],
        hungerCriticalTenIndices: [1],
        criticalPairs: [{ firstDieIndex: 0, secondDieIndex: 1, involvesHunger: true }],
        bestialFailureDieIndices: [2],
      },
      outcome: 'messy_critical',
      meetsDifficulty: true,
    },
  }
}

test('038-B conserva resultado global condicion especial y evidencia', () => {
  const result = parseExecutedDiceRoll(response())
  assert.equal(result.roll.isSuccessful, true)
  assert.equal(result.roll.specialResult, 'messy_critical')
  assert.deepEqual(result.roll.specialEvidence.criticalTenIndices, [0, 1])
  assert.equal(result.roll.specialEvidence.criticalPairs[0].involvesHunger, true)
  assert.deepEqual(result.roll.specialEvidence.bestialFailureDieIndices, [2])
})

test('038-B rechaza indices de evidencia fuera de la tirada', () => {
  const invalid = response()
  invalid.roll.specialEvidence.criticalTenIndices = [3]
  assert.throws(
    () => parseExecutedDiceRoll(invalid),
    (error) => error instanceof DiceApiError && error.status === 502,
  )
})

test('038-B rechaza clasificaciones especiales desconocidas', () => {
  const invalid = response()
  invalid.roll.specialResult = 'narrative_disaster'
  assert.throws(
    () => parseExecutedDiceRoll(invalid),
    (error) => error instanceof DiceApiError && error.code === 'INVALID_DICE_RESPONSE',
  )
})
