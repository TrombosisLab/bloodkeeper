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
      'dominate',
  )

function getPower(key) {
  const power =
    disciplinePowerDefinitions.find(
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
  'Dominación del manual básico contiene exactamente 9 poderes',
  () => {
    assert.equal(
      powers.length,
      9,
    )
  },
)

test(
  'la distribución por niveles de Dominación es correcta',
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
  'Dominación usa exclusivamente contenido core',
  () => {
    assert.equal(
      powers.every(
        (power) =>
          power.sourceKey ===
          'core-v5-es' &&
          !power.key.includes(
            '-dev-',
          ),
      ),
      true,
    )
  },
)

test(
  'los poderes de nivel 1 son Nublar la Memoria y Compelir',
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
        'Nublar la Memoria',
        'Compelir',
      ],
    )
  },
)

test(
  'Dominación cubre todos los niveles 1 a 5',
  () => {
    const levels = [
      ...new Set(
        powers.map(
          (power) =>
            power.level,
        ),
      ),
    ].sort()

    assert.deepEqual(
      levels,
      [1, 2, 3, 4, 5],
    )
  },
)

test(
  'las claves de Dominación son únicas',
  () => {
    const keys =
      powers.map(
        (power) =>
          power.key,
      )

    assert.equal(
      new Set(keys).size,
      keys.length,
    )
  },
)

test(
  'todos los poderes tienen trazabilidad bibliográfica',
  () => {
    assert.equal(
      powers.every(
        (power) =>
          Number.isInteger(
            power.sourcePage,
          ) &&
          power.sourcePage >= 255 &&
          power.sourcePage <= 257,
      ),
      true,
    )
  },
)

test(
  'Posesión de Auspex reconoce Dominación 3 real',
  () => {
    const possession =
      getPower(
        'auspex-possession',
      )

    const result =
      canLearnDisciplinePower(
        possession,
        [
          {
            key: 'auspex',
            value: 5,
            powerKeys: [],
          },
          {
            key: 'dominate',
            value: 3,
            powerKeys: [
              'dominate-compel',
              'dominate-mesmerize',
              'dominate-submerged-directive',
            ],
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
  'Voz Irresistible reconoce Dominación 1 real',
  () => {
    const irresistibleVoice =
      getPower(
        'presence-irresistible-voice',
      )

    const result =
      canLearnDisciplinePower(
        irresistibleVoice,
        [
          {
            key: 'presence',
            value: 4,
            powerKeys: [],
          },
          {
            key: 'dominate',
            value: 1,
            powerKeys: [
              'dominate-compel',
            ],
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
  'las relaciones cruzadas siguen rechazándose sin Dominación suficiente',
  () => {
    const possession =
      getPower(
        'auspex-possession',
      )

    const result =
      canLearnDisciplinePower(
        possession,
        [
          {
            key: 'auspex',
            value: 5,
            powerKeys: [],
          },
          {
            key: 'dominate',
            value: 2,
            powerKeys: [
              'dominate-compel',
              'dominate-mesmerize',
            ],
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
