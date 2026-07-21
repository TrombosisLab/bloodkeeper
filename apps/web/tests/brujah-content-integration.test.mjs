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

const brujahDisciplineKeys = [
  'celerity',
  'potence',
  'presence',
]

const brujahPowers =
  disciplinePowerDefinitions.filter(
    (power) =>
      brujahDisciplineKeys.includes(
        power.disciplineKey,
      ),
  )

function powersFor(
  disciplineKey,
) {
  return brujahPowers.filter(
    (power) =>
      power.disciplineKey ===
      disciplineKey,
  )
}

test(
  'Brujah tiene catálogo real para sus tres Disciplinas',
  () => {
    for (
      const disciplineKey of
      brujahDisciplineKeys
    ) {
      assert.equal(
        powersFor(
          disciplineKey,
        ).length,
        9,
      )
    }

    assert.equal(
      brujahPowers.length,
      27,
    )
  },
)

test(
  'ningún poder de las Disciplinas Brujah usa contenido DEV',
  () => {
    assert.equal(
      brujahPowers.every(
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
  'las 27 claves de poderes Brujah son únicas',
  () => {
    const keys =
      brujahPowers.map(
        (power) =>
          power.key,
      )

    assert.equal(
      new Set(keys).size,
      27,
    )
  },
)

test(
  'todos los poderes Brujah tienen trazabilidad bibliográfica',
  () => {
    for (
      const power of
      brujahPowers
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
  'cada Disciplina Brujah cubre niveles 1 a 5',
  () => {
    for (
      const disciplineKey of
      brujahDisciplineKeys
    ) {
      const levels =
        new Set(
          powersFor(
            disciplineKey,
          ).map(
            (power) =>
              power.level,
          ),
        )

      assert.deepEqual(
        [...levels].sort(),
        [1, 2, 3, 4, 5],
      )
    }
  },
)

test(
  'una distribución Brujah 2 + 1 es válida',
  () => {
    const disciplines = [
      {
        key: 'celerity',
        value: 2,
        powerKeys: [],
      },
      {
        key: 'potence',
        value: 1,
        powerKeys: [],
      },
    ]

    assert.equal(
      validateDisciplines(
        disciplines,
        'brujah',
      ).valid,
      true,
    )
  },
)

test(
  'otra distribución Brujah 2 + 1 también es válida',
  () => {
    const disciplines = [
      {
        key: 'presence',
        value: 2,
        powerKeys: [],
      },
      {
        key: 'celerity',
        value: 1,
        powerKeys: [],
      },
    ]

    assert.equal(
      validateDisciplines(
        disciplines,
        'brujah',
      ).valid,
      true,
    )
  },
)

test(
  'Brujah puede completar Celeridad 2 y Potencia 1 con poderes reales',
  () => {
    let disciplines = [
      {
        key: 'celerity',
        value: 2,
        powerKeys: [],
      },
      {
        key: 'potence',
        value: 1,
        powerKeys: [],
      },
    ]

    disciplines =
      updateSelectedPower(
        disciplines,
        'celerity',
        'celerity-cats-grace',
        true,
      )

    disciplines =
      updateSelectedPower(
        disciplines,
        'celerity',
        'celerity-fleetness',
        true,
      )

    disciplines =
      updateSelectedPower(
        disciplines,
        'potence',
        'potence-lethal-body',
        true,
      )

    const celerity =
      disciplines.find(
        (discipline) =>
          discipline.key ===
          'celerity',
      )

    const potence =
      disciplines.find(
        (discipline) =>
          discipline.key ===
          'potence',
      )

    assert.equal(
      validateSelectedPowers(
        disciplinePowerDefinitions,
        disciplines,
        'celerity',
        celerity.powerKeys,
      ).valid,
      true,
    )

    assert.equal(
      validateSelectedPowers(
        disciplinePowerDefinitions,
        disciplines,
        'potence',
        potence.powerKeys,
      ).valid,
      true,
    )
  },
)

test(
  'Brujah puede completar Presencia 2 y Celeridad 1 con poderes reales',
  () => {
    let disciplines = [
      {
        key: 'presence',
        value: 2,
        powerKeys: [],
      },
      {
        key: 'celerity',
        value: 1,
        powerKeys: [],
      },
    ]

    disciplines =
      updateSelectedPower(
        disciplines,
        'presence',
        'presence-awe',
        true,
      )

    disciplines =
      updateSelectedPower(
        disciplines,
        'presence',
        'presence-lingering-kiss',
        true,
      )

    disciplines =
      updateSelectedPower(
        disciplines,
        'celerity',
        'celerity-rapid-reflexes',
        true,
      )

    for (
      const discipline of
      disciplines
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
  'una selección incompleta sigue invalidando los poderes Brujah',
  () => {
    const disciplines = [
      {
        key: 'potence',
        value: 2,
        powerKeys: [
          'potence-lethal-body',
        ],
      },
      {
        key: 'presence',
        value: 1,
        powerKeys: [
          'presence-awe',
        ],
      },
    ]

    assert.equal(
      validateSelectedPowers(
        disciplinePowerDefinitions,
        disciplines,
        'potence',
        disciplines[0].powerKeys,
      ).valid,
      false,
    )
  },
)
