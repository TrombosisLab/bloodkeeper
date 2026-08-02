import assert from 'node:assert/strict'
import test from 'node:test'

import {
  assertValidCharacterHumanityState,
  validateCharacterHumanityState,
} from '../dist/characters/domain/character-humanity-state.rules.js'

test(
  '006-D mantiene Humanidad y Manchas como valores separados',
  () => {
    assert.deepEqual(
      validateCharacterHumanityState(7, 3),
      [],
    )
    assert.deepEqual(
      validateCharacterHumanityState(10, 0),
      [],
    )
  },
)

test(
  '006-D rechaza puntuaciones y cantidades inválidas',
  () => {
    assert.deepEqual(
      validateCharacterHumanityState(7.5, -1),
      [
        'HUMANITY_VALUE_INVALID',
        'HUMANITY_STAINS_INVALID',
      ],
    )
  },
)

test(
  '006-D impide más Manchas que casillas disponibles',
  () => {
    assert.throws(
      () =>
        assertValidCharacterHumanityState(
          7,
          4,
        ),
      {
        name:
          'InvalidCharacterHumanityStateError',
        violations: [
          'HUMANITY_STAINS_EXCEED_AVAILABLE_BOXES',
        ],
      },
    )
  },
)
