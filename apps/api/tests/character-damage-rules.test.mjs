import assert from 'node:assert/strict'
import test from 'node:test'

import {
  assertValidCharacterDamageState,
  deriveHealthCapacity,
  deriveWillpowerCapacity,
  validateCharacterDamageState,
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
  '006-C deriva los máximos sin almacenarlos',
  () => {
    assert.equal(deriveHealthCapacity(attributes), 6)
    assert.equal(
      deriveWillpowerCapacity(attributes),
      5,
    )
  },
)

test(
  '006-C acepta daño reconstruible dentro de ambos máximos',
  () => {
    assert.deepEqual(
      validateCharacterDamageState(
        attributes,
        {
          health: {
            superficial: 4,
            aggravated: 2,
          },
          willpower: {
            superficial: 2,
            aggravated: 3,
          },
        },
      ),
      [],
    )
  },
)

test(
  '006-C rechaza cantidades y capacidades imposibles',
  () => {
    assert.deepEqual(
      validateCharacterDamageState(
        attributes,
        {
          health: {
            superficial: -1,
            aggravated: 0,
          },
          willpower: {
            superficial: 0,
            aggravated: 0,
          },
        },
      ),
      ['DAMAGE_COUNT_INVALID'],
    )

    assert.throws(
      () =>
        assertValidCharacterDamageState(
          attributes,
          {
            health: {
              superficial: 7,
              aggravated: 0,
            },
            willpower: {
              superficial: 6,
              aggravated: 0,
            },
          },
        ),
      {
        name: 'InvalidCharacterDamageStateError',
        violations: [
          'HEALTH_DAMAGE_EXCEEDS_CAPACITY',
          'WILLPOWER_DAMAGE_EXCEEDS_CAPACITY',
        ],
      },
    )
  },
)
