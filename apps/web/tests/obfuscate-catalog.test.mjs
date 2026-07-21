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
  'Ofuscación CORE contiene exactamente 8 poderes',
  () => {
    assert.equal(
      powers.length,
      8,
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
        4: 1,
        5: 2,
      },
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
  'todos los poderes de Ofuscación usan fuente CORE',
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
  'los poderes de nivel 1 son Capa de Sombras y Silencio de la Muerte',
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
        'Capa de Sombras',
        'Silencio de la Muerte',
      ],
    )
  },
)

test(
  'Ofuscación cubre todos los niveles 1 a 5',
  () => {
    assert.deepEqual(
      [
        ...new Set(
          powers.map(
            (power) =>
              power.level,
          ),
        ),
      ].sort(),
      [1, 2, 3, 4, 5],
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
  'Desvanecimiento requiere Capa de Sombras',
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
  },
)

test(
  'Encubrimiento de la Asamblea requiere Paso Inadvertido',
  () => {
    const power =
      getPower(
        'obfuscate-cloak-the-gathering',
      )

    assert.deepEqual(
      power.requirements
        ?.prerequisitePowerKeys,
      [
        'obfuscate-unseen-passage',
      ],
    )
  },
)

test(
  'Impostura requiere Máscara de las Mil Caras y Presencia 3',
  () => {
    const power =
      getPower(
        'obfuscate-impostors-guise',
      )

    assert.deepEqual(
      power.requirements
        ?.prerequisitePowerKeys,
      [
        'obfuscate-mask-of-a-thousand-faces',
      ],
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
  'Impostura no es aprendible sin Presencia 3',
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
        [],
      )

    assert.equal(
      result.valid,
      false,
    )
  },
)

test(
  'Impostura es aprendible con sus requisitos completos',
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
          {
            key: 'presence',
            value: 3,
            powerKeys: [],
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
  'Colmena No-Muerta sigue reconociendo Ofuscación 2 real',
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
