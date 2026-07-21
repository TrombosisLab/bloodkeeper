import assert from 'node:assert/strict'
import test from 'node:test'

import {
  caitiffAvailableDisciplines,
  getAvailableDisciplinesForClan,
  normalizeDisciplinesForClan,
  randomizeCaitiffDisciplines,
  updateDiscipline,
  validateDisciplines,
} from '../src/features/character-creation/domain/discipline-rules.ts'

test(
  'Caitiff puede elegir todas las Disciplinas vampíricas salvo Alquimia de Sangre Débil',
  () => {
    const available =
      getAvailableDisciplinesForClan(
        'caitiff',
      )

    assert.deepEqual(
      available,
      caitiffAvailableDisciplines,
    )

    assert.equal(
      available.includes(
        'thinBloodAlchemy',
      ),
      false,
    )
  },
)

test(
  'Caitiff acepta exactamente una distribución 2 + 1',
  () => {
    assert.equal(
      validateDisciplines(
        [
          {
            key: 'auspex',
            value: 2,
            powerKeys: [],
          },
          {
            key: 'potence',
            value: 1,
            powerKeys: [],
          },
        ],
        'caitiff',
      ).valid,
      true,
    )
  },
)

test(
  'Caitiff rechaza una sola Disciplina',
  () => {
    assert.equal(
      validateDisciplines(
        [
          {
            key: 'auspex',
            value: 2,
            powerKeys: [],
          },
        ],
        'caitiff',
      ).valid,
      false,
    )
  },
)

test(
  'Caitiff rechaza dos Disciplinas a nivel 1',
  () => {
    assert.equal(
      validateDisciplines(
        [
          {
            key: 'auspex',
            value: 1,
            powerKeys: [],
          },
          {
            key: 'potence',
            value: 1,
            powerKeys: [],
          },
        ],
        'caitiff',
      ).valid,
      false,
    )
  },
)

test(
  'Caitiff rechaza tres Disciplinas aunque sumen cuatro puntos',
  () => {
    assert.equal(
      validateDisciplines(
        [
          {
            key: 'auspex',
            value: 2,
            powerKeys: [],
          },
          {
            key: 'potence',
            value: 1,
            powerKeys: [],
          },
          {
            key: 'obfuscate',
            value: 1,
            powerKeys: [],
          },
        ],
        'caitiff',
      ).valid,
      false,
    )
  },
)

test(
  'Caitiff no puede seleccionar Alquimia de Sangre Débil',
  () => {
    assert.deepEqual(
      updateDiscipline(
        [],
        'caitiff',
        'thinBloodAlchemy',
        1,
      ),
      [],
    )
  },
)

test(
  'Caitiff puede seleccionar una Disciplina libremente',
  () => {
    assert.deepEqual(
      updateDiscipline(
        [],
        'caitiff',
        'auspex',
        2,
      ),
      [
        {
          key: 'auspex',
          value: 2,
          powerKeys: [],
        },
      ],
    )
  },
)

test(
  'normalizar Caitiff elimina Alquimia de Sangre Débil',
  () => {
    const result =
      normalizeDisciplinesForClan(
        [
          {
            key: 'auspex',
            value: 2,
            powerKeys: [],
          },
          {
            key: 'potence',
            value: 1,
            powerKeys: [],
          },
          {
            key: 'thinBloodAlchemy',
            value: 1,
            powerKeys: [],
          },
        ],
        'caitiff',
      )

    assert.deepEqual(
      result.map(
        (discipline) =>
          discipline.key,
      ),
      [
        'auspex',
        'potence',
      ],
    )
  },
)

test(
  'reparto aleatorio Caitiff siempre genera 2 + 1 en dos Disciplinas distintas',
  () => {
    for (
      let iteration = 0;
      iteration < 500;
      iteration += 1
    ) {
      const result =
        randomizeCaitiffDisciplines()

      assert.equal(
        validateDisciplines(
          result,
          'caitiff',
        ).valid,
        true,
      )

      assert.equal(
        result.length,
        2,
      )

      assert.equal(
        new Set(
          result.map(
            (discipline) =>
              discipline.key,
          ),
        ).size,
        2,
      )
    }
  },
)
