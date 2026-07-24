import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getThinBloodDisciplineAffinityKeys,
  validateThinBloodDisciplineAffinityDetails,
  validateThinBloodTraitSelection,
} from '../src/features/character-creation/domain/thin-blood-trait-rules.ts'

const expectedClanDisciplineKeys = [
  'animalism',
  'auspex',
  'bloodSorcery',
  'celerity',
  'dominate',
  'fortitude',
  'obfuscate',
  'oblivion',
  'potence',
  'presence',
  'protean',
]

const validLevelOnePowerByDiscipline = {
  animalism:
    'animalism-sense-the-beast',

  auspex:
    'auspex-heightened-senses',

  bloodSorcery:
    'blood-sorcery-taste-for-blood',

  celerity:
    'celerity-cats-grace',

  dominate:
    'dominate-cloud-memory',

  fortitude:
    'fortitude-resilience',

  obfuscate:
    'obfuscate-cloak-of-shadows',

  oblivion:
    'oblivion-ashes-to-ashes',

  potence:
    'potence-lethal-body',

  presence:
    'presence-daunt',

  protean:
    'protean-eyes-of-the-beast',
}

function affinity(
  disciplineKey,
  powerKey =
    validLevelOnePowerByDiscipline[
      disciplineKey
    ],
) {
  return {
    definitionKey:
      'discipline-affinity',

    disciplineAffinityDetails: {
      disciplineKey,
      powerKey,
    },
  }
}

for (
  const disciplineKey
  of expectedClanDisciplineKeys
) {
  test(
    `Disciplina Afín acepta la Disciplina de clan ${disciplineKey}`,
    () => {
      const result =
        validateThinBloodDisciplineAffinityDetails({
          selections: [
            affinity(
              disciplineKey,
            ),
          ],
        })

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
}

test(
  'el conjunto de Disciplina Afín se deriva exactamente de las Disciplinas de los 13 clanes',
  () => {
    assert.deepEqual(
      [
        ...getThinBloodDisciplineAffinityKeys(),
      ].sort(),
      [
        ...expectedClanDisciplineKeys,
      ].sort(),
    )
  },
)

test(
  'Disciplina Afín rechaza Alquimia de Sangre Débil',
  () => {
    const result =
      validateThinBloodDisciplineAffinityDetails({
        selections: [
          affinity(
            'thinBloodAlchemy',
          ),
        ],
      })

    assert.equal(
      result.valid,
      false,
    )

    assert.equal(
      result.errors.length,
      1,
    )
  },
)

test(
  'Disciplina Afín exige seleccionar una Disciplina',
  () => {
    const result =
      validateThinBloodDisciplineAffinityDetails({
        selections: [
          {
            definitionKey:
              'discipline-affinity',
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
            'requiere seleccionar',
          ),
      ),
      true,
    )
  },
)

test(
  'otro rasgo de Sangre Débil no puede contener disciplineAffinityDetails',
  () => {
    const result =
      validateThinBloodDisciplineAffinityDetails({
        selections: [
          {
            definitionKey:
              'day-drinker',

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
            'Sólo Disciplina Afín',
          ),
      ),
      true,
    )
  },
)

test(
  'la validación completa exige los detalles de Disciplina Afín',
  () => {
    const result =
      validateThinBloodTraitSelection({
        selections: [
          {
            definitionKey:
              'discipline-affinity',
          },
          {
            definitionKey:
              'dead-flesh',
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
            'Disciplina Afín requiere',
          ),
      ),
      true,
    )
  },
)
