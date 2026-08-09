import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createChronicleGateway,
} from '../src/features/chronicles/infrastructure/chronicle.api.ts'

function response(body) {
  return new Response(
    JSON.stringify(body),
    {
      status: 200,
      headers: {
        'Content-Type':
          'application/json',
      },
    },
  )
}

test(
  '030-C cambia lifecycle mediante PATCH explícito',
  async () => {
    const calls = []

    const gateway =
      createChronicleGateway(
        async (url, init) => {
          calls.push([url, init])

          return response({
            id: 'chronicle-030-c',
            narratorId:
              'narrator-030-c',
            name: 'Crónica',
            description: null,
            status: 'archived',
            createdAt:
              '2026-08-09T18:00:00.000Z',
            updatedAt:
              '2026-08-09T18:05:00.000Z',
          })
        },
      )

    const result =
      await gateway.transition(
        'chronicle-030-c',
        {
          nextStatus: 'archived',
        },
      )

    assert.equal(
      result.status,
      'archived',
    )
    assert.equal(
      calls[0][0],
      '/api/chronicles/chronicle-030-c/lifecycle',
    )
    assert.equal(
      calls[0][1].method,
      'PATCH',
    )
    assert.deepEqual(
      JSON.parse(
        calls[0][1].body,
      ),
      {
        nextStatus: 'archived',
      },
    )
  },
)
