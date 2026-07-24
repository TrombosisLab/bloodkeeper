import assert from 'node:assert/strict'
import test from 'node:test'

import {
  normalizeBloodSorceryRitualsForDraft,
} from '../src/features/character-creation/domain/blood-sorcery-ritual-draft-rules.ts'

import {
  validateDisciplinesStep,
} from '../src/features/character-creation/domain/step-validation.ts'

function makeThinBloodDraft({
  affinityDisciplineKey = 'bloodSorcery',
  affinityPowerKey =
    'blood-sorcery-taste-for-blood',
  ritualKeys = [],
} = {}) {
  return {
    identity: {
      name: '',
      concept: '',
      predatorType: null,
      chronicle: '',
      ambition: '',
      clan: 'thinBlood',
      sire: '',
      desire: '',
      generation: null,
    },
    attributes: {},
    blood: {},
    disciplines: [],
    bloodSorceryRituals: {
      ritualKeys,
    },
    oblivionCeremonies: {
      ceremonyKeys: [],
    },
    thinBloodAlchemy: {},
    thinBloodTraits: {
      selections: [
        {
          definitionKey:
            'discipline-affinity',
          disciplineAffinityDetails: {
            disciplineKey:
              affinityDisciplineKey,
            powerKey:
              affinityPowerKey,
          },
        },
      ],
    },
    advantages: {
      selections: [],
    },
    skills: {},
    skillSpecialties: {},
    skillDistributionMethod: null,
  }
}

test(
  'Disciplina Afín Hechicería de Sangre conserva un Ritual válido con draft.disciplines vacío',
  () => {
    const draft =
      makeThinBloodDraft({
        ritualKeys: [
          'blood-sorcery-ritual-blood-walk',
        ],
      })

    assert.deepEqual(
      normalizeBloodSorceryRitualsForDraft(
        draft,
      ).ritualKeys,
      [
        'blood-sorcery-ritual-blood-walk',
      ],
    )

    assert.deepEqual(
      draft.disciplines,
      [],
    )
  },
)

test(
  'sin Hechicería de Sangre permanente elimina Rituales',
  () => {
    const draft =
      makeThinBloodDraft({
        affinityDisciplineKey:
          'celerity',
        affinityPowerKey:
          'celerity-cats-grace',
        ritualKeys: [
          'blood-sorcery-ritual-blood-walk',
        ],
      })

    assert.deepEqual(
      normalizeBloodSorceryRitualsForDraft(
        draft,
      ),
      {
        ritualKeys: [],
      },
    )
  },
)

test(
  'Disciplina Afín Hechicería de Sangre exige un Ritual inicial',
  () => {
    const result =
      validateDisciplinesStep(
        makeThinBloodDraft(),
      )

    assert.equal(
      result.errors.some(
        (error) =>
          error.includes(
            'Ritual inicial',
          ),
      ),
      true,
    )
  },
)

test(
  'Disciplina Afín Hechicería de Sangre acepta un Ritual inicial válido',
  () => {
    const result =
      validateDisciplinesStep(
        makeThinBloodDraft({
          ritualKeys: [
            'blood-sorcery-ritual-blood-walk',
          ],
        }),
      )

    assert.equal(
      result.errors.some(
        (error) =>
          error.includes(
            'Ritual',
          ),
      ),
      false,
    )
  },
)

test(
  'otra Disciplina Afín no exige Ritual',
  () => {
    const result =
      validateDisciplinesStep(
        makeThinBloodDraft({
          affinityDisciplineKey:
            'celerity',
          affinityPowerKey:
            'celerity-cats-grace',
        }),
      )

    assert.equal(
      result.errors.some(
        (error) =>
          error.includes(
            'Ritual',
          ),
      ),
      false,
    )
  },
)

test(
  'la integración nunca introduce Disciplina Afín en draft.disciplines',
  () => {
    const draft =
      makeThinBloodDraft({
        ritualKeys: [
          'blood-sorcery-ritual-blood-walk',
        ],
      })

    normalizeBloodSorceryRitualsForDraft(
      draft,
    )

    validateDisciplinesStep(
      draft,
    )

    assert.deepEqual(
      draft.disciplines,
      [],
    )
  },
)
