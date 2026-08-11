import assert from 'node:assert/strict'
import test from 'node:test'
import {
  calculateCharacterAdvancementCost,
  characterAdvancementNormativeSources,
} from '../dist/characters/domain/character-advancement-cost.rules.js'

test('056-C conserva trazabilidad normativa explicita', () => {
  assert.deepEqual(characterAdvancementNormativeSources, [
    'Core V5 pp. 130-131',
    'Core V5 pp. 151-152',
    'Players Guide V5 p. 92',
  ])
})

test('056-C calcula todos los costes V5 confirmados', () => {
  assert.equal(calculateCharacterAdvancementCost({ kind: 'attribute', newLevel: 3 }), 15)
  assert.equal(calculateCharacterAdvancementCost({ kind: 'skill', newLevel: 3 }), 9)
  assert.equal(calculateCharacterAdvancementCost({ kind: 'specialty' }), 3)
  assert.equal(calculateCharacterAdvancementCost({ kind: 'discipline', newLevel: 3, costClass: 'clan' }), 15)
  assert.equal(calculateCharacterAdvancementCost({ kind: 'discipline', newLevel: 3, costClass: 'other' }), 21)
  assert.equal(calculateCharacterAdvancementCost({ kind: 'discipline', newLevel: 3, costClass: 'caitiff' }), 18)
  assert.equal(calculateCharacterAdvancementCost({ kind: 'ritual', level: 3 }), 9)
  assert.equal(calculateCharacterAdvancementCost({ kind: 'formula', level: 3 }), 9)
  assert.equal(calculateCharacterAdvancementCost({ kind: 'ceremony', level: 3 }), 9)
  assert.equal(calculateCharacterAdvancementCost({ kind: 'advantage', dots: 2 }), 6)
  assert.equal(calculateCharacterAdvancementCost({ kind: 'bloodPotency', newLevel: 2 }), 20)
})
