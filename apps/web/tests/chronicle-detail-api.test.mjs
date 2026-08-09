import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createChronicleGateway,
} from '../src/features/chronicles/infrastructure/chronicle.api.ts'

test(
  '030-D obtiene una crónica concreta mediante GET',
  async () => {
    const calls = []

    const gateway =
      createChronicleGateway(
        async (url, init) => {
          calls.push([url, init])

          return new Response(
            JSON.stringify({
              id: 'chronicle-030-d',
              narratorId:
                'narrator-030-d',
              name: 'Crónica',
              description: 'Premisa',
              status: 'active',
              createdAt:
                '2026-08-09T18:00:00.000Z',
              updatedAt:
                '2026-08-09T19:00:00.000Z',
            }),
            {
              status: 200,
              headers: {
                'Content-Type':
                  'application/json',
              },
            },
          )
        },
      )

    const result =
      await gateway.get(
        'chronicle-030-d',
      )

    assert.equal(
      result.name,
      'Crónica',
    )
    assert.equal(
      calls[0][0],
      '/api/chronicles/chronicle-030-d',
    )
    assert.equal(
      calls[0][1].method,
      undefined,
    )
  },
)
