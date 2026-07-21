import assert from 'node:assert/strict'
import test from 'node:test'

import {
  disciplinePowerDefinitions,
} from '../src/features/character-creation/data/discipline-power-definitions.ts'

import {
  canLearnDisciplinePower,
} from '../src/features/character-creation/domain/discipline-power-rules.ts'

const animalismPowers =
  disciplinePowerDefinitions.filter(
    (power) =>
      power.disciplineKey ===
      'animalism',
  )

function getPower(key) {
  const power =
    animalismPowers.find(
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
  'Animalismo del manual básico contiene exactamente 9 poderes',
  () => {
    assert.equal(
      animalismPowers.length,
      9,
    )
  },
)

test(
  'la distribución por niveles de Animalismo es correcta',
  () => {
    const distribution =
      Object.fromEntries(
        [1, 2, 3, 4, 5].map(
          (level) => [
            level,
            animalismPowers.filter(
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
  'todos los poderes de Animalismo proceden del manual básico',
  () => {
    assert.equal(
      animalismPowers.every(
        (power) =>
          power.sourceKey ===
          'core-v5-es',
      ),
      true,
    )
  },
)

test(
  'Animalismo no conserva poderes temporales DEV',
  () => {
    assert.equal(
      animalismPowers.some(
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
  'los poderes de nivel 1 son Sentir a la Bestia y Vínculo con Famulus',
  () => {
    assert.deepEqual(
      animalismPowers
        .filter(
          (power) =>
            power.level === 1,
        )
        .map(
          (power) =>
            power.name,
        ),
      [
        'Sentir a la Bestia',
        'Vínculo con Famulus',
      ],
    )
  },
)

test(
  'Colmena No-Muerta requiere Ofuscación 2',
  () => {
    const power =
      getPower(
        'animalism-unliving-hive',
      )

    assert.deepEqual(
      power.requirements?.amalgam,
      {
        disciplineKey:
          'obfuscate',

        minimumLevel:
          2,
      },
    )
  },
)

test(
  'Colmena No-Muerta no es aprendible sin Ofuscación 2',
  () => {
    const power =
      getPower(
        'animalism-unliving-hive',
      )

    const result =
      canLearnDisciplinePower(
        power,
        [
          {
            key: 'animalism',
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
  'Colmena No-Muerta es aprendible con Animalismo 3 y Ofuscación 2',
  () => {
    const power =
      getPower(
        'animalism-unliving-hive',
      )

    const result =
      canLearnDisciplinePower(
        power,
        [
          {
            key: 'animalism',
            value: 3,
            powerKeys: [],
          },
          {
            key: 'obfuscate',
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
  'las páginas de referencia de Animalismo están entre 245 y 248',
  () => {
    assert.equal(
      animalismPowers.every(
        (power) =>
          power.sourcePage >= 245 &&
          power.sourcePage <= 248,
      ),
      true,
    )
  },
)
