import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CharacterStateApiError,
  createCharacterStateGateway,
  parseCharacterStateResponse,
} from '../src/features/character-sheet/infrastructure/character-state.api.ts'

const characterId =
  '39c1801e-68fe-4c92-8795-723cac284bdf'

function snapshot() {
  return {
    characterId,
    revision: 5,
    status: 'active',
    hunger: 3,
    damage: {
      health: {
        superficial: 2,
        aggravated: 0,
      },
      willpower: {
        superficial: 1,
        aggravated: 1,
      },
    },
    humanity: {
      value: 6,
      stains: 2,
    },
  }
}

test(
  'SPEC-024 valida el snapshot operativo',
  () => {
    assert.deepEqual(
      parseCharacterStateResponse(
        snapshot(),
      ),
      snapshot(),
    )

    assert.throws(
      () =>
        parseCharacterStateResponse({
          ...snapshot(),
          humanity: {
            value: 9,
            stains: 2,
          },
        }),
      CharacterStateApiError,
    )
  },
)

test(
  'SPEC-024 PATCH envía revisión y sólo cambios de estado',
  async () => {
    const calls = []

    const gateway =
      createCharacterStateGateway(
        async (url, init) => {
          calls.push([url, init])

          return new Response(
            JSON.stringify(snapshot()),
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

    await gateway.update(
      characterId,
      4,
      {
        humanityValue: 6,
        humanityStains: 2,
        hunger: 3,
      },
    )

    assert.equal(
      calls[0][0],
      `/api/characters/${characterId}/state`,
    )
    assert.equal(
      calls[0][1].method,
      'PATCH',
    )

    const body =
      JSON.parse(calls[0][1].body)

    assert.deepEqual(body, {
      expectedRevision: 4,
      humanityValue: 6,
      humanityStains: 2,
      hunger: 3,
    })
    assert.equal(
      Object.hasOwn(body, 'hunger'),
      true,
    )
  },
)

test(
  'SPEC-024 conserva conflicto de revisión como 409',
  async () => {
    const gateway =
      createCharacterStateGateway(
        async () =>
          new Response(
            JSON.stringify({
              code:
                'CHARACTER_STATE_WRITE_CONFLICT',
            }),
            {
              status: 409,
              headers: {
                'Content-Type':
                  'application/json',
              },
            },
          ),
      )

    await assert.rejects(
      gateway.update(
        characterId,
        4,
        {
          humanityValue: 6,
        },
      ),
      (error) => {
        assert.ok(
          error instanceof
            CharacterStateApiError,
        )
        assert.equal(error.status, 409)
        assert.equal(
          error.code,
          'CHARACTER_STATE_WRITE_CONFLICT',
        )
        return true
      },
    )
  },
)

test(
  '027-E rechaza snapshots con Hambre fuera de rango',
  () => {
    assert.throws(
      () =>
        parseCharacterStateResponse({
          ...snapshot(),
          hunger: 6,
        }),
      CharacterStateApiError,
    )
  },
)
