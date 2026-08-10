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

const participant = {
  id: 'participant-1',
  chronicleId: 'chronicle-1',
  userId: 'user-1',
  username: 'jugador',
  displayName: 'Jugador',
  role: 'player',
  status: 'active',
  createdAt:
    '2026-08-09T20:00:00.000Z',
  updatedAt:
    '2026-08-09T20:00:00.000Z',
}

test(
  '031-D gateway consulta participantes candidatos y personajes',
  async () => {
    const calls = []

    const gateway =
      createChronicleGateway(
        async (url, init) => {
          calls.push([url, init])

          if (
            url.endsWith(
              '/participant-candidates',
            )
          ) {
            return response([
              {
                id: 'user-2',
                username: 'otro',
                displayName: 'Otro',
              },
            ])
          }

          if (
            url.endsWith('/characters')
          ) {
            return response([
              {
                characterId:
                  'character-1',
                ownerId: 'user-1',
                chronicleId:
                  'chronicle-1',
                status: 'active',
                name: 'Alicia',
                concept: null,
                updatedAt:
                  '2026-08-09T20:00:00.000Z',
              },
            ])
          }

          return response([
            participant,
          ])
        },
      )

    assert.equal(
      (
        await gateway.participants(
          'chronicle-1',
        )
      ).length,
      1,
    )

    assert.equal(
      (
        await gateway.participantCandidates(
          'chronicle-1',
        )
      ).length,
      1,
    )

    assert.equal(
      (
        await gateway.characters(
          'chronicle-1',
        )
      ).length,
      1,
    )

    assert.deepEqual(
      calls.map(([url]) => url),
      [
        '/api/chronicles/chronicle-1/participants',
        '/api/chronicles/chronicle-1/participant-candidates',
        '/api/chronicles/chronicle-1/characters',
      ],
    )
  },
)

test(
  '031-D gateway incorpora y retira participantes explícitamente',
  async () => {
    const calls = []

    const gateway =
      createChronicleGateway(
        async (url, init) => {
          calls.push([url, init])
          return response(participant)
        },
      )

    await gateway.addParticipant(
      'chronicle-1',
      {
        userId: 'user-1',
        role: 'player',
      },
    )

    await gateway.retireParticipant(
      'chronicle-1',
      'participant-1',
    )

    assert.equal(
      calls[0][1].method,
      'POST',
    )
    assert.deepEqual(
      JSON.parse(calls[0][1].body),
      {
        userId: 'user-1',
        role: 'player',
      },
    )

    assert.equal(
      calls[1][1].method,
      'PATCH',
    )
    assert.equal(
      calls[1][0],
      '/api/chronicles/chronicle-1/participants/participant-1/retire',
    )
  },
)
