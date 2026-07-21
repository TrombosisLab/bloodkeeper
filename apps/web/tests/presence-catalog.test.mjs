import assert from 'node:assert/strict'
import test from 'node:test'

import {
  disciplinePowerDefinitions,
} from '../src/features/character-creation/data/discipline-power-definitions.ts'

import {
  canLearnDisciplinePower,
} from '../src/features/character-creation/domain/discipline-power-rules.ts'

const presencePowers =
  disciplinePowerDefinitions.filter(
    (power) =>
      power.disciplineKey ===
      'presence',
  )

function getPower(key) {
  const power =
    presencePowers.find(
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
  'Presencia del manual básico contiene exactamente 9 poderes',
  () => {
    assert.equal(
      presencePowers.length,
      9,
    )
  },
)

test(
  'la distribución por niveles de Presencia es correcta',
  () => {
    const distribution =
      Object.fromEntries(
        [1, 2, 3, 4, 5].map(
          (level) => [
            level,
            presencePowers.filter(
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
  'todos los poderes de Presencia proceden del manual básico',
  () => {
    assert.equal(
      presencePowers.every(
        (power) =>
          power.sourceKey ===
          'core-v5-es',
      ),
      true,
    )
  },
)

test(
  'Presencia no conserva poderes temporales DEV',
  () => {
    assert.equal(
      presencePowers.some(
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
  'los poderes de nivel 1 son Atemorizar y Fascinación',
  () => {
    assert.deepEqual(
      presencePowers
        .filter(
          (power) =>
            power.level === 1,
        )
        .map(
          (power) =>
            power.name,
        ),
      [
        'Atemorizar',
        'Fascinación',
      ],
    )
  },
)

test(
  'Voz Irresistible requiere Dominación 1',
  () => {
    const power =
      getPower(
        'presence-irresistible-voice',
      )

    assert.deepEqual(
      power.requirements?.amalgam,
      {
        disciplineKey:
          'dominate',

        minimumLevel:
          1,
      },
    )
  },
)

test(
  'Voz Irresistible no es aprendible sin Dominación 1',
  () => {
    const power =
      getPower(
        'presence-irresistible-voice',
      )

    const result =
      canLearnDisciplinePower(
        power,
        [
          {
            key: 'presence',
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
  'Voz Irresistible es aprendible con Presencia 4 y Dominación 1',
  () => {
    const power =
      getPower(
        'presence-irresistible-voice',
      )

    const result =
      canLearnDisciplinePower(
        power,
        [
          {
            key: 'presence',
            value: 4,
            powerKeys: [],
          },
          {
            key: 'dominate',
            value: 1,
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
  'las páginas de referencia de Presencia están entre 267 y 269',
  () => {
    assert.equal(
      presencePowers.every(
        (power) =>
          power.sourcePage >= 267 &&
          power.sourcePage <= 269,
      ),
      true,
    )
  },
)
