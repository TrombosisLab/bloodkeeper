import assert from 'node:assert/strict'
import test from 'node:test'

import {
  InvalidChronicleRequestError,
  parseChronicleNarratorId,
  parseCreateChronicleRequest,
  toChronicleResponse,
} from '../dist/chronicles/presentation/chronicle.dto.js'

const narratorId =
  '3bbc46f8-a45f-4589-9872-129e6652082c'

test(
  '030-B construye el comando desde el usuario autenticado',
  () => {
    assert.deepEqual(
      parseCreateChronicleRequest(
        narratorId,
        {
          name: 'Noches de A Coruña',
          description: null,
        },
      ),
      {
        narratorId,
        name: 'Noches de A Coruña',
        description: null,
      },
    )
  },
)

test(
  '030-B permite omitir la descripción',
  () => {
    assert.equal(
      parseCreateChronicleRequest(
        narratorId,
        {
          name: 'Crónica mínima',
        },
      ).description,
      null,
    )
  },
)

test(
  '030-B rechaza identidad, tipos y campos no autorizados',
  () => {
    assert.throws(
      () =>
        parseChronicleNarratorId(
          'not-a-uuid',
        ),
      InvalidChronicleRequestError,
    )

    assert.throws(
      () =>
        parseCreateChronicleRequest(
          narratorId,
          {
            name: 3,
          },
        ),
      /must be a string/,
    )

    assert.throws(
      () =>
        parseCreateChronicleRequest(
          narratorId,
          {
            name: 'Crónica',
            participants: [],
          },
        ),
      /is not allowed/,
    )
  },
)

test(
  '030-B serializa fechas y conserva el estado',
  () => {
    const now =
      new Date('2026-08-04T17:30:00.000Z')
    const response = toChronicleResponse({
      id:
        '39c1801e-68fe-4c92-8795-723cac284bdf',
      narratorId,
      name: 'Noches de A Coruña',
      description: null,
      status: 'preparation',
      createdAt: now,
      updatedAt: now,
    })

    assert.equal(
      response.createdAt,
      '2026-08-04T17:30:00.000Z',
    )
    assert.equal(
      response.status,
      'preparation',
    )
  },
)
