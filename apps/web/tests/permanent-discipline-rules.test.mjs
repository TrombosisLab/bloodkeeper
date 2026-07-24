import assert from 'node:assert/strict'
import test from 'node:test'

import {
  resolvePermanentDisciplines,
} from '../src/features/character-creation/domain/permanent-discipline-rules.ts'

function makeDraft(overrides = {}) {
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
      ritualKeys: [],
    },
    oblivionCeremonies: {
      ceremonyKeys: [],
    },
    thinBloodAlchemy: {},
    thinBloodTraits: {
      selections: [],
    },
    advantages: {
      selections: [],
    },
    skills: {},
    skillSpecialties: {},
    skillDistributionMethod: null,
    ...overrides,
  }
}

test(
  'resolvePermanentDisciplines conserva las disciplinas ordinarias sin mutar el draft',
  () => {
    const draft =
      makeDraft({
        disciplines: [
          {
            key: 'celerity',
            value: 2,
            powerKeys: [
              'rapid-reflexes',
              'fleetness',
            ],
          },
        ],
      })

    const result =
      resolvePermanentDisciplines(draft)

    assert.deepEqual(
      result,
      draft.disciplines,
    )

    assert.notEqual(
      result,
      draft.disciplines,
    )

    assert.notEqual(
      result[0],
      draft.disciplines[0],
    )

    assert.notEqual(
      result[0].powerKeys,
      draft.disciplines[0].powerKeys,
    )
  },
)

test(
  'resolvePermanentDisciplines incorpora Disciplina Afin como conocimiento permanente derivado',
  () => {
    const draft =
      makeDraft({
        thinBloodTraits: {
          selections: [
            {
              definitionKey:
                'discipline-affinity',
              disciplineAffinityDetails: {
                disciplineKey:
                  'animalism',
                powerKey:
                  'bond-famulus',
              },
            },
          ],
        },
      })

    assert.deepEqual(
      resolvePermanentDisciplines(draft),
      [
        {
          key: 'animalism',
          value: 1,
          powerKeys: [
            'bond-famulus',
          ],
        },
      ],
    )

    assert.deepEqual(
      draft.disciplines,
      [],
    )
  },
)

test(
  'resolvePermanentDisciplines no crea una disciplina si Disciplina Afin esta incompleta',
  () => {
    const draft =
      makeDraft({
        thinBloodTraits: {
          selections: [
            {
              definitionKey:
                'discipline-affinity',
            },
          ],
        },
      })

    assert.deepEqual(
      resolvePermanentDisciplines(draft),
      [],
    )
  },
)

test(
  'resolvePermanentDisciplines unifica fuentes permanentes sin sumar ratings ni duplicar poderes',
  () => {
    const draft =
      makeDraft({
        disciplines: [
          {
            key: 'animalism',
            value: 2,
            powerKeys: [
              'bond-famulus',
              'feral-whispers',
            ],
          },
        ],
        thinBloodTraits: {
          selections: [
            {
              definitionKey:
                'discipline-affinity',
              disciplineAffinityDetails: {
                disciplineKey:
                  'animalism',
                powerKey:
                  'bond-famulus',
              },
            },
          ],
        },
      })

    assert.deepEqual(
      resolvePermanentDisciplines(draft),
      [
        {
          key: 'animalism',
          value: 2,
          powerKeys: [
            'bond-famulus',
            'feral-whispers',
          ],
        },
      ],
    )
  },
)
