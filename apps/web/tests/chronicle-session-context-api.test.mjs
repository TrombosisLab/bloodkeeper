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

const context = {
  sessionId: 'session-1',
  events: [
    {
      id: 'event-1',
      title: 'Llegada al Elíseo',
      status: 'active',
      narrativeTimeLabel:
        'Primera noche',
      realDate: null,
      timelineOrder: 0,
    },
  ],
  npcs: [
    {
      id: 'npc-1',
      name: 'Príncipe',
      status: 'active',
      category: 'Vástago',
      narrativeRole: 'Autoridad',
    },
  ],
  locations: [
    {
      id: 'location-1',
      name: 'Elíseo',
      status: 'active',
      category: 'Refugio neutral',
      parentLocationId: null,
    },
  ],
}

test(
  '035-D Web gateway consulta contexto exacto de Sesión',
  async () => {
    const calls = []

    const gateway =
      createChronicleGateway(
        async (
          url,
          init,
        ) => {
          calls.push([
            url,
            init,
          ])
          return response(context)
        },
      )

    const loaded =
      await gateway.sessionContext(
        'chronicle-1',
        'session-1',
      )

    assert.deepEqual(
      loaded,
      context,
    )

    assert.equal(
      calls[0][0],
      '/api/chronicles/chronicle-1/sessions/session-1/context',
    )
    assert.equal(
      calls[0][1].method,
      undefined,
    )
  },
)

test(
  '035-D Web gateway reemplaza contexto completo con PATCH',
  async () => {
    const calls = []

    const gateway =
      createChronicleGateway(
        async (
          url,
          init,
        ) => {
          calls.push([
            url,
            init,
          ])
          return response(context)
        },
      )

    const request = {
      eventIds: [
        'event-1',
      ],
      npcIds: [
        'npc-1',
      ],
      locationIds: [
        'location-1',
      ],
    }

    await gateway.replaceSessionContext(
      'chronicle-1',
      'session-1',
      request,
    )

    assert.equal(
      calls[0][0],
      '/api/chronicles/chronicle-1/sessions/session-1/context',
    )
    assert.equal(
      calls[0][1].method,
      'PATCH',
    )
    assert.deepEqual(
      JSON.parse(
        calls[0][1].body,
      ),
      request,
    )
  },
)

test(
  '035-D Web parser rechaza recursos fuera del contrato mínimo',
  async () => {
    const gateway =
      createChronicleGateway(
        async () =>
          response({
            ...context,
            events: [
              {
                ...context.events[0],
                status: 'planned',
              },
            ],
          }),
      )

    await assert.rejects(
      gateway.sessionContext(
        'chronicle-1',
        'session-1',
      ),
      (error) =>
        error.code ===
        'INVALID_CHRONICLE_RESPONSE',
    )
  },
)
