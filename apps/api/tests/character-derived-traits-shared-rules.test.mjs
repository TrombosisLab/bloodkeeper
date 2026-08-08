import assert from 'node:assert/strict'
import test from 'node:test'

import {
  deriveCharacterHealthCapacity,
  deriveCharacterWillpowerCapacity,
} from '@v5r/character-rules'

import {
  deriveHealthCapacity,
  deriveWillpowerCapacity,
} from '../dist/characters/domain/character-damage.rules.js'

const attributes = {
  strength: 1,
  dexterity: 1,
  stamina: 3,
  charisma: 1,
  manipulation: 1,
  composure: 2,
  intelligence: 1,
  wits: 1,
  resolve: 3,
}

test(
  'SPEC-024 centraliza Salud y Voluntad en character-rules',
  () => {
    assert.equal(
      deriveCharacterHealthCapacity(attributes),
      6,
    )
    assert.equal(
      deriveCharacterWillpowerCapacity(attributes),
      5,
    )
    assert.equal(
      deriveHealthCapacity(attributes),
      deriveCharacterHealthCapacity(attributes),
    )
    assert.equal(
      deriveWillpowerCapacity(attributes),
      deriveCharacterWillpowerCapacity(attributes),
    )
  },
)
