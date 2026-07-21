import assert from 'node:assert/strict'
import test from 'node:test'

import {
  BLOOD_SORCERY_RITUAL_DEFINITIONS,
} from '../src/features/character-creation/data/blood-sorcery-ritual-definitions.ts'

import {
  validateInitialBloodSorceryRituals,
} from '../src/features/character-creation/domain/blood-sorcery-ritual-rules.ts'

const BLOOD_WALK =
  'blood-sorcery-ritual-blood-walk'

test(
  'sin Hechicería de Sangre y sin Rituales la creación es válida',
  () => {
    const result =
      validateInitialBloodSorceryRituals(
        BLOOD_SORCERY_RITUAL_DEFINITIONS,
        [],
        0,
      )

    assert.equal(
      result.valid,
      true,
    )

    assert.deepEqual(
      result.errors,
      [],
    )
  },
)

test(
  'sin Hechicería de Sangre no se permiten Rituales',
  () => {
    const result =
      validateInitialBloodSorceryRituals(
        BLOOD_SORCERY_RITUAL_DEFINITIONS,
        [
          BLOOD_WALK,
        ],
        0,
      )

    assert.equal(
      result.valid,
      false,
    )
  },
)

test(
  'con Hechicería de Sangre 1 falta exactamente un Ritual inicial',
  () => {
    const result =
      validateInitialBloodSorceryRituals(
        BLOOD_SORCERY_RITUAL_DEFINITIONS,
        [],
        1,
      )

    assert.equal(
      result.valid,
      false,
    )

    assert.equal(
      result.errors.includes(
        'Debes seleccionar exactamente un Ritual inicial de nivel 1.',
      ),
      true,
    )
  },
)

test(
  'con Hechicería de Sangre 1 acepta un Ritual CORE de nivel 1',
  () => {
    const result =
      validateInitialBloodSorceryRituals(
        BLOOD_SORCERY_RITUAL_DEFINITIONS,
        [
          BLOOD_WALK,
        ],
        1,
      )

    assert.equal(
      result.valid,
      true,
    )

    assert.deepEqual(
      result.errors,
      [],
    )
  },
)

test(
  'con Hechicería de Sangre 2 sigue requiriendo exactamente un único Ritual inicial',
  () => {
    const result =
      validateInitialBloodSorceryRituals(
        BLOOD_SORCERY_RITUAL_DEFINITIONS,
        [
          BLOOD_WALK,
        ],
        2,
      )

    assert.equal(
      result.valid,
      true,
    )
  },
)

test(
  'dos Rituales iniciales son inválidos',
  () => {
    const result =
      validateInitialBloodSorceryRituals(
        BLOOD_SORCERY_RITUAL_DEFINITIONS,
        [
          'blood-sorcery-ritual-blood-walk',
          'blood-sorcery-ritual-craft-bloodstone',
        ],
        2,
      )

    assert.equal(
      result.valid,
      false,
    )
  },
)

test(
  'un Ritual duplicado es inválido',
  () => {
    const result =
      validateInitialBloodSorceryRituals(
        BLOOD_SORCERY_RITUAL_DEFINITIONS,
        [
          BLOOD_WALK,
          BLOOD_WALK,
        ],
        1,
      )

    assert.equal(
      result.valid,
      false,
    )

    assert.equal(
      result.errors.includes(
        'No puede haber Rituales duplicados.',
      ),
      true,
    )
  },
)

test(
  'una clave de Ritual inexistente es inválida',
  () => {
    const result =
      validateInitialBloodSorceryRituals(
        BLOOD_SORCERY_RITUAL_DEFINITIONS,
        [
          'ritual-inexistente',
        ],
        1,
      )

    assert.equal(
      result.valid,
      false,
    )

    assert.equal(
      result.errors.includes(
        'El Ritual seleccionado no existe en el catálogo.',
      ),
      true,
    )
  },
)

test(
  'un Ritual de nivel superior a 1 es inválido durante creación',
  () => {
    const definitions = [
      ...BLOOD_SORCERY_RITUAL_DEFINITIONS,

      {
        key: 'ritual-test-level-2',
        name: 'Ritual técnico nivel 2',
        level: 2,
        sourceKey: 'core-v5-es',
      },
    ]

    const result =
      validateInitialBloodSorceryRituals(
        definitions,
        [
          'ritual-test-level-2',
        ],
        2,
      )

    assert.equal(
      result.valid,
      false,
    )

    assert.equal(
      result.errors.some(
        (error) =>
          error.includes(
            'nivel 1',
          ),
      ),
      true,
    )
  },
)
