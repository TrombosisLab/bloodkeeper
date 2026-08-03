import assert from 'node:assert/strict'
import test from 'node:test'

import {
  InvalidCharacterSecondaryDataError,
  assertValidCharacterSecondaryUpdate,
  validateCharacterSecondaryUpdate,
} from '../dist/characters/domain/character-secondary.rules.js'

const characterId =
  '39c1801e-68fe-4c92-8795-723cac284bdf'
const firstId =
  '4f3c19eb-e667-43a3-b94b-31b2b5adb742'

test(
  '028-E acepta las tres secciones secundarias validas',
  () => {
    const updates = [
      {
        characterId,
        expectedRevision: 1,
        section: 'inventory',
        inventory: [
          {
            id: firstId,
            name: 'Revolver',
            quantity: 1,
            description: 'Arma corta',
            category: null,
            notes: null,
            status: 'active',
          },
        ],
      },
      {
        characterId,
        expectedRevision: 1,
        section: 'notes',
        notes: [
          { id: firstId, content: 'Refugio' },
        ],
      },
      {
        characterId,
        expectedRevision: 1,
        section: 'history',
        history: [
          {
            id: firstId,
            title: 'Abrazo',
            description: 'Noche de origen',
          },
        ],
      },
    ]

    for (const update of updates) {
      assert.deepEqual(
        validateCharacterSecondaryUpdate(update),
        [],
      )
    }
  },
)

test(
  '028-E detecta identidad duplicada y contenido de inventario invalido',
  () => {
    const item = {
      id: firstId,
      name: ' ',
      quantity: 0,
      description: '',
      category: null,
      notes: null,
      status: 'unknown',
    }
    const violations =
      validateCharacterSecondaryUpdate({
        characterId,
        expectedRevision: 1,
        section: 'inventory',
        inventory: [item, item],
      })

    assert.deepEqual(violations, [
      'SECONDARY_ID_DUPLICATED',
      'INVENTORY_NAME_REQUIRED',
      'INVENTORY_QUANTITY_INVALID',
      'INVENTORY_OPTIONAL_TEXT_EMPTY',
      'INVENTORY_STATUS_INVALID',
    ])
  },
)

test(
  '028-E rechaza notas e historia sin contenido',
  () => {
    assert.deepEqual(
      validateCharacterSecondaryUpdate({
        characterId,
        expectedRevision: 1,
        section: 'notes',
        notes: [{ id: firstId, content: ' ' }],
      }),
      ['NOTE_CONTENT_REQUIRED'],
    )
    assert.deepEqual(
      validateCharacterSecondaryUpdate({
        characterId,
        expectedRevision: 1,
        section: 'history',
        history: [
          {
            id: firstId,
            title: '',
            description: ' ',
          },
        ],
      }),
      [
        'HISTORY_TITLE_REQUIRED',
        'HISTORY_DESCRIPTION_REQUIRED',
      ],
    )
  },
)

test(
  '028-E publica un error de dominio estable',
  () => {
    assert.throws(
      () =>
        assertValidCharacterSecondaryUpdate({
          characterId,
          expectedRevision: 1,
          section: 'notes',
          notes: [
            { id: firstId, content: '' },
          ],
        }),
      (error) => {
        assert.ok(
          error instanceof
            InvalidCharacterSecondaryDataError,
        )
        assert.deepEqual(error.violations, [
          'NOTE_CONTENT_REQUIRED',
        ])
        return true
      },
    )
  },
)
