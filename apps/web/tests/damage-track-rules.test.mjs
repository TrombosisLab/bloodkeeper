import assert from 'node:assert/strict'
import test from 'node:test'

import {
  applyDamageToTrack,
  createEmptyDamageTrack,
  cycleDamageBoxState,
  getNextDamageState,
  mendDamageFromTrack,
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
  '006-H aplica puntos ya resueltos sobre casillas vacías',
  () => {
    assert.deepEqual(
      applyDamageToTrack(
        5,
        createEmptyDamageTrack(),
        'superficial',
        2,
      ),
      {
        track: {
          superficial: 2,
          aggravated: 0,
        },
        converted: 0,
        overflow: 0,
      },
    )
  },
)

test(
  '006-H convierte el daño superficial que desborda una pista llena',
  () => {
    assert.deepEqual(
      applyDamageToTrack(
        5,
        {
          superficial: 4,
          aggravated: 1,
        },
        'superficial',
        2,
      ),
      {
        track: {
          superficial: 2,
          aggravated: 3,
        },
        converted: 2,
        overflow: 0,
      },
    )
  },
)

test(
  '006-H el daño agravado ocupa huecos y sustituye superficial',
  () => {
    assert.deepEqual(
      applyDamageToTrack(
        5,
        {
          superficial: 3,
          aggravated: 1,
        },
        'aggravated',
        3,
      ),
      {
        track: {
          superficial: 1,
          aggravated: 4,
        },
        converted: 2,
        overflow: 0,
      },
    )
  },
)

test(
  '006-H informa desbordamiento sin interpretar consecuencias',
  () => {
    assert.deepEqual(
      applyDamageToTrack(
        4,
        {
          superficial: 0,
          aggravated: 4,
        },
        'aggravated',
        2,
      ),
      {
        track: {
          superficial: 0,
          aggravated: 4,
        },
        converted: 0,
        overflow: 2,
      },
    )
  },
)

test(
  '006-H retira solo el tipo y cantidad solicitados',
  () => {
    assert.deepEqual(
      mendDamageFromTrack(
        5,
        {
          superficial: 2,
          aggravated: 2,
        },
        'aggravated',
        1,
      ),
      {
        track: {
          superficial: 2,
          aggravated: 1,
        },
        mended: 1,
        remainder: 0,
      },
    )
  },
)

test(
  '006-H valida cantidades y devuelve lo no reparado',
  () => {
    assert.deepEqual(
      mendDamageFromTrack(
        5,
        {
          superficial: 1,
          aggravated: 0,
        },
        'superficial',
        3,
      ),
      {
        track: {
          superficial: 0,
          aggravated: 0,
        },
        mended: 1,
        remainder: 2,
      },
    )

    assert.throws(
      () =>
        applyDamageToTrack(
          5,
          createEmptyDamageTrack(),
          'superficial',
          -1,
        ),
      {
        name: 'InvalidCharacterDamageTrackError',
        violations: ['DAMAGE_AMOUNT_INVALID'],
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
