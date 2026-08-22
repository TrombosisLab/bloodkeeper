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
      'obfuscate',
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
  'Ofuscación CORE contiene exactamente 9 poderes',
  () => {
    assert.equal(
      powers.length,
      9,
    )
  },
)

test(
  'la distribución por niveles de Ofuscación es correcta',
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
        4: 2,
        5: 2,
      },
    )
  },
)

test(
  'Ofuscación conserva las ocho keys históricas y añade sólo Ocultar',
  () => {
    assert.deepEqual(
      powers.map(
        (power) =>
          power.key,
      ),
      [
        'obfuscate-cloak-of-shadows',
        'obfuscate-silence-of-death',
        'obfuscate-unseen-passage',
        'obfuscate-mask-of-a-thousand-faces',
        'obfuscate-ghost-in-the-machine',
        'obfuscate-vanish',
        'obfuscate-conceal',
        'obfuscate-cloak-the-gathering',
        'obfuscate-impostors-guise',
      ],
    )
  },
)

test(
  'los nombres visibles de Ofuscación coinciden con la fuente española',
  () => {
    assert.deepEqual(
      powers.map(
        (power) =>
          power.name,
      ),
      [
        'Capa de Sombras',
        'Silencio de la Muerte',
        'Paso Invisible',
        'Máscara de las Mil Caras',
        'Fantasma en la Máquina',
        'Desvanecerse',
        'Ocultar',
        'Encubrimiento de la Concurrencia',
        'Disfraz del Impostor',
      ],
    )
  },
)

test(
  'Ofuscación no conserva poderes DEV',
  () => {
    assert.equal(
      powers.some(
        (power) =>
          power.key.includes(
            '-dev-',
          ) ||
          power.sourceKey ===
            'development',
      ),
      false,
    )
  },
)

test(
  'todos los poderes de Ofuscación usan fuente CORE y página',
  () => {
    assert.equal(
      powers.every(
        (power) =>
          power.sourceKey ===
            'core-v5-es' &&
          Number.isInteger(
            power.sourcePage,
          ),
      ),
      true,
    )
  },
)

test(
  'las páginas de Ofuscación son 261 a 263 según el inicio de cada poder',
  () => {
    assert.deepEqual(
      Object.fromEntries(
        powers.map(
          (power) => [
            power.key,
            power.sourcePage,
          ],
        ),
      ),
      {
        'obfuscate-cloak-of-shadows': 261,
        'obfuscate-silence-of-death': 261,
        'obfuscate-unseen-passage': 261,
        'obfuscate-mask-of-a-thousand-faces': 262,
        'obfuscate-ghost-in-the-machine': 262,
        'obfuscate-vanish': 262,
        'obfuscate-conceal': 262,
        'obfuscate-cloak-the-gathering': 263,
        'obfuscate-impostors-guise': 263,
      },
    )
  },
)

test(
  'las claves de Ofuscación son únicas',
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
  'Desvanecerse requiere Capa de Sombras',
  () => {
    const power =
      getPower(
        'obfuscate-vanish',
      )

    assert.deepEqual(
      power.requirements
        ?.prerequisitePowerKeys,
      [
        'obfuscate-cloak-of-shadows',
      ],
    )

    assert.equal(
      power.requirements?.amalgam,
      undefined,
    )
  },
)

test(
  'Ocultar requiere Amalgama Auspex 3',
  () => {
    const power =
      getPower(
        'obfuscate-conceal',
      )

    assert.deepEqual(
      power.requirements,
      {
        amalgam: {
          disciplineKey: 'auspex',
          minimumLevel: 3,
        },
      },
    )
  },
)

test(
  'Ocultar no es aprendible sin Auspex 3',
  () => {
    const power =
      getPower(
        'obfuscate-conceal',
      )

    const result =
      canLearnDisciplinePower(
        power,
        [
          {
            key: 'obfuscate',
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
  'Ocultar es aprendible con Ofuscación 4 y Auspex 3',
  () => {
    const power =
      getPower(
        'obfuscate-conceal',
      )

    const result =
      canLearnDisciplinePower(
        power,
        [
          {
            key: 'obfuscate',
            value: 4,
            powerKeys: [],
          },
          {
            key: 'auspex',
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
  'Encubrimiento de la Concurrencia no inventa prerrequisitos',
  () => {
    const power =
      getPower(
        'obfuscate-cloak-the-gathering',
      )

    assert.equal(
      power.requirements,
      undefined,
    )
  },
)

test(
  'Disfraz del Impostor sólo requiere Máscara de las Mil Caras',
  () => {
    const power =
      getPower(
        'obfuscate-impostors-guise',
      )

    assert.deepEqual(
      power.requirements,
      {
        prerequisitePowerKeys: [
          'obfuscate-mask-of-a-thousand-faces',
        ],
      },
    )
  },
)

test(
  'Disfraz del Impostor no exige Presencia 3',
  () => {
    const power =
      getPower(
        'obfuscate-impostors-guise',
      )

    const result =
      canLearnDisciplinePower(
        power,
        [
          {
            key: 'obfuscate',
            value: 5,
            powerKeys: [
              'obfuscate-mask-of-a-thousand-faces',
            ],
          },
        ],
        [
          'obfuscate-mask-of-a-thousand-faces',
        ],
      )

    assert.equal(
      result.valid,
      true,
    )
  },
)

test(
  'Colmena No-Muerta sigue reconociendo Ofuscación 2 con la key histórica',
  () => {
    const power =
      disciplinePowerDefinitions.find(
        (candidate) =>
          candidate.key ===
          'animalism-unliving-hive',
      )

    assert.ok(
      power,
      'No existe Colmena No-Muerta',
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
            powerKeys: [
              'obfuscate-cloak-of-shadows',
              'obfuscate-unseen-passage',
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
