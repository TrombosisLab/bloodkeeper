import assert from 'node:assert/strict'
import test from 'node:test'

import {
  disciplinePowerDefinitions,
} from '../src/features/character-creation/data/discipline-power-definitions.ts'

import {
  updateSelectedPower,
  validateSelectedPowers,
} from '../src/features/character-creation/domain/discipline-power-rules.ts'

import {
  validateDisciplines,
} from '../src/features/character-creation/domain/discipline-rules.ts'

const gangrelDisciplineKeys = [
  'animalism',
  'fortitude',
  'protean',
]

const gangrelPowers =
  disciplinePowerDefinitions.filter(
    (power) =>
      gangrelDisciplineKeys.includes(
        power.disciplineKey,
      ),
  )

function powersFor(
  disciplineKey,
) {
  return gangrelPowers.filter(
    (power) =>
      power.disciplineKey ===
      disciplineKey,
  )
}

test(
  'Gangrel tiene catálogo real para sus tres Disciplinas',
  () => {
    assert.equal(
      powersFor('animalism').length,
      9,
    )

    assert.equal(
      powersFor('fortitude').length,
      9,
    )

    assert.equal(
      powersFor('protean').length,
      8,
    )

    assert.equal(
      gangrelPowers.length,
      26,
    )
  },
)

test(
  'ningún poder de las Disciplinas Gangrel usa contenido DEV',
  () => {
    assert.equal(
      gangrelPowers.every(
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
  'las 26 claves de poderes Gangrel son únicas',
  () => {
    const keys =
      gangrelPowers.map(
        (power) =>
          power.key,
      )

    assert.equal(
      new Set(keys).size,
      26,
    )
  },
)

test(
  'todos los poderes Gangrel tienen trazabilidad bibliográfica',
  () => {
    for (
      const power of gangrelPowers
    ) {
      assert.equal(
        power.sourceKey,
        'core-v5-es',
      )

      assert.equal(
        Number.isInteger(
          power.sourcePage,
        ),
        true,
      )

      assert.equal(
        power.sourcePage > 0,
        true,
      )
    }
  },
)

test(
  'cada Disciplina Gangrel cubre niveles 1 a 5',
  () => {
    for (
      const disciplineKey of
      gangrelDisciplineKeys
    ) {
      const levels =
        [
          ...new Set(
            powersFor(
              disciplineKey,
            ).map(
              (power) =>
                power.level,
            ),
          ),
        ].sort()

      assert.deepEqual(
        levels,
        [1, 2, 3, 4, 5],
      )
    }
  },
)

test(
  'una distribución Gangrel Animalismo 2 + Fortaleza 1 es válida',
  () => {
    const disciplines = [
      {
        key: 'animalism',
        value: 2,
        powerKeys: [],
      },
      {
        key: 'fortitude',
        value: 1,
        powerKeys: [],
      },
    ]

    assert.equal(
      validateDisciplines(
        disciplines,
        'gangrel',
      ).valid,
      true,
    )
  },
)

test(
  'una distribución Gangrel Protean 2 + Animalismo 1 también es válida',
  () => {
    const disciplines = [
      {
        key: 'protean',
        value: 2,
        powerKeys: [],
      },
      {
        key: 'animalism',
        value: 1,
        powerKeys: [],
      },
    ]

    assert.equal(
      validateDisciplines(
        disciplines,
        'gangrel',
      ).valid,
      true,
    )
  },
)

test(
  'Gangrel puede completar Animalismo 2 y Fortaleza 1 con poderes reales',
  () => {
    let disciplines = [
      {
        key: 'animalism',
        value: 2,
        powerKeys: [],
      },
      {
        key: 'fortitude',
        value: 1,
        powerKeys: [],
      },
    ]

    disciplines =
      updateSelectedPower(
        disciplines,
        'animalism',
        'animalism-sense-the-beast',
        true,
      )

    disciplines =
      updateSelectedPower(
        disciplines,
        'animalism',
        'animalism-feral-whispers',
        true,
      )

    disciplines =
      updateSelectedPower(
        disciplines,
        'fortitude',
        'fortitude-resilience',
        true,
      )

    for (
      const discipline of disciplines
    ) {
      assert.equal(
        validateSelectedPowers(
          disciplinePowerDefinitions,
          disciplines,
          discipline.key,
          discipline.powerKeys,
        ).valid,
        true,
      )
    }
  },
)

test(
  'Gangrel puede completar Protean 2 y Animalismo 1 con poderes reales',
  () => {
    let disciplines = [
      {
        key: 'protean',
        value: 2,
        powerKeys: [],
      },
      {
        key: 'animalism',
        value: 1,
        powerKeys: [],
      },
    ]

    disciplines =
      updateSelectedPower(
        disciplines,
        'protean',
        'protean-eyes-of-the-beast',
        true,
      )

    disciplines =
      updateSelectedPower(
        disciplines,
        'protean',
        'protean-feral-weapons',
        true,
      )

    disciplines =
      updateSelectedPower(
        disciplines,
        'animalism',
        'animalism-bond-famulus',
        true,
      )

    for (
      const discipline of disciplines
    ) {
      assert.equal(
        validateSelectedPowers(
          disciplinePowerDefinitions,
          disciplines,
          discipline.key,
          discipline.powerKeys,
        ).valid,
        true,
      )
    }
  },
)

test(
  'una selección incompleta sigue invalidando los poderes Gangrel',
  () => {
    const disciplines = [
      {
        key: 'fortitude',
        value: 2,
        powerKeys: [
          'fortitude-resilience',
        ],
      },
      {
        key: 'protean',
        value: 1,
        powerKeys: [
          'protean-eyes-of-the-beast',
        ],
      },
    ]

    assert.equal(
      validateSelectedPowers(
        disciplinePowerDefinitions,
        disciplines,
        'fortitude',
        disciplines[0].powerKeys,
      ).valid,
      false,
    )
  },
)
