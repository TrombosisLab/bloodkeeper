import assert from 'node:assert/strict'
import test from 'node:test'

import {
  initialCharacterDraft,
} from '../src/features/character-creation/data/initial-character-draft.ts'

import {
  normalizeCharacterDraftOblivionCeremonies,
} from '../src/features/character-creation/domain/oblivion-ceremony-draft-rules.ts'

import {
  validateDisciplinesStep,
} from '../src/features/character-creation/domain/step-validation.ts'

function createDraft({
  clan = 'hecata',
  oblivionLevel = 1,
  powerKeys = [],
  ceremonyKeys = [],
} = {}) {
  return {
    ...initialCharacterDraft,

    identity: {
      ...initialCharacterDraft.identity,
      clan,
    },

    disciplines: [
      {
        key: 'oblivion',
        value: oblivionLevel,
        powerKeys,
      },
    ],

    oblivionCeremonies: {
      ceremonyKeys,
    },
  }
}

test(
  'sin Ceremonias elegibles no se exige selección inicial',
  () => {
    const draft =
      createDraft({
        powerKeys: [],
      })

    const result =
      validateDisciplinesStep(
        draft,
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
  'si existe una Ceremonia elegible se exige exactamente una',
  () => {
    const draft =
      createDraft({
        powerKeys: [
          'oblivion-ashes-to-ashes',
        ],
      })

    const result =
      validateDisciplinesStep(
        draft,
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
  'Don de Falsa Vida satisface la obligación cuando Cenizas a las Cenizas está aprendido',
  () => {
    const draft =
      createDraft({
        powerKeys: [
          'oblivion-ashes-to-ashes',
        ],

        ceremonyKeys: [
          'oblivion-ceremony-gift-of-false-life',
        ],
      })

    const result =
      validateDisciplinesStep(
        draft,
      )

    assert.equal(
      result.errors.some(
        (error) =>
          error.includes(
            'Ceremonia',
          ),
      ),
      false,
    )
  },
)

test(
  'Invocar Espíritu satisface la obligación con El Grillete Vinculante',
  () => {
    const draft =
      createDraft({
        clan: 'lasombra',

        powerKeys: [
          'oblivion-binding-fetter',
        ],

        ceremonyKeys: [
          'oblivion-ceremony-summon-spirit',
        ],
      })

    const result =
      validateDisciplinesStep(
        draft,
      )

    assert.equal(
      result.errors.some(
        (error) =>
          error.includes(
            'Ceremonia',
          ),
      ),
      false,
    )
  },
)

test(
  'la regla de Ceremonias depende de Olvido y no del clan',
  () => {
    const hecata =
      createDraft({
        clan: 'hecata',
        powerKeys: [
          'oblivion-ashes-to-ashes',
        ],
      })

    const lasombra =
      createDraft({
        clan: 'lasombra',
        powerKeys: [
          'oblivion-ashes-to-ashes',
        ],
      })

    const hecataResult =
      validateDisciplinesStep(
        hecata,
      )

    const lasombraResult =
      validateDisciplinesStep(
        lasombra,
      )

    const message =
      'Debes seleccionar exactamente una Ceremonia inicial de Olvido.'

    assert.equal(
      hecataResult.errors.includes(
        message,
      ),
      true,
    )

    assert.equal(
      lasombraResult.errors.includes(
        message,
      ),
      true,
    )
  },
)

test(
  'retirar el Poder habilitante elimina automáticamente la Ceremonia incompatible',
  () => {
    const draft =
      createDraft({
        powerKeys: [],

        ceremonyKeys: [
          'oblivion-ceremony-gift-of-false-life',
        ],
      })

    const normalized =
      normalizeCharacterDraftOblivionCeremonies(
        draft,
      )

    assert.deepEqual(
      normalized
        .oblivionCeremonies
        .ceremonyKeys,
      [],
    )
  },
)

test(
  'perder Olvido elimina automáticamente todas las Ceremonias',
  () => {
    const draft =
      createDraft({
        oblivionLevel: 0,

        powerKeys: [
          'oblivion-ashes-to-ashes',
        ],

        ceremonyKeys: [
          'oblivion-ceremony-gift-of-false-life',
        ],
      })

    const normalized =
      normalizeCharacterDraftOblivionCeremonies(
        draft,
      )

    assert.deepEqual(
      normalized
        .oblivionCeremonies
        .ceremonyKeys,
      [],
    )
  },
)

test(
  'cambiar entre Poderes habilitantes limpia una Ceremonia que ya no corresponde',
  () => {
    const draft =
      createDraft({
        powerKeys: [
          'oblivion-binding-fetter',
        ],

        ceremonyKeys: [
          'oblivion-ceremony-gift-of-false-life',
        ],
      })

    const normalized =
      normalizeCharacterDraftOblivionCeremonies(
        draft,
      )

    assert.deepEqual(
      normalized
        .oblivionCeremonies
        .ceremonyKeys,
      [],
    )
  },
)
