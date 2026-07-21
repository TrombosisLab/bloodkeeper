import assert from 'node:assert/strict'
import test from 'node:test'

import {
  initialCharacterDraft,
} from '../src/features/character-creation/data/initial-character-draft.ts'

import {
  applyCharacterDraftUpdate,
} from '../src/features/character-creation/domain/blood-sorcery-ritual-draft-rules.ts'

import {
  normalizeOblivionCeremoniesForDraft,
} from '../src/features/character-creation/domain/oblivion-ceremony-draft-rules.ts'

const GIFT_OF_FALSE_LIFE =
  'oblivion-ceremony-gift-of-false-life'

const COMPEL_SPIRIT =
  'oblivion-ceremony-compel-spirit'

test(
  'CharacterDraft inicial contiene Ceremonias de Olvido vacías',
  () => {
    assert.deepEqual(
      initialCharacterDraft
        .oblivionCeremonies,
      {
        ceremonyKeys: [],
      },
    )
  },
)

test(
  'sin Olvido las Ceremonias se eliminan',
  () => {
    const draft = {
      ...initialCharacterDraft,

      disciplines: [],

      oblivionCeremonies: {
        ceremonyKeys: [
          GIFT_OF_FALSE_LIFE,
        ],
      },
    }

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
  'una Ceremonia válida se conserva con Olvido suficiente y su Poder requerido',
  () => {
    const draft = {
      ...initialCharacterDraft,

      disciplines: [
        {
          key: 'oblivion',
          value: 1,
          powerKeys: [
            'oblivion-ashes-to-ashes',
          ],
        },
      ],

      oblivionCeremonies: {
        ceremonyKeys: [
          GIFT_OF_FALSE_LIFE,
        ],
      },
    }

    assert.deepEqual(
      normalizeOblivionCeremoniesForDraft(
        draft,
      ),
      {
        ceremonyKeys: [
          GIFT_OF_FALSE_LIFE,
        ],
      },
    )
  },
)

test(
  'una Ceremonia se elimina si falta su Poder prerrequisito',
  () => {
    const draft = {
      ...initialCharacterDraft,

      disciplines: [
        {
          key: 'oblivion',
          value: 1,
          powerKeys: [
            'oblivion-binding-fetter',
          ],
        },
      ],

      oblivionCeremonies: {
        ceremonyKeys: [
          GIFT_OF_FALSE_LIFE,
        ],
      },
    }

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
  'normalización elimina Ceremonias inexistentes y duplicadas',
  () => {
    const draft = {
      ...initialCharacterDraft,

      disciplines: [
        {
          key: 'oblivion',
          value: 1,
          powerKeys: [
            'oblivion-ashes-to-ashes',
          ],
        },
      ],

      oblivionCeremonies: {
        ceremonyKeys: [
          GIFT_OF_FALSE_LIFE,
          'ceremony-inexistente',
          GIFT_OF_FALSE_LIFE,
        ],
      },
    }

    assert.deepEqual(
      normalizeOblivionCeremoniesForDraft(
        draft,
      ),
      {
        ceremonyKeys: [
          GIFT_OF_FALSE_LIFE,
        ],
      },
    )
  },
)

test(
  'una Ceremonia se elimina si supera el nivel actual de Olvido',
  () => {
    const draft = {
      ...initialCharacterDraft,

      disciplines: [
        {
          key: 'oblivion',
          value: 1,
          powerKeys: [
            'oblivion-where-the-shroud-thins',
          ],
        },
      ],

      oblivionCeremonies: {
        ceremonyKeys: [
          COMPEL_SPIRIT,
        ],
      },
    }

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
  'retirar Olvido mediante applyCharacterDraftUpdate limpia automáticamente las Ceremonias',
  () => {
    const draft = {
      ...initialCharacterDraft,

      disciplines: [
        {
          key: 'oblivion',
          value: 1,
          powerKeys: [
            'oblivion-ashes-to-ashes',
          ],
        },
      ],

      oblivionCeremonies: {
        ceremonyKeys: [
          GIFT_OF_FALSE_LIFE,
        ],
      },
    }

    const result =
      applyCharacterDraftUpdate(
        draft,
        (current) => ({
          ...current,
          disciplines: [],
        }),
      )

    assert.deepEqual(
      result.oblivionCeremonies,
      {
        ceremonyKeys: [],
      },
    )
  },
)

test(
  'retirar el Poder prerrequisito limpia automáticamente la Ceremonia',
  () => {
    const draft = {
      ...initialCharacterDraft,

      disciplines: [
        {
          key: 'oblivion',
          value: 1,
          powerKeys: [
            'oblivion-ashes-to-ashes',
          ],
        },
      ],

      oblivionCeremonies: {
        ceremonyKeys: [
          GIFT_OF_FALSE_LIFE,
        ],
      },
    }

    const result =
      applyCharacterDraftUpdate(
        draft,
        (current) => ({
          ...current,

          disciplines:
            current.disciplines.map(
              (discipline) =>
                discipline.key ===
                'oblivion'
                  ? {
                      ...discipline,
                      powerKeys: [
                        'oblivion-binding-fetter',
                      ],
                    }
                  : discipline,
            ),
        }),
      )

    assert.deepEqual(
      result.oblivionCeremonies,
      {
        ceremonyKeys: [],
      },
    )
  },
)
