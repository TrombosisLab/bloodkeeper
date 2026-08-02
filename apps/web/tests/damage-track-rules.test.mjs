import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createEmptyDamageTrack,
  toDamageStates,
  validateCharacterDamageTrack,
} from '../src/features/character-sheet/domain/damage-track-rules.ts'

test(
  '006-A crea una pista de dano vacia',
  () => {
    assert.deepEqual(
      createEmptyDamageTrack(),
      {
        superficial: 0,
        aggravated: 0,
      },
    )
  },
)

test(
  '006-A reconstruye estados sin ambiguedad',
  () => {
    assert.deepEqual(
      toDamageStates(6, {
        superficial: 2,
        aggravated: 1,
      }),
      [
        'aggravated',
        'superficial',
        'superficial',
        'empty',
        'empty',
        'empty',
      ],
    )
  },
)

test(
  '006-A admite pistas completas hasta diez casillas',
  () => {
    assert.equal(
      toDamageStates(10, {
        superficial: 6,
        aggravated: 4,
      }).length,
      10,
    )
  },
)

test(
  '006-A rechaza capacidad y cantidades invalidas',
  () => {
    assert.deepEqual(
      validateCharacterDamageTrack(11, {
        superficial: -1,
        aggravated: 0.5,
      }),
      [
        'CAPACITY_OUT_OF_RANGE',
        'DAMAGE_COUNT_INVALID',
      ],
    )
  },
)

test(
  '006-A rechaza dano superior a la capacidad',
  () => {
    assert.deepEqual(
      validateCharacterDamageTrack(5, {
        superficial: 3,
        aggravated: 3,
      }),
      ['DAMAGE_EXCEEDS_CAPACITY'],
    )

    assert.throws(
      () =>
        toDamageStates(5, {
          superficial: 3,
          aggravated: 3,
        }),
      {
        name: 'InvalidCharacterDamageTrackError',
      },
    )
  },
)
