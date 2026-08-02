import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createEmptyDamageTrack,
  cycleDamageBoxState,
  getNextDamageState,
  setDamageBoxState,
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
  '006-F define una transición explícita entre estados',
  () => {
    assert.equal(
      getNextDamageState('empty'),
      'superficial',
    )
    assert.equal(
      getNextDamageState('superficial'),
      'aggravated',
    )
    assert.equal(
      getNextDamageState('aggravated'),
      'empty',
    )
  },
)

test(
  '006-F cambia una casilla y reconstruye los contadores',
  () => {
    assert.deepEqual(
      setDamageBoxState(
        4,
        {
          superficial: 1,
          aggravated: 1,
        },
        1,
        'empty',
      ),
      {
        superficial: 0,
        aggravated: 1,
      },
    )
  },
)

test(
  '006-F permite corregir una casilla recorriendo el ciclo completo',
  () => {
    const empty = createEmptyDamageTrack()
    const superficial = cycleDamageBoxState(
      4,
      empty,
      0,
    )
    const aggravated = cycleDamageBoxState(
      4,
      superficial,
      0,
    )
    const corrected = cycleDamageBoxState(
      4,
      aggravated,
      0,
    )

    assert.deepEqual(superficial, {
      superficial: 1,
      aggravated: 0,
    })
    assert.deepEqual(aggravated, {
      superficial: 0,
      aggravated: 1,
    })
    assert.deepEqual(corrected, empty)
  },
)

test(
  '006-F rechaza la edición de casillas no disponibles',
  () => {
    assert.throws(
      () =>
        cycleDamageBoxState(
          4,
          createEmptyDamageTrack(),
          4,
        ),
      {
        name: 'InvalidCharacterDamageTrackError',
        violations: ['BOX_INDEX_OUT_OF_RANGE'],
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
