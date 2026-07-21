import assert from 'node:assert/strict'
import test from 'node:test'

import {
  disciplinePowerDefinitions,
} from '../src/features/character-creation/data/discipline-power-definitions.ts'

import {
  canLearnDisciplinePower,
} from '../src/features/character-creation/domain/discipline-power-rules.ts'

const potencePowers =
  disciplinePowerDefinitions.filter(
    (power) =>
      power.disciplineKey ===
      'potence',
  )

function getPower(key) {
  const power =
    potencePowers.find(
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
  'Potencia del manual básico contiene exactamente 9 poderes',
  () => {
    assert.equal(
      potencePowers.length,
      9,
    )
  },
)

test(
  'la distribución por niveles de Potencia es correcta',
  () => {
    const distribution =
      Object.fromEntries(
        [1, 2, 3, 4, 5].map(
          (level) => [
            level,
            potencePowers.filter(
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
        3: 3,
        4: 1,
        5: 2,
      },
    )
  },
)

test(
  'todos los poderes de Potencia proceden del manual básico',
  () => {
    assert.equal(
      potencePowers.every(
        (power) =>
          power.sourceKey ===
          'core-v5-es',
      ),
      true,
    )
  },
)

test(
  'Potencia no conserva poderes temporales DEV',
  () => {
    assert.equal(
      potencePowers.some(
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
  'los poderes de nivel 1 son Cuerpo Letal y Salto Vertiginoso',
  () => {
    assert.deepEqual(
      potencePowers
        .filter(
          (power) =>
            power.level === 1,
        )
        .map(
          (power) =>
            power.name,
        ),
      [
        'Cuerpo Letal',
        'Salto Vertiginoso',
      ],
    )
  },
)

test(
  'Chispa de Ira requiere Presencia 3',
  () => {
    const power =
      getPower(
        'potence-spark-of-rage',
      )

    assert.deepEqual(
      power.requirements?.amalgam,
      {
        disciplineKey:
          'presence',

        minimumLevel:
          3,
      },
    )
  },
)

test(
  'Chispa de Ira no es aprendible sin Presencia 3',
  () => {
    const power =
      getPower(
        'potence-spark-of-rage',
      )

    const result =
      canLearnDisciplinePower(
        power,
        [
          {
            key: 'potence',
            value: 3,
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
  'Chispa de Ira es aprendible con Potencia 3 y Presencia 3',
  () => {
    const power =
      getPower(
        'potence-spark-of-rage',
      )

    const result =
      canLearnDisciplinePower(
        power,
        [
          {
            key: 'potence',
            value: 3,
            powerKeys: [],
          },
          {
            key: 'presence',
            value: 3,
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
  'las páginas de referencia de Potencia están entre 263 y 266',
  () => {
    assert.equal(
      potencePowers.every(
        (power) =>
          power.sourcePage >= 263 &&
          power.sourcePage <= 266,
      ),
      true,
    )
  },
)
