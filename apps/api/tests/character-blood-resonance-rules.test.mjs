import assert from 'node:assert/strict'
import test from 'node:test'

import {
  InvalidCharacterBloodResonanceError,
  assertValidConsumedBloodProfile,
  deriveCharacterBloodResonanceHungerAfter,
  toActiveCharacterBloodResonance,
} from '../dist/characters/domain/character-blood-resonance.types.js'

test('058-B acepta los perfiles persistibles previstos', () => {
  for (const profile of [
    {
      sourceKind: 'human',
      resonanceKey: 'choleric',
      specialAffinityKey: null,
      temperament: 'intense',
    },
    {
      sourceKind: 'animal',
      resonanceKey: 'melancholy',
      specialAffinityKey: null,
      temperament: 'fleeting',
    },
    {
      sourceKind: 'animal',
      resonanceKey: null,
      specialAffinityKey: 'animalBlood',
      temperament: 'acute',
    },
    {
      sourceKind: 'human',
      resonanceKey: null,
      specialAffinityKey: 'resonanceFree',
      temperament: null,
    },
    {
      sourceKind: 'human',
      resonanceKey: null,
      specialAffinityKey: null,
      temperament: null,
    },
  ]) {
    assert.doesNotThrow(
      () => assertValidConsumedBloodProfile(profile),
    )
  }
})

test('058-B rechaza combinaciones inventadas', () => {
  for (const profile of [
    {
      sourceKind: 'human',
      resonanceKey: null,
      specialAffinityKey: 'animalBlood',
      temperament: 'intense',
    },
    {
      sourceKind: 'animal',
      resonanceKey: null,
      specialAffinityKey: 'resonanceFree',
      temperament: null,
    },
    {
      sourceKind: 'human',
      resonanceKey: 'sanguine',
      specialAffinityKey: null,
      temperament: null,
    },
  ]) {
    assert.throws(
      () => assertValidConsumedBloodProfile(profile),
      InvalidCharacterBloodResonanceError,
    )
  }
})

test('058-B acredita alimentación con Hambre saciada positiva', () => {
  assert.equal(
    deriveCharacterBloodResonanceHungerAfter(3, 1),
    2,
  )
  assert.equal(
    deriveCharacterBloodResonanceHungerAfter(3, 3),
    0,
  )
  assert.throws(
    () => deriveCharacterBloodResonanceHungerAfter(2, 0),
    InvalidCharacterBloodResonanceError,
  )
  assert.throws(
    () => deriveCharacterBloodResonanceHungerAfter(2, 3),
    InvalidCharacterBloodResonanceError,
  )
})

test('058-B ausencia significativa limpia el estado activo', () => {
  assert.equal(
    toActiveCharacterBloodResonance({
      sourceKind: 'human',
      resonanceKey: null,
      specialAffinityKey: null,
      temperament: null,
    }),
    null,
  )
})
