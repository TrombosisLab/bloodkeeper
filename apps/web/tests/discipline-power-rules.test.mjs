import assert from 'node:assert/strict'
import test from 'node:test'

import {
  canLearnDisciplinePower,
  getLearnableDisciplinePowers,
  getRequiredPowerCount,
  validateSelectedPowers,
} from '../src/features/character-creation/domain/discipline-power-rules.ts'

const definitions = [
  {
    key: 'celerity-level-1-a',
    disciplineKey: 'celerity',
    name: 'Poder técnico A',
    level: 1,
  },
  {
    key: 'celerity-level-1-b',
    disciplineKey: 'celerity',
    name: 'Poder técnico B',
    level: 1,
  },
  {
    key: 'celerity-level-2',
    disciplineKey: 'celerity',
    name: 'Poder técnico nivel 2',
    level: 2,
    requirements: {
      prerequisitePowerKeys: [
        'celerity-level-1-a',
      ],
    },
  },
  {
    key: 'celerity-amalgam',
    disciplineKey: 'celerity',
    name: 'Poder técnico Amalgama',
    level: 2,
    requirements: {
      amalgam: {
        disciplineKey: 'auspex',
        minimumLevel: 1,
      },
    },
  },
]

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

test(
  'el número de poderes requerido coincide con el nivel de Disciplina',
  () => {
    assert.equal(
      getRequiredPowerCount(
        disciplines,
        'celerity',
      ),
      2,
    )

    assert.equal(
      getRequiredPowerCount(
        disciplines,
        'potence',
      ),
      1,
    )
  },
)

test(
  'permite un poder cuyo nivel está cubierto',
  () => {
    const result =
      canLearnDisciplinePower(
        definitions[0],
        disciplines,
        [],
      )

    assert.equal(
      result.valid,
      true,
    )
  },
)

test(
  'rechaza un poder si falta nivel de Disciplina',
  () => {
    const result =
      canLearnDisciplinePower(
        {
          key: 'potence-level-2',
          disciplineKey: 'potence',
          name: 'Poder técnico',
          level: 2,
        },
        disciplines,
        [],
      )

    assert.equal(
      result.valid,
      false,
    )
  },
)

test(
  'respeta prerrequisitos de poderes',
  () => {
    const withoutPrerequisite =
      canLearnDisciplinePower(
        definitions[2],
        disciplines,
        [],
      )

    assert.equal(
      withoutPrerequisite.valid,
      false,
    )

    const withPrerequisite =
      canLearnDisciplinePower(
        definitions[2],
        disciplines,
        [
          'celerity-level-1-a',
        ],
      )

    assert.equal(
      withPrerequisite.valid,
      true,
    )
  },
)

test(
  'respeta requisitos de Amalgama',
  () => {
    const withoutAmalgam =
      canLearnDisciplinePower(
        definitions[3],
        disciplines,
        [],
      )

    assert.equal(
      withoutAmalgam.valid,
      false,
    )

    const withAuspex = [
      ...disciplines,
      {
        key: 'auspex',
        value: 1,
        powerKeys: [],
      },
    ]

    const withAmalgam =
      canLearnDisciplinePower(
        definitions[3],
        withAuspex,
        [],
      )

    assert.equal(
      withAmalgam.valid,
      true,
    )
  },
)

test(
  'filtra únicamente poderes aprendibles',
  () => {
    const result =
      getLearnableDisciplinePowers(
        definitions,
        'celerity',
        disciplines,
        [],
      )

    assert.deepEqual(
      result.map(
        (power) => power.key,
      ),
      [
        'celerity-level-1-a',
        'celerity-level-1-b',
      ],
    )
  },
)

test(
  'valida exactamente tantos poderes como nivel de Disciplina',
  () => {
    const result =
      validateSelectedPowers(
        definitions,
        disciplines,
        'celerity',
        [
          'celerity-level-1-a',
          'celerity-level-1-b',
        ],
      )

    assert.equal(
      result.valid,
      true,
    )
  },
)

test(
  'rechaza poderes duplicados',
  () => {
    const result =
      validateSelectedPowers(
        definitions,
        disciplines,
        'celerity',
        [
          'celerity-level-1-a',
          'celerity-level-1-a',
        ],
      )

    assert.equal(
      result.valid,
      false,
    )
  },
)

