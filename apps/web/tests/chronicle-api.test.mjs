import assert from 'node:assert/strict'
import test from 'node:test'

import {
  ChronicleApiError,
  createChronicleGateway,
  parseChronicleApiListResponse,
  parseChronicleApiSnapshotResponse,
} from '../src/features/chronicles/infrastructure/chronicle.api.ts'

function snapshot(overrides = {}) {
  return {
    id:
      '39c1801e-68fe-4c92-8795-723cac284bdf',
    narratorId:
      '3bbc46f8-a45f-4589-9872-129e6652082c',
    name: 'Noches de A Coruña',
    description: null,
    status: 'preparation',
    createdAt:
      '2026-08-04T17:30:00.000Z',
    updatedAt:
      '2026-08-04T17:30:00.000Z',
    ...overrides,
  }
}

function jsonResponse(
  body,
  options = {},
) {
  return new Response(
    JSON.stringify(body),
    {
      status: options.status ?? 200,
      headers: {
        'Content-Type':
          'application/json',
      },
    },
  )
}

test(
  '030-B valida snapshots y listados de Crónicas',
  () => {
    assert.deepEqual(
      parseChronicleApiSnapshotResponse(
        snapshot(),
      ),
      snapshot(),
    )
    assert.equal(
      parseChronicleApiListResponse([
        snapshot(),
      ]).length,
      1,
    )
  },
)

test(
  '030-B rechaza respuestas incompletas',
  () => {
    assert.throws(
      () =>
        parseChronicleApiSnapshotResponse({
          ...snapshot(),
          status: 'unknown',
        }),
      (error) =>
        error instanceof
          ChronicleApiError &&
        error.code ===
          'INVALID_CHRONICLE_RESPONSE',
    )

    assert.throws(
      () =>
        parseChronicleApiListResponse({}),
      ChronicleApiError,
    )
  },
)

test(
  '030-B lista usando sesión del navegador',
  async () => {
    const calls = []
    const gateway =
      createChronicleGateway(
        async (url, init) => {
          calls.push([url, init])
          return jsonResponse([
            snapshot(),
          ])
        },
      )

    assert.equal(
      (await gateway.list()).length,
      1,
    )
    assert.equal(
      calls[0]?.[0],
      '/api/chronicles',
    )
    assert.equal(
      calls[0]?.[1]?.credentials,
      'include',
    )
  },
)

test(
  '030-B crea mediante POST con contrato explícito',
  async () => {
    const calls = []
    const gateway =
      createChronicleGateway(
        async (url, init) => {
          calls.push([url, init])
          return jsonResponse(
            snapshot(),
          )
        },
      )

    await gateway.create({
      name: 'Noches de A Coruña',
      description: null,
    })

    assert.equal(
      calls[0]?.[1]?.method,
      'POST',
    )
    assert.deepEqual(
      JSON.parse(
        calls[0]?.[1]?.body,
      ),
      {
        name: 'Noches de A Coruña',
        description: null,
      },
    )
  },
)

test(
  '030-B conserva estado y código de errores HTTP',
  async () => {
    const gateway =
      createChronicleGateway(
        async () =>
          jsonResponse(
            {
              code:
                'AUTHENTICATION_REQUIRED',
            },
            {
              status: 401,
            },
          ),
      )

    await assert.rejects(
      gateway.list(),
      (error) =>
        error instanceof
          ChronicleApiError &&
        error.status === 401 &&
        error.code ===
          'AUTHENTICATION_REQUIRED',
    )
  },
)
