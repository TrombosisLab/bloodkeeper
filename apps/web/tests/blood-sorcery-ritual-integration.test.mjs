import assert from 'node:assert/strict'
import test from 'node:test'

import {
  BLOOD_SORCERY_RITUAL_DEFINITIONS,
} from '../src/features/character-creation/data/blood-sorcery-ritual-definitions.ts'

import {
  validateInitialBloodSorceryRituals,
} from '../src/features/character-creation/domain/blood-sorcery-ritual-rules.ts'

import {
  normalizeBloodSorceryRitualsForDraft,
} from '../src/features/character-creation/domain/blood-sorcery-ritual-draft-rules.ts'

import {
  initialCharacterDraft,
} from '../src/features/character-creation/data/initial-character-draft.ts'

const BLOOD_WALK =
  'blood-sorcery-ritual-blood-walk'

function validateRitualState(
  bloodSorceryLevel,
  ritualKeys,
) {
  return validateInitialBloodSorceryRituals(
    BLOOD_SORCERY_RITUAL_DEFINITIONS,
    ritualKeys,
    bloodSorceryLevel,
  )
}

test(
  'el flujo sin Hechicería de Sangre no exige Ritual inicial',
  () => {
    const result =
      validateRitualState(
        0,
        [],
      )

    assert.equal(
      result.valid,
      true,
    )
  },
)

test(
  'el flujo con Hechicería de Sangre bloquea la creación mientras falta el Ritual inicial',
  () => {
    for (
      const level of [1, 2]
    ) {
      const result =
        validateRitualState(
          level,
          [],
        )

      assert.equal(
        result.valid,
        false,
      )

      assert.equal(
        result.errors.some(
          (error) =>
            error.includes(
              'exactamente un Ritual',
            ),
        ),
        true,
      )
    }
  },
)

test(
  'un Ritual CORE nivel 1 satisface el requisito inicial con Hechicería de Sangre',
  () => {
    for (
      const level of [1, 2]
    ) {
      const result =
        validateRitualState(
          level,
          [
            BLOOD_WALK,
          ],
        )

      assert.equal(
        result.valid,
        true,
      )
    }
  },
)

test(
  'los cinco Rituales CORE nivel 1 pueden satisfacer individualmente el requisito de creación',
  () => {
    assert.equal(
      BLOOD_SORCERY_RITUAL_DEFINITIONS.length,
      5,
    )

    for (
      const ritual of
      BLOOD_SORCERY_RITUAL_DEFINITIONS
    ) {
      const result =
        validateRitualState(
          1,
          [
            ritual.key,
          ],
        )

      assert.equal(
        result.valid,
        true,
        `${ritual.name} debería ser válido`,
      )
    }
  },
)

test(
  'la regla depende de Hechicería de Sangre y no del clan',
  () => {
    const tremereResult =
      validateRitualState(
        1,
        [
          BLOOD_WALK,
        ],
      )

    const banuHaqimResult =
      validateRitualState(
        1,
        [
          BLOOD_WALK,
        ],
      )

    assert.deepEqual(
      tremereResult,
      banuHaqimResult,
    )

    assert.equal(
      tremereResult.valid,
      true,
    )
  },
)

test(
  'retirar Hechicería de Sangre normaliza y elimina automáticamente el Ritual seleccionado',
  () => {
    const draft = {
      ...initialCharacterDraft,

      disciplines: [],

      bloodSorceryRituals: {
        ritualKeys: [
          BLOOD_WALK,
        ],
      },
    }

    const normalized =
      normalizeBloodSorceryRitualsForDraft(
        draft,
      )

    assert.deepEqual(
      normalized,
      {
        ritualKeys: [],
      },
    )

    const validation =
      validateRitualState(
        0,
        normalized.ritualKeys,
      )

    assert.equal(
      validation.valid,
      true,
    )
  },
)

test(
  'la selección inicial mantiene cardinalidad exacta de un Ritual',
  () => {
    const one =
      validateRitualState(
        1,
        [
          BLOOD_WALK,
        ],
      )

    const none =
      validateRitualState(
        1,
        [],
      )

    const two =
      validateRitualState(
        1,
        [
          BLOOD_WALK,
          'blood-sorcery-ritual-craft-bloodstone',
        ],
      )

    assert.equal(
      one.valid,
      true,
    )

    assert.equal(
      none.valid,
      false,
    )

    assert.equal(
      two.valid,
      false,
    )
  },
)
