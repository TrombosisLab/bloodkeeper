import assert from 'node:assert/strict'
import test from 'node:test'

import {
  InvalidCharacterSecondaryRequestError,
  parseCharacterSecondaryOwnerId,
  parseUpdateCharacterSecondaryRequest,
  toCharacterSecondaryResponse,
} from '../dist/characters/presentation/character-secondary.dto.js'

const ownerId =
  '3bbc46f8-a45f-4589-9872-129e6652082c'
const characterId =
  '39c1801e-68fe-4c92-8795-723cac284bdf'
const entryId =
  '4f3c19eb-e667-43a3-b94b-31b2b5adb742'

test(
  '028-E analiza las tres variantes cerradas de actualizacion',
  () => {
    const bodies = [
      {
        expectedRevision: 2,
        section: 'inventory',
        inventory: [
          {
            id: entryId,
            name: 'Revolver',
            quantity: 1,
            description: null,
            category: 'Armas',
            notes: null,
            status: 'active',
          },
        ],
      },
      {
        expectedRevision: 2,
        section: 'notes',
        notes: [
          { id: entryId, content: 'Refugio' },
        ],
      },
      {
        expectedRevision: 2,
        section: 'history',
        history: [
          {
            id: entryId,
            title: 'Abrazo',
            description: 'Noche de origen',
          },
        ],
      },
    ]

    for (const body of bodies) {
      assert.deepEqual(
        parseUpdateCharacterSecondaryRequest(
          characterId,
          body,
        ),
        { characterId, ...body },
      )
    }
  },
)

test(
  '028-E rechaza campos inesperados y secciones mezcladas',
  () => {
    const invalidBodies = [
      {
        expectedRevision: 1,
        section: 'notes',
        notes: [],
        history: [],
      },
      {
        expectedRevision: 1,
        section: 'inventory',
        notes: [],
      },
    ]

    for (const body of invalidBodies) {
      assert.throws(
        () =>
          parseUpdateCharacterSecondaryRequest(
            characterId,
            body,
          ),
        InvalidCharacterSecondaryRequestError,
      )
    }
  },
)

test(
  '028-E exige UUID, revision positiva y tipos exactos',
  () => {
    assert.throws(
      () => parseCharacterSecondaryOwnerId('owner'),
      InvalidCharacterSecondaryRequestError,
    )
    assert.throws(
      () =>
        parseUpdateCharacterSecondaryRequest(
          characterId,
          {
            expectedRevision: 0,
            section: 'notes',
            notes: [],
          },
        ),
      InvalidCharacterSecondaryRequestError,
    )
    assert.throws(
      () =>
        parseUpdateCharacterSecondaryRequest(
          characterId,
          {
            expectedRevision: 1,
            section: 'notes',
            notes: [
              { id: entryId, content: 12 },
            ],
          },
        ),
      InvalidCharacterSecondaryRequestError,
    )
  },
)

test(
  '028-E devuelve una copia del estado secundario',
  () => {
    const source = {
      characterId,
      revision: 3,
      inventory: [],
      notes: [{ id: entryId, content: 'Nota' }],
      history: [],
    }
    const response =
      toCharacterSecondaryResponse(source)

    assert.deepEqual(response, source)
    assert.notEqual(response.notes, source.notes)
    assert.notEqual(response.notes[0], source.notes[0])
  },
)
