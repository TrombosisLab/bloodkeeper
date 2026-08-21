import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CharacterRouseCheckApiError,
  createCharacterRouseCheckGateway,
  parseCharacterRouseCheckResponse,
} from '../src/features/character-sheet/infrastructure/character-rouse-check.api.ts'

const resultPayload = {
  operationId:
    '11111111-1111-4111-8111-111111111111',
  reason: 'other',
  rolls: [4],
  selectedResult: 4,
  success: false,
  hungerBefore: 2,
  hungerAfter: 3,
  consequence: {
    kind: 'none',
  },
  rollHistoryId:
    '22222222-2222-4222-8222-222222222222',
  characterRevision: 9,
  createdAt:
    '2026-08-21T20:00:00.000Z',
}

test(
  '059-C parsea respuesta autoritativa sin recalcular Hambre',
  () => {
    assert.deepEqual(
      parseCharacterRouseCheckResponse(
        resultPayload,
      ),
      resultPayload,
    )
  },
)

test(
  '059-C rechaza respuestas incompletas o no d10',
  () => {
    for (const payload of [
      {
        ...resultPayload,
        rolls: [0],
      },
      {
        ...resultPayload,
        hungerAfter: 6,
      },
      {
        ...resultPayload,
        selectedResult: 9,
      },
      {
        ...resultPayload,
        consequence: {
          kind:
            'hungerFrenzyTestRequired',
          difficulty: 3,
        },
      },
    ]) {
      assert.throws(
        () =>
          parseCharacterRouseCheckResponse(
            payload,
          ),
        CharacterRouseCheckApiError,
      )
    }
  },
)

test(
  '059-C gateway usa POST dedicado y envía sólo intención',
  async () => {
    const calls = []

    const gateway =
      createCharacterRouseCheckGateway(
        async (...args) => {
          calls.push(args)

          return new Response(
            JSON.stringify(
              resultPayload,
            ),
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

    const request = {
      expectedRevision: 8,
      operationId:
        resultPayload.operationId,
      reason: 'other',
    }

    const response =
      await gateway.execute(
        'character with spaces',
        request,
      )

    assert.deepEqual(
      response,
      resultPayload,
    )
    assert.equal(
      calls[0][0],
      '/api/characters/character%20with%20spaces/blood/rouse-check',
    )

    const init = calls[0][1]
    assert.equal(init.method, 'POST')
    assert.equal(
      init.credentials,
      'include',
    )
    assert.deepEqual(
      JSON.parse(init.body),
      request,
    )
  },
)

test(
  '059-C gateway conserva conflicto HTTP',
  async () => {
    const gateway =
      createCharacterRouseCheckGateway(
        async () =>
          new Response(
            JSON.stringify({
              code:
                'CHARACTER_ROUSE_CHECK_CONFLICT',
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
      gateway.execute(
        'character-1',
        {
          expectedRevision: 3,
          operationId:
            resultPayload.operationId,
          reason: 'other',
        },
      ),
      (error) => {
        assert.ok(
          error instanceof
            CharacterRouseCheckApiError,
        )
        assert.equal(error.status, 409)
        assert.equal(
          error.code,
          'CHARACTER_ROUSE_CHECK_CONFLICT',
        )
        return true
      },
    )
  },
)

test(
  '059-C convierte fallo de red en error reintentable',
  async () => {
    const gateway =
      createCharacterRouseCheckGateway(
        async () => {
          throw new Error('network')
        },
      )

    await assert.rejects(
      gateway.execute(
        'character-1',
        {
          expectedRevision: 3,
          operationId:
            resultPayload.operationId,
          reason: 'other',
        },
      ),
      {
        name:
          'CharacterRouseCheckApiError',
        status: 0,
        code:
          'CHARACTER_ROUSE_CHECK_NETWORK_ERROR',
      },
    )
  },
)