test(
  'rechaza poderes pertenecientes a otra Disciplina',
  () => {
    const extended = [
      ...definitions,
      {
        key: 'potence-level-1',
        disciplineKey: 'potence',
        name: 'Poder técnico Potencia',
        level: 1,
      },
    ]

    const result =
      validateSelectedPowers(
        extended,
        disciplines,
        'celerity',
        [
          'celerity-level-1-a',
          'potence-level-1',
        ],
      )

    assert.equal(
      result.valid,
      false,
    )
  },
)

test(
  'añade y elimina un poder de una Disciplina',
  async () => {
    const {
      updateSelectedPower,
    } = await import(
      '../src/features/character-creation/domain/discipline-power-rules.ts'
    )

    const added =
      updateSelectedPower(
        disciplines,
        'celerity',
        'celerity-level-1-a',
        true,
      )

    assert.deepEqual(
      added.find(
        (discipline) =>
          discipline.key ===
          'celerity',
      ).powerKeys,
      [
        'celerity-level-1-a',
      ],
    )

    const removed =
      updateSelectedPower(
        added,
        'celerity',
        'celerity-level-1-a',
        false,
      )

    assert.deepEqual(
      removed.find(
        (discipline) =>
          discipline.key ===
          'celerity',
      ).powerKeys,
      [],
    )
  },
)

test(
  'no permite seleccionar más poderes que nivel de Disciplina',
  async () => {
    const {
      updateSelectedPower,
    } = await import(
      '../src/features/character-creation/domain/discipline-power-rules.ts'
    )

    let result =
      updateSelectedPower(
        disciplines,
        'potence',
        'potence-a',
        true,
      )

    result =
      updateSelectedPower(
        result,
        'potence',
        'potence-b',
        true,
      )

    assert.deepEqual(
      result.find(
        (discipline) =>
          discipline.key ===
          'potence',
      ).powerKeys,
      [
        'potence-a',
      ],
    )
  },
)

test(
  'normaliza poderes inexistentes duplicados o de otra Disciplina',
  async () => {
    const {
      normalizeDisciplinePowers,
    } = await import(
      '../src/features/character-creation/domain/discipline-power-rules.ts'
    )

    const dirty = [
      {
        key: 'celerity',
        value: 2,
        powerKeys: [
          'celerity-level-1-a',
          'celerity-level-1-a',
          'unknown-power',
          'potence-level-1',
          'celerity-level-1-b',
        ],
      },
    ]

    const catalog = [
      ...definitions,
      {
        key: 'potence-level-1',
        disciplineKey: 'potence',
        name: 'Potencia técnica',
        level: 1,
      },
    ]

    const result =
      normalizeDisciplinePowers(
        catalog,
        dirty,
      )

    assert.deepEqual(
      result[0].powerKeys,
      [
        'celerity-level-1-a',
        'celerity-level-1-b',
      ],
    )
  },
)

test(
  'al bajar nivel elimina poderes sobrantes de forma determinista',
  async () => {
    const {
      normalizeDisciplinePowers,
    } = await import(
      '../src/features/character-creation/domain/discipline-power-rules.ts'
    )

    const lowered = [
      {
        key: 'celerity',
        value: 1,
        powerKeys: [
          'celerity-level-1-a',
          'celerity-level-1-b',
        ],
      },
    ]

    const result =
      normalizeDisciplinePowers(
        definitions,
        lowered,
      )

    assert.deepEqual(
      result[0].powerKeys,
      [
        'celerity-level-1-a',
      ],
    )
  },
)

test(
  'elimina un poder cuyo nivel supera el nivel actual de Disciplina',
  async () => {
    const {
      normalizeDisciplinePowers,
    } = await import(
      '../src/features/character-creation/domain/discipline-power-rules.ts'
    )

    const dirty = [
      {
        key: 'celerity',
        value: 1,
        powerKeys: [
          'celerity-level-2',
        ],
      },
    ]

    const result =
      normalizeDisciplinePowers(
        definitions,
        dirty,
      )

    assert.deepEqual(
      result[0].powerKeys,
      [],
    )
  },
)

test(
  'puede limpiar todos los poderes sin alterar las puntuaciones',
  async () => {
    const {
      clearAllSelectedPowers,
    } = await import(
      '../src/features/character-creation/domain/discipline-power-rules.ts'
    )

    const populated = [
      {
        key: 'celerity',
        value: 2,
        powerKeys: [
          'celerity-level-1-a',
          'celerity-level-1-b',
        ],
      },
      {
        key: 'potence',
        value: 1,
        powerKeys: [
          'potence-level-1',
        ],
      },
    ]

    const result =
      clearAllSelectedPowers(
        populated,
      )

    assert.deepEqual(
      result,
      [
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
      ],
    )
  },
)
