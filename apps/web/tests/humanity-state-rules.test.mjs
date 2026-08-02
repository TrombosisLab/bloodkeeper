import assert from 'node:assert/strict'
import test from 'node:test'

import {
  canSetHumanityStains,
  canSetHumanityValue,
  InvalidCharacterHumanityStateError,
  setHumanityStains,
  setHumanityValue,
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
  '006-G modifica Humanidad sin alterar las Manchas',
  () => {
    assert.deepEqual(
      setHumanityValue(
        { value: 7, stains: 2 },
        6,
      ),
      { value: 6, stains: 2 },
    )
  },
)

test(
  '006-G modifica Manchas sin alterar Humanidad',
  () => {
    assert.deepEqual(
      setHumanityStains(
        { value: 7, stains: 1 },
        2,
      ),
      { value: 7, stains: 2 },
    )
  },
)

test(
  '006-G impide operaciones que producirían estados imposibles',
  () => {
    const state = { value: 7, stains: 3 }

    assert.equal(
      canSetHumanityValue(state, 8),
      false,
    )
    assert.equal(
      canSetHumanityStains(state, 4),
      false,
    )
    assert.throws(
      () => setHumanityStains(state, 4),
      InvalidCharacterHumanityStateError,
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
