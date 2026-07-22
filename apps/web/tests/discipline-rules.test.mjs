import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getAvailableDisciplinesForClan,
  normalizeDisciplinesForClan,
  randomizeClanDisciplines,
  updateDiscipline,
  validateDisciplines,
} from '../src/features/character-creation/domain/discipline-rules.ts'

test(
  'Brujah solo expone sus tres disciplinas de clan',
  () => {
    assert.deepEqual(
      getAvailableDisciplinesForClan(
        'brujah',
      ),
      [
        'celerity',
        'potence',
        'presence',
      ],
    )
  },
)

test(
  'una distribución 2 y 1 es válida',
  () => {
    const result =
      validateDisciplines(
        [
          {
            key: 'celerity',
            value: 2,
            powerKeys: [],
          },
          {
            key: 'potence',
            value: 1,
            powerKeys: [],
          },
        ],
        'brujah',
      )

    assert.equal(
      result.valid,
      true,
    )
  },
)

test(
  'una distribución incorrecta es inválida',
  () => {
    const result =
      validateDisciplines(
        [
          {
            key: 'celerity',
            value: 1,
            powerKeys: [],
          },
        ],
        'brujah',
      )

    assert.equal(
      result.valid,
      false,
    )
  },
)

test(
  'impide añadir disciplina fuera del clan',
  () => {
    const result =
      updateDiscipline(
        [],
        'brujah',
        'auspex',
        2,
      )

    assert.deepEqual(
      result,
      [],
    )
  },
)

test(
  'cambiar clan elimina disciplinas incompatibles',
  () => {
    const result =
      normalizeDisciplinesForClan(
        [
          {
            key: 'celerity',
            value: 2,
            powerKeys: [],
          },
          {
            key: 'presence',
            value: 1,
            powerKeys: [],
          },
        ],
        'gangrel',
      )

    assert.deepEqual(
      result,
      [],
    )
  },
)

test(
  'el reparto aleatorio de clan siempre es válido',
  () => {
    for (
      let iteration = 0;
      iteration < 500;
      iteration += 1
    ) {
      const result =
        randomizeClanDisciplines(
          'brujah',
        )

      assert.equal(
        validateDisciplines(
          result,
          'brujah',
        ).valid,
        true,
      )
    }
  },
)

test(
  'Caitiff se mantiene como regla especial pendiente',
  () => {
    assert.equal(
      validateDisciplines(
        [],
        'caitiff',
      ).valid,
      false,
    )
  },
)

test(
  'Sangre Débil usa una regla especial sin distribución inicial 2 + 1',
  () => {
    assert.equal(
      validateDisciplines(
        [],
        'thinBlood',
      ).valid,
      true,
    )
  },
)
