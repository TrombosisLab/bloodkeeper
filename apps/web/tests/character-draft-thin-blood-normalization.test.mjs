import assert from 'node:assert/strict'
import test from 'node:test'

import {
  initialCharacterDraft,
} from '../src/features/character-creation/data/initial-character-draft.ts'

import {
  normalizeCharacterDraft,
} from '../src/features/character-creation/domain/character-draft-normalization.ts'

test(
  'cambiar de Sangre Débil a otro clan elimina rasgos y Alquimia residuales',
  () => {
    const draftWithGhostData = {
      ...initialCharacterDraft,

      identity: {
        ...initialCharacterDraft.identity,
        clan: 'brujah',
      },

      thinBloodTraits: {
        selections: [
          {
            definitionKey:
              'thin-blood-alchemist',
          },
        ],
      },

      thinBloodAlchemy: {
        rating: 3,
        method: 'fixatio',
        formulaKeys: [
          'formula-fantasma-1',
          'formula-fantasma-2',
          'formula-fantasma-3',
        ],
      },
    }

    const normalized =
      normalizeCharacterDraft(
        draftWithGhostData,
      )

    assert.deepEqual(
      normalized.thinBloodTraits,
      {
        selections: [],
      },
    )

    assert.deepEqual(
      normalized.thinBloodAlchemy,
      {
        rating: 0,
        method: null,
        formulaKeys: [],
      },
    )
  },
)

test(
  'volver a Sangre Débil después de cambiar de clan no recupera datos eliminados',
  () => {
    const formerThinBlood = {
      ...initialCharacterDraft,

      identity: {
        ...initialCharacterDraft.identity,
        clan: 'nosferatu',
      },

      thinBloodTraits: {
        selections: [
          {
            definitionKey:
              'thin-blood-alchemist',
          },
        ],
      },

      thinBloodAlchemy: {
        rating: 2,
        method: 'athanorCorporis',
        formulaKeys: [
          'formula-fantasma-1',
          'formula-fantasma-2',
        ],
      },
    }

    const cleaned =
      normalizeCharacterDraft(
        formerThinBlood,
      )

    const returnedToThinBlood =
      normalizeCharacterDraft({
        ...cleaned,

        identity: {
          ...cleaned.identity,
          clan: 'thinBlood',
        },
      })

    assert.deepEqual(
      returnedToThinBlood
        .thinBloodTraits,
      {
        selections: [],
      },
    )

    assert.deepEqual(
      returnedToThinBlood
        .thinBloodAlchemy,
      {
        rating: 0,
        method: null,
        formulaKeys: [],
      },
    )
  },
)
