import assert from 'node:assert/strict'
import test from 'node:test'

import {
  disciplinePowerDefinitions,
} from '../src/features/character-creation/data/discipline-power-definitions.ts'

import {
  canLearnDisciplinePower,
} from '../src/features/character-creation/domain/discipline-power-rules.ts'

const powers =
  disciplinePowerDefinitions.filter(
    (power) =>
      power.disciplineKey ===
      'auspex',
  )

function getPower(key) {
  const power =
    powers.find(
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
  'Auspex del manual básico contiene exactamente 9 poderes',
  () => {
    assert.equal(
      powers.length,
      9,
    )
  },
)

test(
  'la distribución por niveles de Auspex es correcta',
  () => {
    const distribution =
      Object.fromEntries(
        [1, 2, 3, 4, 5].map(
          (level) => [
            level,
            powers.filter(
              (power) =>
                power.level === level,
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
        4: 1,
        5: 3,
      },
    )
  },
)

test(
  'todos los poderes de Auspex usan la fuente core',
  () => {
    assert.equal(
      powers.every(
        (power) =>
          power.sourceKey ===
          'core-v5-es',
      ),
      true,
    )
  },
)

test(
  'Auspex no conserva poderes DEV',
  () => {
    assert.equal(
      powers.some(
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
  'los poderes de nivel 1 son Sentidos Agudizados y Sentir lo Invisible',
  () => {
    assert.deepEqual(
      powers
        .filter(
          (power) =>
            power.level === 1,
        )
        .map(
          (power) =>
            power.name,
        ),
      [
        'Sentidos Agudizados',
        'Sentir lo Invisible',
      ],
    )
  },
)

test(
  'Posesión requiere Dominación 3',
  () => {
    const power =
      getPower(
        'auspex-possession',
      )

    assert.deepEqual(
      power.requirements?.amalgam,
      {
        disciplineKey:
          'dominate',

        minimumLevel:
          3,
      },
    )
  },
)

test(
  'Posesión no es aprendible sin Dominación 3',
  () => {
    const power =
      getPower(
        'auspex-possession',
      )

    const result =
      canLearnDisciplinePower(
        power,
        [
          {
            key: 'auspex',
            value: 5,
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
  'Posesión es aprendible con Auspex 5 y Dominación 3',
  () => {
    const power =
      getPower(
        'auspex-possession',
      )

    const result =
      canLearnDisciplinePower(
        power,
        [
          {
            key: 'auspex',
            value: 5,
            powerKeys: [],
          },
          {
            key: 'dominate',
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
  'todos los poderes de Auspex tienen trazabilidad bibliográfica',
  () => {
    assert.equal(
      powers.every(
        (power) =>
          Number.isInteger(
            power.sourcePage,
          ) &&
          power.sourcePage >= 249 &&
          power.sourcePage <= 252,
      ),
      true,
    )
  },
)
