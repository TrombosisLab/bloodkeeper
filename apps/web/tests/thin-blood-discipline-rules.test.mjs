import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getAvailableDisciplinesForClan,
  normalizeDisciplinesForClan,
  updateDiscipline,
  validateDisciplines,
} from '../src/features/character-creation/domain/discipline-rules.ts'

test(
  'Sangre Débil no expone Disciplinas de clan convencionales',
  () => {
    assert.deepEqual(
      getAvailableDisciplinesForClan(
        'thinBlood',
      ),
      [],
    )
  },
)

test(
  'Sangre Débil puede completar la fase sin distribución inicial 2 + 1',
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

test(
  'Sangre Débil no puede recibir una Disciplina mediante el editor convencional',
  () => {
    assert.deepEqual(
      updateDiscipline(
        [],
        'thinBlood',
        'auspex',
        1,
      ),
      [],
    )

    assert.deepEqual(
      updateDiscipline(
        [],
        'thinBlood',
        'thinBloodAlchemy',
        1,
      ),
      [],
    )
  },
)

test(
  'normalizar Sangre Débil elimina Disciplinas convencionales',
  () => {
    assert.deepEqual(
      normalizeDisciplinesForClan(
        [
          {
            key: 'auspex',
            value: 1,
            powerKeys: [],
          },
        ],
        'thinBlood',
      ),
      [],
    )
  },
)

test(
  'Sangre Débil rechaza estado de Disciplinas convencionales inyectado',
  () => {
    const result =
      validateDisciplines(
        [
          {
            key: 'auspex',
            value: 1,
            powerKeys: [],
          },
        ],
        'thinBlood',
      )

    assert.equal(
      result.valid,
      false,
    )

    assert.ok(
      result.errors.length > 0,
    )
  },
)
