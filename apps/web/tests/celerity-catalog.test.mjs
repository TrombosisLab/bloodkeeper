import assert from 'node:assert/strict'
import test from 'node:test'

import {
  disciplinePowerDefinitions,
} from '../src/features/character-creation/data/discipline-power-definitions.ts'

import {
  canLearnDisciplinePower,
} from '../src/features/character-creation/domain/discipline-power-rules.ts'

const celerityPowers =
  disciplinePowerDefinitions.filter(
    (power) =>
      power.disciplineKey ===
      'celerity',
  )

function getPower(key) {
  const power =
    celerityPowers.find(
      (candidate) =>
        candidate.key === key,
    )

  assert.ok(
    power,
    `No existe el poder ${key}`,
  )

  return power
}

test(
  'Celeridad del manual básico contiene exactamente 9 poderes',
  () => {
    assert.equal(
      celerityPowers.length,
      9,
    )
  },
)

test(
  'la distribución por niveles de Celeridad es correcta',
  () => {
    const distribution =
      Object.fromEntries(
        [1, 2, 3, 4, 5].map(
          (level) => [
            level,
            celerityPowers.filter(
              (power) =>
                power.level ===
                level,
            ).length,
          ],
        ),
      )

    assert.deepEqual(
      distribution,
      {
        1: 2,
        2: 1,
        3: 2,
        4: 2,
        5: 2,
      },
    )
  },
)

test(
  'todos los poderes de Celeridad proceden del manual básico',
  () => {
    assert.equal(
      celerityPowers.every(
        (power) =>
          power.sourceKey ===
          'core-v5-es',
      ),
      true,
    )
  },
)

test(
  'Celeridad no conserva poderes temporales DEV',
  () => {
    assert.equal(
      celerityPowers.some(
        (power) =>
          power.key.includes(
            '-dev-',
          ),
      ),
      false,
    )
  },
)

test(
  'los dos poderes de nivel 1 son Gracia Felina y Reflejos Rápidos',
  () => {
    assert.deepEqual(
      celerityPowers
        .filter(
          (power) =>
            power.level === 1,
        )
        .map(
          (power) =>
            power.name,
        ),
      [
        'Gracia Felina',
        'Reflejos Rápidos',
      ],
    )
  },
)

test(
  'Puntería Certera requiere Auspex 2',
  () => {
    const power =
      getPower(
        'celerity-unerring-aim',
      )

    assert.deepEqual(
      power.requirements?.amalgam,
      {
        disciplineKey:
          'auspex',

        minimumLevel:
          2,
      },
    )
  },
)

test(
  'Puntería Certera no es aprendible sin Auspex 2',
  () => {
    const power =
      getPower(
        'celerity-unerring-aim',
      )

    const result =
      canLearnDisciplinePower(
        power,
        [
          {
            key: 'celerity',
            value: 4,
            powerKeys: [],
          },
        ],
        [],
      )

    assert.equal(
      result.valid,
      false,
    )
  },
)

test(
  'Puntería Certera es aprendible con Celeridad 4 y Auspex 2',
  () => {
    const power =
      getPower(
        'celerity-unerring-aim',
      )

    const result =
      canLearnDisciplinePower(
        power,
        [
          {
            key: 'celerity',
            value: 4,
            powerKeys: [],
          },
          {
            key: 'auspex',
            value: 2,
            powerKeys: [],
          },
        ],
        [],
      )

    assert.equal(
      result.valid,
      true,
    )
  },
)

test(
  'las páginas de referencia de Celeridad están entre 252 y 254',
  () => {
    assert.equal(
      celerityPowers.every(
        (power) =>
          power.sourcePage >= 252 &&
          power.sourcePage <= 254,
      ),
      true,
    )
  },
)
