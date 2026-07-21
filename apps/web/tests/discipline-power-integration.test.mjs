import assert from 'node:assert/strict'
import test from 'node:test'

import {
  validateDisciplines,
} from '../src/features/character-creation/domain/discipline-rules.ts'

import {
  normalizeDisciplinePowers,
  updateSelectedPower,
  validateSelectedPowers,
} from '../src/features/character-creation/domain/discipline-power-rules.ts'

import {
  disciplinePowerDefinitions,
} from '../src/features/character-creation/data/discipline-power-definitions.ts'

function createValidBrujahDisciplines() {
  return [
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
}

function validateCompleteDisciplineStep(
  disciplines,
) {
  const base =
    validateDisciplines(
      disciplines,
      'brujah',
    )

  if (!base.valid) {
    return false
  }

  return disciplines.every(
    (discipline) =>
      validateSelectedPowers(
        disciplinePowerDefinitions,
        disciplines,
        discipline.key,
        discipline.powerKeys,
      ).valid,
  )
}

test(
  'una distribución 2 + 1 sin poderes todavía no completa la fase',
  () => {
    const disciplines =
      createValidBrujahDisciplines()

    assert.equal(
      validateDisciplines(
        disciplines,
        'brujah',
      ).valid,
      true,
    )

    assert.equal(
      validateCompleteDisciplineStep(
        disciplines,
      ),
      false,
    )
  },
)

test(
  'una Disciplina a 2 con un solo poder mantiene la fase incompleta',
  () => {
    let disciplines =
      createValidBrujahDisciplines()

    disciplines =
      updateSelectedPower(
        disciplines,
        'celerity',
        'celerity-cats-grace',
        true,
      )

    assert.equal(
      validateSelectedPowers(
        disciplinePowerDefinitions,
        disciplines,
        'celerity',
        disciplines.find(
          (discipline) =>
            discipline.key ===
            'celerity',
        ).powerKeys,
      ).valid,
      false,
    )

    assert.equal(
      validateCompleteDisciplineStep(
        disciplines,
      ),
      false,
    )
  },
)

test(
  'una Disciplina a 1 sin poder mantiene la fase incompleta',
  () => {
    let disciplines =
      createValidBrujahDisciplines()

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
        'celerity-rapid-reflexes',
        true,
      )

    assert.equal(
      validateSelectedPowers(
        disciplinePowerDefinitions,
        disciplines,
        'potence',
        [],
      ).valid,
      false,
    )

    assert.equal(
      validateCompleteDisciplineStep(
        disciplines,
      ),
      false,
    )
  },
)

test(
  'dos poderes en nivel 2 y uno en nivel 1 completan correctamente la fase',
  () => {
    let disciplines =
      createValidBrujahDisciplines()

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
        'celerity-rapid-reflexes',
        true,
      )

    disciplines =
      updateSelectedPower(
        disciplines,
        'potence',
        'potence-lethal-body',
        true,
      )

    assert.equal(
      validateCompleteDisciplineStep(
        disciplines,
      ),
      true,
    )
  },
)

test(
  'quitar un poder de una selección completa vuelve a invalidar la fase',
  () => {
    let disciplines =
      createValidBrujahDisciplines()

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
        'celerity-rapid-reflexes',
        true,
      )

    disciplines =
      updateSelectedPower(
        disciplines,
        'potence',
        'potence-lethal-body',
        true,
      )

    assert.equal(
      validateCompleteDisciplineStep(
        disciplines,
      ),
      true,
    )

    disciplines =
      updateSelectedPower(
        disciplines,
        'celerity',
        'celerity-rapid-reflexes',
        false,
      )

    assert.equal(
      validateCompleteDisciplineStep(
        disciplines,
      ),
      false,
    )
  },
)

test(
  'un poder de otra Disciplina no valida la selección',
  () => {
    const disciplines = [
      {
        key: 'celerity',
        value: 2,
        powerKeys: [
          'celerity-cats-grace',
          'potence-lethal-body',
        ],
      },
      {
        key: 'potence',
        value: 1,
        powerKeys: [
          'potence-lethal-body',
        ],
      },
    ]

    const result =
      validateSelectedPowers(
        disciplinePowerDefinitions,
        disciplines,
        'celerity',
        disciplines[0].powerKeys,
      )

    assert.equal(
      result.valid,
      false,
    )
  },
)

test(
  'bajar una Disciplina de 2 a 1 elimina el exceso al normalizar',
  () => {
    const disciplines = [
      {
        key: 'celerity',
        value: 1,
        powerKeys: [
          'celerity-cats-grace',
          'celerity-rapid-reflexes',
        ],
      },
      {
        key: 'potence',
        value: 2,
        powerKeys: [],
      },
    ]

    const normalized =
      normalizeDisciplinePowers(
        disciplinePowerDefinitions,
        disciplines,
      )

    assert.deepEqual(
      normalized.find(
        (discipline) =>
          discipline.key ===
          'celerity',
      ).powerKeys,
      [
        'celerity-cats-grace',
      ],
    )
  },
)
