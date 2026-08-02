import assert from 'node:assert/strict'
import test from 'node:test'

import {
  validateDisciplinePowerCatalog,
} from '../src/features/character-creation/domain/discipline-power-catalog-rules.ts'
import {
  readDisciplinePowerDiceInput,
} from '../src/features/character-creation/domain/discipline-power-dice-read-model.ts'

const power = {
  key: 'animalism-test-power',
  disciplineKey: 'animalism',
  name: 'Poder de prueba',
  level: 1,
  active: true,
  diceCheck: {
    pool: [
      {
        kind: 'attribute',
        key: 'resolve',
      },
      {
        kind: 'discipline',
        key: 'animalism',
      },
    ],
  },
}

const attributes = {
  resolve: 3,
}

const skills = {
  animalKen: 2,
}

const disciplines = [
  {
    key: 'animalism',
    value: 2,
    powerKeys: [
      'animalism-test-power',
    ],
  },
]

test(
  '025-G proporciona al módulo de dados los términos resueltos',
  () => {
    const result =
      readDisciplinePowerDiceInput(
        [power],
        attributes,
        skills,
        disciplines,
        power.key,
      )

    assert.deepEqual(result, {
      status: 'ready',
      input: {
        source: 'disciplinePower',
        powerKey: power.key,
        disciplineKey: 'animalism',
        poolTerms: [
          {
            kind: 'attribute',
            key: 'resolve',
            value: 3,
          },
          {
            kind: 'discipline',
            key: 'animalism',
            value: 2,
          },
        ],
      },
    })
  },
)

test(
  '025-G entrega datos sin sumar ni ejecutar la tirada',
  () => {
    const result =
      readDisciplinePowerDiceInput(
        [power],
        attributes,
        skills,
        disciplines,
        power.key,
      )

    assert.equal(result.status, 'ready')
    assert.equal(
      Object.hasOwn(result.input, 'total'),
      false,
    )
    assert.equal(
      Object.hasOwn(result.input, 'result'),
      false,
    )
  },
)

test(
  '025-G puede resolver una Habilidad sin conocer el motor de dados',
  () => {
    const skillPower = {
      ...power,
      key: 'animalism-skill-test',
      diceCheck: {
        pool: [
          {
            kind: 'skill',
            key: 'animalKen',
          },
        ],
      },
    }
    const result =
      readDisciplinePowerDiceInput(
        [skillPower],
        attributes,
        skills,
        [
          {
            ...disciplines[0],
            powerKeys: [skillPower.key],
          },
        ],
        skillPower.key,
      )

    assert.deepEqual(
      result.input.poolTerms,
      [
        {
          kind: 'skill',
          key: 'animalKen',
          value: 2,
        },
      ],
    )
  },
)

test(
  '025-G no expone una tirada para un Poder no adquirido',
  () => {
    const result =
      readDisciplinePowerDiceInput(
        [power],
        attributes,
        skills,
        [
          {
            ...disciplines[0],
            powerKeys: [],
          },
        ],
        power.key,
      )

    assert.deepEqual(result, {
      status: 'unavailable',
      reason: 'POWER_NOT_ACQUIRED',
    })
  },
)

test(
  '025-G distingue un Poder sin datos de tirada autorizados',
  () => {
    const powerWithoutDiceCheck = {
      ...power,
      diceCheck: undefined,
    }
    const result =
      readDisciplinePowerDiceInput(
        [powerWithoutDiceCheck],
        attributes,
        skills,
        disciplines,
        power.key,
      )

    assert.deepEqual(result, {
      status: 'unavailable',
      reason: 'POWER_HAS_NO_DICE_CHECK',
    })
  },
)

test(
  '025-G valida la estructura declarativa de las reservas',
  () => {
    const emptyPool = {
      ...power,
      key: 'empty-pool',
      diceCheck: {
        pool: [],
      },
    }
    const duplicatedTerm = {
      ...power,
      key: 'duplicated-term',
      diceCheck: {
        pool: [
          power.diceCheck.pool[0],
          power.diceCheck.pool[0],
        ],
      },
    }

    assert.deepEqual(
      validateDisciplinePowerCatalog(
        [emptyPool],
      ).violations,
      ['POWER_DICE_POOL_EMPTY'],
    )
    assert.deepEqual(
      validateDisciplinePowerCatalog(
        [duplicatedTerm],
      ).violations,
      ['POWER_DICE_POOL_TERM_DUPLICATED'],
    )
  },
)
