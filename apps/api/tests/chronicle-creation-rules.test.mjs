import assert from 'node:assert/strict'
import test from 'node:test'

import {
  InvalidChronicleCreationError,
  normalizeChronicleCreation,
} from '../dist/chronicles/domain/chronicle-creation.rules.js'

const narratorId =
  '3bbc46f8-a45f-4589-9872-129e6652082c'

test(
  '030-B normaliza nombre y descripción al crear',
  () => {
    assert.deepEqual(
      normalizeChronicleCreation({
        narratorId,
        name: '  Noches de A Coruña  ',
        description:
          '  Intriga política local.  ',
      }),
      {
        narratorId,
        name: 'Noches de A Coruña',
        description:
          'Intriga política local.',
      },
    )
  },
)

test(
  '030-B convierte una descripción vacía en null',
  () => {
    assert.equal(
      normalizeChronicleCreation({
        narratorId,
        name: 'Crónica',
        description: '   ',
      }).description,
      null,
    )
  },
)

test(
  '030-B rechaza una Crónica sin nombre',
  () => {
    assert.throws(
      () =>
        normalizeChronicleCreation({
          narratorId,
          name: '   ',
          description: null,
        }),
      (error) =>
        error instanceof
          InvalidChronicleCreationError &&
        error.issues[0]?.code ===
          'CHRONICLE_NAME_REQUIRED',
    )
  },
)
