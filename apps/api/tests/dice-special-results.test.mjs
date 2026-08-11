import assert from 'node:assert/strict'
import test from 'node:test'

import {
  resolveDiceRoll,
} from '../dist/dice/domain/dice-roll.rules.js'

test('038-A expone evidencia de cada diez y pareja critica', () => {
  const result = resolveDiceRoll({
    dice: [
      { value: 10, type: 'normal' },
      { value: 7, type: 'normal' },
      { value: 10, type: 'normal' },
      { value: 10, type: 'normal' },
      { value: 10, type: 'normal' },
    ],
  })

  assert.deepEqual(result.specialEvidence.criticalTenIndices, [0, 2, 3, 4])
  assert.deepEqual(result.specialEvidence.hungerCriticalTenIndices, [])
  assert.deepEqual(result.specialEvidence.criticalPairs, [
    { firstDieIndex: 0, secondDieIndex: 2, involvesHunger: false },
    { firstDieIndex: 3, secondDieIndex: 4, involvesHunger: false },
  ])
  assert.equal(result.specialResult, 'critical')
  assert.equal(result.isSuccessful, true)
})

test('038-A empareja Hambre de forma determinista en tres dieces', () => {
  const result = resolveDiceRoll({
    dice: [
      { value: 10, type: 'normal' },
      { value: 10, type: 'normal' },
      { value: 10, type: 'hunger' },
    ],
  })

  assert.deepEqual(result.specialEvidence.criticalTenIndices, [0, 1, 2])
  assert.deepEqual(result.specialEvidence.hungerCriticalTenIndices, [2])
  assert.deepEqual(result.specialEvidence.criticalPairs, [
    { firstDieIndex: 0, secondDieIndex: 2, involvesHunger: true },
  ])
  assert.equal(result.specialResult, 'messy_critical')
  assert.equal(result.outcome, 'messy_critical')
})

test('038-A reconoce fallo bestial al no alcanzar dificultad con exitos', () => {
  const result = resolveDiceRoll({
    dice: [
      { value: 1, type: 'hunger' },
      { value: 7, type: 'normal' },
      { value: 5, type: 'normal' },
    ],
    difficulty: 2,
  })

  assert.equal(result.totalSuccesses, 1)
  assert.equal(result.isSuccessful, false)
  assert.equal(result.meetsDifficulty, false)
  assert.equal(result.specialResult, 'bestial_failure')
  assert.equal(result.outcome, 'bestial_failure')
  assert.deepEqual(result.specialEvidence.bestialFailureDieIndices, [0])
})

test('038-A no clasifica como critico una tirada que falla dificultad', () => {
  const result = resolveDiceRoll({
    dice: [
      { value: 10, type: 'normal' },
      { value: 10, type: 'hunger' },
    ],
    difficulty: 5,
  })

  assert.equal(result.totalSuccesses, 4)
  assert.equal(result.isSuccessful, false)
  assert.equal(result.specialResult, 'none')
  assert.equal(result.outcome, 'failure')
  assert.equal(result.specialEvidence.criticalPairs[0].involvesHunger, true)
})

test('038-A un uno de Hambre no altera una tirada exitosa', () => {
  const result = resolveDiceRoll({
    dice: [
      { value: 1, type: 'hunger' },
      { value: 8, type: 'normal' },
    ],
  })

  assert.equal(result.isSuccessful, true)
  assert.equal(result.specialResult, 'none')
  assert.equal(result.outcome, 'success')
  assert.deepEqual(result.specialEvidence.bestialFailureDieIndices, [0])
})

test('038-A prioriza fallo bestial sobre evidencia critica al fracasar', () => {
  const result = resolveDiceRoll({
    dice: [
      { value: 10, type: 'normal' },
      { value: 10, type: 'hunger' },
      { value: 1, type: 'hunger' },
    ],
    difficulty: 6,
  })

  assert.equal(result.totalSuccesses, 4)
  assert.equal(result.isSuccessful, false)
  assert.equal(result.specialEvidence.criticalPairs.length, 1)
  assert.equal(result.specialResult, 'bestial_failure')
  assert.equal(result.outcome, 'bestial_failure')
})
