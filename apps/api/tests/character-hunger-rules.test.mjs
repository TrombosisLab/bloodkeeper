import assert from 'node:assert/strict'
import test from 'node:test'

import {
  assertValidCharacterHunger,
  validateCharacterHunger,
} from '../dist/characters/domain/character-hunger.rules.js'

test(
  '027-C acepta únicamente Hambre entera entre 0 y 5',
  () => {
    for (let hunger = 0; hunger <= 5; hunger += 1) {
      assert.deepEqual(
        validateCharacterHunger(
          hunger,
        ),
        [],
      )
    }

    for (const hunger of [-1, 6, 1.5]) {
      assert.deepEqual(
        validateCharacterHunger(
          hunger,
        ),
        [
          'HUNGER_VALUE_INVALID',
        ],
      )
    }
  },
)

test(
  '027-C identifica la infracción de dominio de forma estable',
  () => {
    assert.throws(
      () =>
        assertValidCharacterHunger(
          8,
        ),
      {
        name:
          'InvalidCharacterHungerError',
        violations: [
          'HUNGER_VALUE_INVALID',
        ],
      },
    )
  },
)
