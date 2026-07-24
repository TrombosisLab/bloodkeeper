import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getThinBloodDisciplineAffinityEffect,
  validateThinBloodDisciplineAffinityDetails,
} from '../src/features/character-creation/domain/thin-blood-trait-rules.ts'

function affinity(
  disciplineKey,
  powerKey,
) {
  return {
    selections: [
      {
        definitionKey:
          'discipline-affinity',

        disciplineAffinityDetails: {
          disciplineKey,
          powerKey,
        },
      },
    ],
  }
}

test(
  'Disciplina Afín deriva exactamente rating 1 sin almacenarlo en el contrato',
  () => {
    const effect =
      getThinBloodDisciplineAffinityEffect(
        affinity(
          'celerity',
          'celerity-cats-grace',
        ),
      )

    assert.deepEqual(
      effect,
      {
        key: 'celerity',
        value: 1,
        powerKeys: [
          'celerity-cats-grace',
        ],
      },
    )
  },
)

test(
  'sin Disciplina Afín no existe efecto derivado',
  () => {
    const effect =
      getThinBloodDisciplineAffinityEffect({
        selections: [
          {
            definitionKey:
              'day-drinker',
          },
        ],
      })

    assert.equal(
      effect,
      null,
    )
  },
)

test(
  'Disciplina Afín sin poder elegido no produce efecto derivado completo',
  () => {
    const effect =
      getThinBloodDisciplineAffinityEffect({
        selections: [
          {
            definitionKey:
              'discipline-affinity',

            disciplineAffinityDetails: {
              disciplineKey:
                'celerity',
            },
          },
        ],
      })

    assert.equal(
      effect,
      null,
    )
  },
)

test(
  'Disciplina Afín acepta un poder nivel 1 de la Disciplina elegida',
  () => {
    const result =
      validateThinBloodDisciplineAffinityDetails(
        affinity(
          'celerity',
          'celerity-cats-grace',
        ),
      )

    assert.equal(
      result.valid,
      true,
    )

    assert.deepEqual(
      result.errors,
      [],
    )
  },
)

test(
  'Disciplina Afín exige seleccionar un poder',
  () => {
    const result =
      validateThinBloodDisciplineAffinityDetails({
        selections: [
          {
            definitionKey:
              'discipline-affinity',

            disciplineAffinityDetails: {
              disciplineKey:
                'celerity',
            },
          },
        ],
      })

    assert.equal(
      result.valid,
      false,
    )

    assert.equal(
      result.errors.some(
        (error) =>
          error.includes(
            'poder inicial',
          ),
      ),
      true,
    )
  },
)

test(
  'Disciplina Afín rechaza un poder inexistente',
  () => {
    const result =
      validateThinBloodDisciplineAffinityDetails(
        affinity(
          'celerity',
          'poder-inexistente',
        ),
      )

    assert.equal(
      result.valid,
      false,
    )

    assert.equal(
      result.errors.some(
        (error) =>
          error.includes(
            'no existe en el catálogo',
          ),
      ),
      true,
    )
  },
)

test(
  'Disciplina Afín rechaza un poder perteneciente a otra Disciplina',
  () => {
    const result =
      validateThinBloodDisciplineAffinityDetails(
        affinity(
          'celerity',
          'potence-lethal-body',
        ),
      )

    assert.equal(
      result.valid,
      false,
    )

    assert.equal(
      result.errors.some(
        (error) =>
          error.includes(
            'no pertenece a esta Disciplina',
          ),
      ),
      true,
    )
  },
)

test(
  'Disciplina Afín rechaza un poder de nivel superior a 1',
  () => {
    const result =
      validateThinBloodDisciplineAffinityDetails(
        affinity(
          'celerity',
          'celerity-fleetness',
        ),
      )

    assert.equal(
      result.valid,
      false,
    )

    assert.equal(
      result.errors.some(
        (error) =>
          error.includes(
            'nivel 2',
          ),
      ),
      true,
    )
  },
)

test(
  'Olvido puede elegir cualquiera de sus poderes disponibles de nivel 1',
  () => {
    const validPowerKeys = [
      'oblivion-ashes-to-ashes',
      'oblivion-binding-fetter',
      'oblivion-shadow-cloak',
      'oblivion-oblivions-sight',
    ]

    for (
      const powerKey
      of validPowerKeys
    ) {
      const result =
        validateThinBloodDisciplineAffinityDetails(
          affinity(
            'oblivion',
            powerKey,
          ),
        )

      assert.equal(
        result.valid,
        true,
        powerKey,
      )
    }
  },
)

test(
  'Hechicería de Sangre puede elegir un poder nivel 1 sin conceder Rituales en este contrato',
  () => {
    const draft =
      affinity(
        'bloodSorcery',
        'blood-sorcery-taste-for-blood',
      )

    const effect =
      getThinBloodDisciplineAffinityEffect(
        draft,
      )

    assert.deepEqual(
      effect,
      {
        key: 'bloodSorcery',
        value: 1,
        powerKeys: [
          'blood-sorcery-taste-for-blood',
        ],
      },
    )

    assert.equal(
      Object.hasOwn(
        effect,
        'ritualKeys',
      ),
      false,
    )
  },
)

test(
  'el efecto derivado no crea una distribución convencional 2 + 1',
  () => {
    const effect =
      getThinBloodDisciplineAffinityEffect(
        affinity(
          'potence',
          'potence-lethal-body',
        ),
      )

    assert.equal(
      Array.isArray(effect),
      false,
    )

    assert.equal(
      effect.value,
      1,
    )

    assert.equal(
      effect.powerKeys.length,
      1,
    )
  },
)
