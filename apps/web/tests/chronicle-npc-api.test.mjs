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

const npc = {
  id: 'npc-1',
  chronicleId: 'chronicle-1',
  name: 'Guardia del Elíseo',
  category: 'Vástago',
  description: 'Custodia la entrada.',
  narrativeRole: 'Contacto',
  notes: 'No confía en los Brujah.',
  status: 'active',
  detailLevel: 'simple',
  createdAt:
    '2026-08-10T09:00:00.000Z',
  updatedAt:
    '2026-08-10T09:00:00.000Z',
}

test(
  '032-C gateway lista y consulta PNJ',
  async () => {
    const calls = []

    const gateway =
      createChronicleGateway(
        async (url, init) => {
          calls.push([url, init])

          if (
            url.endsWith(
              '/npcs/npc-1',
            )
          ) {
            return response(npc)
          }

          return response({
            items: [npc],
            nextOffset: null,
          })
        },
      )

    assert.equal(
      (
        await gateway.npcs(
          'chronicle-1',
        )
      ).items.length,
      1,
    )

    assert.equal(
      (
        await gateway.npc(
          'chronicle-1',
          'npc-1',
        )
      ).id,
      'npc-1',
    )

    assert.deepEqual(
      calls.map(([url]) => url),
      [
        '/api/chronicles/chronicle-1/npcs?limit=25&offset=0',
        '/api/chronicles/chronicle-1/npcs/npc-1',
      ],
    )
  },
)

test(
  '032-C gateway crea edita y archiva PNJ explícitamente',
  async () => {
    const calls = []

    const gateway =
      createChronicleGateway(
        async (url, init) => {
          calls.push([url, init])
          return response(npc)
        },
      )

    await gateway.createNpc(
      'chronicle-1',
      {
        name: 'Guardia',
        category: null,
        description: null,
        narrativeRole: null,
        notes: null,
      },
    )

    await gateway.updateNpc(
      'chronicle-1',
      'npc-1',
      {
        name: 'Guardia veterano',
      },
    )

    await gateway.archiveNpc(
      'chronicle-1',
      'npc-1',
    )

    assert.equal(
      calls[0][1].method,
      'POST',
    )
    assert.equal(
      calls[1][1].method,
      'PATCH',
    )
    assert.equal(
      calls[2][1].method,
      'PATCH',
    )

    assert.equal(
      calls[0][0],
      '/api/chronicles/chronicle-1/npcs',
    )
    assert.equal(
      calls[1][0],
      '/api/chronicles/chronicle-1/npcs/npc-1',
    )
    assert.equal(
      calls[2][0],
      '/api/chronicles/chronicle-1/npcs/npc-1/archive',
    )

    assert.deepEqual(
      JSON.parse(
        calls[1][1].body,
      ),
      {
        name: 'Guardia veterano',
      },
    )
  },
)

test(
  '032-C parser rechaza respuestas PNJ fuera del contrato simple',
  async () => {
    const gateway =
      createChronicleGateway(
        async () =>
          response({
            ...npc,
            detailLevel: 'developed',
          }),
      )

    await assert.rejects(
      gateway.npc(
        'chronicle-1',
        'npc-1',
      ),
      (error) =>
        error.code ===
        'INVALID_CHRONICLE_RESPONSE',
    )
  },
)
