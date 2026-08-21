import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getCharacterRouseCheckDiceCount,
  resolveCharacterRouseCheck,
} from '../dist/characters/domain/character-rouse-check.rules.js'

test(
  '059-A usa un d10 y considera 6+ un éxito',
  () => {
    const failure =
      resolveCharacterRouseCheck({
        reason: 'bloodSurge',
        hungerBefore: 2,
        rolls: [5],
      })

    assert.deepEqual(failure, {
      rolls: [5],
      selectedResult: 5,
      success: false,
      hungerIncrease: 1,
      consequence: 'none',
    })

    const success =
      resolveCharacterRouseCheck({
        reason: 'bloodSurge',
        hungerBefore: 2,
        rolls: [6],
      })

    assert.deepEqual(success, {
      rolls: [6],
      selectedResult: 6,
      success: true,
      hungerIncrease: 0,
      consequence: 'none',
    })
  },
)

test(
  '059-A no aplica repetición por Potencia fuera de Poderes',
  () => {
    for (const reason of [
      'awakening',
      'blushOfLife',
      'bloodSurge',
      'healing',
      'ritualOrCeremony',
      'other',
    ]) {
      assert.equal(
        getCharacterRouseCheckDiceCount({
          reason,
          bloodPotency: 10,
          disciplinePowerLevel: 1,
        }),
        1,
      )
    }
  },
)

test(
  '059-A deriva la repetición contextual de Poderes por Potencia y nivel',
  () => {
    const cases = [
      [0, 1, 1],
      [1, 1, 2],
      [2, 1, 2],
      [2, 2, 1],
      [3, 2, 2],
      [4, 2, 2],
      [4, 3, 1],
      [5, 3, 2],
      [6, 3, 2],
      [6, 4, 1],
    ]

    for (
      const [
        bloodPotency,
        disciplinePowerLevel,
        expected,
      ] of cases
    ) {
      assert.equal(
        getCharacterRouseCheckDiceCount({
          reason: 'disciplinePower',
          bloodPotency,
          disciplinePowerLevel,
        }),
        expected,
      )
    }
  },
)

test(
  '059-A con repetición conserva el mejor dado y nunca duplica Hambre',
  () => {
    const firstSuccess =
      resolveCharacterRouseCheck({
        reason: 'disciplinePower',
        bloodPotency: 3,
        disciplinePowerLevel: 2,
        hungerBefore: 2,
        rolls: [2, 7],
      })

    assert.deepEqual(firstSuccess, {
      rolls: [2, 7],
      selectedResult: 7,
      success: true,
      hungerIncrease: 0,
      consequence: 'none',
    })

    const secondSuccess =
      resolveCharacterRouseCheck({
        reason: 'disciplinePower',
        bloodPotency: 3,
        disciplinePowerLevel: 2,
        hungerBefore: 2,
        rolls: [7, 2],
      })

    assert.equal(
      secondSuccess.selectedResult,
      7,
    )
    assert.equal(
      secondSuccess.hungerIncrease,
      0,
    )

    const failure =
      resolveCharacterRouseCheck({
        reason: 'disciplinePower',
        bloodPotency: 3,
        disciplinePowerLevel: 2,
        hungerBefore: 2,
        rolls: [2, 4],
      })

    assert.deepEqual(failure, {
      rolls: [2, 4],
      selectedResult: 4,
      success: false,
      hungerIncrease: 1,
      consequence: 'none',
    })
  },
)

test(
  '059-A rechaza cantidad de dados incompatible con el contexto',
  () => {
    assert.throws(
      () =>
        resolveCharacterRouseCheck({
          reason: 'bloodSurge',
          hungerBefore: 2,
          rolls: [4, 8],
        }),
      {
        name:
          'InvalidCharacterRouseCheckError',
        violations: [
          'ROUSE_ROLL_COUNT_INVALID',
        ],
      },
    )

    assert.throws(
      () =>
        resolveCharacterRouseCheck({
          reason: 'disciplinePower',
          bloodPotency: 3,
          disciplinePowerLevel: 2,
          hungerBefore: 2,
          rolls: [8],
        }),
      {
        name:
          'InvalidCharacterRouseCheckError',
        violations: [
          'ROUSE_ROLL_COUNT_INVALID',
        ],
      },
    )
  },
)

test(
  '059-A rechaza valores que no sean d10 válidos',
  () => {
    for (const value of [0, 11, 1.5]) {
      assert.throws(
        () =>
          resolveCharacterRouseCheck({
            reason: 'healing',
            hungerBefore: 2,
            rolls: [value],
          }),
        {
          name:
            'InvalidCharacterRouseCheckError',
          violations: [
            'ROUSE_ROLL_INVALID',
          ],
        },
      )
    }
  },
)

test(
  '059-A exige contexto suficiente para repetición de Poder',
  () => {
    assert.throws(
      () =>
        getCharacterRouseCheckDiceCount({
          reason: 'disciplinePower',
        }),
      {
        name:
          'InvalidCharacterRouseCheckError',
        violations: [
          'ROUSE_DISCIPLINE_CONTEXT_INVALID',
        ],
      },
    )

    assert.throws(
      () =>
        getCharacterRouseCheckDiceCount({
          reason: 'disciplinePower',
          bloodPotency: 3,
          disciplinePowerLevel: 0,
        }),
      {
        name:
          'InvalidCharacterRouseCheckError',
        violations: [
          'ROUSE_DISCIPLINE_CONTEXT_INVALID',
        ],
      },
    )
  },
)

test(
  '059-A bloquea controles voluntarios cuando Hambre ya está en 5',
  () => {
    assert.throws(
      () =>
        resolveCharacterRouseCheck({
          reason: 'bloodSurge',
          hungerBefore: 5,
          rolls: [8],
        }),
      {
        name:
          'InvalidCharacterRouseCheckError',
        violations: [
          'ROUSE_VOLUNTARY_AT_HUNGER_FIVE',
        ],
      },
    )
  },
)

test(
  '059-A fallo forzado en Hambre 5 conserva Hambre y exige Frenesí',
  () => {
    const result =
      resolveCharacterRouseCheck({
        reason: 'other',
        hungerBefore: 5,
        forced: true,
        rolls: [2],
      })

    assert.deepEqual(result, {
      rolls: [2],
      selectedResult: 2,
      success: false,
      hungerIncrease: 0,
      consequence:
        'hungerFrenzyTestRequired',
    })
  },
)

test(
  '059-A éxito forzado en Hambre 5 no genera consecuencia especial',
  () => {
    const result =
      resolveCharacterRouseCheck({
        reason: 'other',
        hungerBefore: 5,
        forced: true,
        rolls: [8],
      })

    assert.equal(result.success, true)
    assert.equal(result.hungerIncrease, 0)
    assert.equal(
      result.consequence,
      'none',
    )
  },
)

test(
  '059-A Despertar fallido en Hambre 5 deriva Torpor',
  () => {
    const result =
      resolveCharacterRouseCheck({
        reason: 'awakening',
        hungerBefore: 5,
        forced: true,
        rolls: [1],
      })

    assert.deepEqual(result, {
      rolls: [1],
      selectedResult: 1,
      success: false,
      hungerIncrease: 0,
      consequence: 'torporTriggered',
    })
  },
)

test(
  '059-A sigue usando la validación canónica de Hambre 0..5',
  () => {
    assert.throws(
      () =>
        resolveCharacterRouseCheck({
          reason: 'other',
          hungerBefore: 6,
          forced: true,
          rolls: [8],
        }),
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
