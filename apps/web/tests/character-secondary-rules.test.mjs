import assert from 'node:assert/strict'
import test from 'node:test'

import { demoSecondary } from '../src/features/character-sheet/data/demo-secondary.ts'

import {
  createEmptyCharacterSecondaryData,
  validateCharacterSecondaryData,
} from '../src/features/character-sheet/domain/character-secondary-rules.ts'

test(
  '028-A define estados vacíos explícitos para las tres áreas secundarias',
  () => {
    const empty =
      createEmptyCharacterSecondaryData()

    assert.deepEqual(empty, {
      inventory: [],
      notes: [],
      history: [],
    })
    assert.deepEqual(
      validateCharacterSecondaryData(empty),
      [],
    )
  },
)

test(
  '028-A valida el contrato estructurado mostrado por la ficha',
  () => {
    assert.deepEqual(
      validateCharacterSecondaryData(
        demoSecondary,
      ),
      [],
    )

    assert.deepEqual(
      Object.keys(demoSecondary.inventory[0]),
      [
        'id',
        'name',
        'quantity',
        'description',
        'category',
        'notes',
        'status',
      ],
    )
    assert.deepEqual(
      Object.keys(demoSecondary.notes[0]),
      ['id', 'content'],
    )
    assert.deepEqual(
      Object.keys(demoSecondary.history[0]),
      ['id', 'title', 'description'],
    )
  },
)

test(
  '028-A rechaza identidades duplicadas y cantidades imposibles',
  () => {
    const item = demoSecondary.inventory[0]

    assert.deepEqual(
      validateCharacterSecondaryData({
        inventory: [
          item,
          {
            ...item,
            quantity: 0,
          },
        ],
        notes: demoSecondary.notes,
        history: demoSecondary.history,
      }),
      [
        'INVENTORY_ID_DUPLICATED',
        'INVENTORY_QUANTITY_INVALID',
      ],
    )
  },
)

test(
  '028-A rechaza textos obligatorios vacíos sin añadir privacidad prematura',
  () => {
    const note = demoSecondary.notes[0]
    const entry = demoSecondary.history[0]
    const data = {
      inventory: demoSecondary.inventory,
      notes: [
        {
          ...note,
          content: '   ',
        },
      ],
      history: [
        {
          ...entry,
          title: '',
          description: '',
        },
      ],
    }

    assert.deepEqual(
      validateCharacterSecondaryData(data),
      [
        'NOTE_CONTENT_REQUIRED',
        'HISTORY_TITLE_REQUIRED',
        'HISTORY_DESCRIPTION_REQUIRED',
      ],
    )
    assert.equal(
      Object.hasOwn(note, 'visibility'),
      false,
    )
    assert.equal(
      Object.hasOwn(entry, 'audit'),
      false,
    )
  },
)
