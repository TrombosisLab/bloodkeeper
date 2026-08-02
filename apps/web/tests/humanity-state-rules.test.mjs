import assert from 'node:assert/strict'
import test from 'node:test'

import {
  InvalidCharacterHumanityStateError,
  toHumanityBoxStates,
  validateCharacterHumanityState,
} from '../src/features/character-sheet/domain/humanity-state-rules.ts'

test(
  '006-E reconstruye Humanidad, Manchas y casillas vacías',
  () => {
    assert.deepEqual(
      toHumanityBoxStates({
        value: 7,
        stains: 2,
      }),
      [
        ...Array(7).fill('humanity'),
        ...Array(2).fill('stain'),
        'empty',
      ],
    )
  },
)

test(
  '006-E siempre reconstruye exactamente diez casillas',
  () => {
    assert.equal(
      toHumanityBoxStates({
        value: 10,
        stains: 0,
      }).length,
      10,
    )
    assert.equal(
      toHumanityBoxStates({
        value: 0,
        stains: 10,
      }).length,
      10,
    )
  },
)

test(
  '006-E rechaza valores no enteros o fuera de rango',
  () => {
    assert.deepEqual(
      validateCharacterHumanityState({
        value: 11,
        stains: -1,
      }),
      [
        'HUMANITY_VALUE_INVALID',
        'HUMANITY_STAINS_INVALID',
      ],
    )
  },
)

test(
  '006-E rechaza Manchas que exceden las casillas disponibles',
  () => {
    assert.throws(
      () =>
        toHumanityBoxStates({
          value: 7,
          stains: 4,
        }),
      InvalidCharacterHumanityStateError,
    )
  },
)
