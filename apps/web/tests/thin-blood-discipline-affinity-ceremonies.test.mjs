import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getSelectedOblivionPowerKeys,
  normalizeOblivionCeremoniesForDraft,
} from '../src/features/character-creation/domain/oblivion-ceremony-draft-rules.ts'

import {
  validateDisciplinesStep,
} from '../src/features/character-creation/domain/step-validation.ts'

function makeThinBloodDraft({
  powerKey =
    'oblivion-ashes-to-ashes',

  ceremonyKeys = [],
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

    /*
     * Invariante Sangre Débil:
     * no usa el reparto convencional de Disciplinas.
     */
    disciplines: [],

    bloodSorceryRituals: {
      ritualKeys: [],
    },

    oblivionCeremonies: {
      ceremonyKeys,
    },

    thinBloodAlchemy: {},

    thinBloodTraits: {
      selections: [
        {
          definitionKey:
            'discipline-affinity',

          disciplineAffinityDetails: {
            disciplineKey:
              'oblivion',

            powerKey,
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
  'Disciplina Afín Olvido expone su poder como conocimiento permanente sin tocar draft.disciplines',
  () => {
    const draft =
      makeThinBloodDraft({
        powerKey:
          'oblivion-ashes-to-ashes',
      })

    assert.deepEqual(
      getSelectedOblivionPowerKeys(
        draft,
      ),
      [
        'oblivion-ashes-to-ashes',
      ],
    )

    assert.deepEqual(
      draft.disciplines,
      [],
    )
  },
)

test(
  'Cenizas a las Cenizas mediante Disciplina Afín conserva Don de Falsa Vida',
  () => {
    const draft =
      makeThinBloodDraft({
        powerKey:
          'oblivion-ashes-to-ashes',

        ceremonyKeys: [
          'oblivion-ceremony-gift-of-false-life',
        ],
      })

    assert.deepEqual(
      normalizeOblivionCeremoniesForDraft(
        draft,
      ),
      {
        ceremonyKeys: [
          'oblivion-ceremony-gift-of-false-life',
        ],
      },
    )
  },
)

test(
  'El Grillete Vinculante mediante Disciplina Afín conserva Invocar Espíritu',
  () => {
    const draft =
      makeThinBloodDraft({
        powerKey:
          'oblivion-binding-fetter',

        ceremonyKeys: [
          'oblivion-ceremony-summon-spirit',
        ],
      })

    assert.deepEqual(
      normalizeOblivionCeremoniesForDraft(
        draft,
      ),
      {
        ceremonyKeys: [
          'oblivion-ceremony-summon-spirit',
        ],
      },
    )
  },
)

test(
  'Cenizas a las Cenizas mediante Disciplina Afín exige Ceremonia inicial',
  () => {
    const result =
      validateDisciplinesStep(
        makeThinBloodDraft({
          powerKey:
            'oblivion-ashes-to-ashes',
        }),
      )

    assert.equal(
      result.errors.includes(
        'Debes seleccionar exactamente una Ceremonia inicial de Olvido.',
      ),
      true,
    )
  },
)

test(
  'El Grillete Vinculante mediante Disciplina Afín exige Ceremonia inicial',
  () => {
    const result =
      validateDisciplinesStep(
        makeThinBloodDraft({
          powerKey:
            'oblivion-binding-fetter',
        }),
      )

    assert.equal(
      result.errors.includes(
        'Debes seleccionar exactamente una Ceremonia inicial de Olvido.',
      ),
      true,
    )
  },
)

test(
  'Manto de Sombras no inventa una Ceremonia inicial',
  () => {
    const result =
      validateDisciplinesStep(
        makeThinBloodDraft({
          powerKey:
            'oblivion-shadow-cloak',
        }),
      )

    assert.equal(
      result.errors.includes(
        'Debes seleccionar exactamente una Ceremonia inicial de Olvido.',
      ),
      false,
    )
  },
)

test(
  'Vista del Olvido no inventa una Ceremonia inicial',
  () => {
    const result =
      validateDisciplinesStep(
        makeThinBloodDraft({
          powerKey:
            'oblivion-oblivions-sight',
        }),
      )

    assert.equal(
      result.errors.includes(
        'Debes seleccionar exactamente una Ceremonia inicial de Olvido.',
      ),
      false,
    )
  },
)

test(
  'una Ceremonia incompatible con el poder de Disciplina Afín se elimina',
  () => {
    const draft =
      makeThinBloodDraft({
        powerKey:
          'oblivion-binding-fetter',

        ceremonyKeys: [
          'oblivion-ceremony-gift-of-false-life',
        ],
      })

    assert.deepEqual(
      normalizeOblivionCeremoniesForDraft(
        draft,
      ),
      {
        ceremonyKeys: [],
      },
    )
  },
)

test(
  'la integración de Ceremonias nunca introduce Olvido en draft.disciplines',
  () => {
    const draft =
      makeThinBloodDraft({
        powerKey:
          'oblivion-ashes-to-ashes',

        ceremonyKeys: [
          'oblivion-ceremony-gift-of-false-life',
        ],
      })

    normalizeOblivionCeremoniesForDraft(
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
