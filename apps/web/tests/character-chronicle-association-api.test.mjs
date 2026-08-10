import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createCharacterDraftGateway,
} from '../src/features/character-creation/infrastructure/character-draft.api.ts'

test(
  '031-D gateway usa operación dedicada para asociar personaje',
  async () => {
    const calls = []

    const gateway =
      createCharacterDraftGateway(
        async (url, init) => {
          calls.push([url, init])

          return new Response(
            JSON.stringify({
              code:
                'CHARACTER_DRAFT_WRITE_CONFLICT',
            }),
            {
              status: 409,
              headers: {
                'Content-Type':
                  'application/json',
              },
            },
          )
        },
      )

    await assert.rejects(
      gateway.updateChronicleAssociation(
        '11111111-1111-4111-8111-111111111111',
        {
          expectedRevision: 3,
          chronicleId:
            '33333333-3333-4333-8333-333333333333',
          confirmChange: false,
        },
      ),
    )

    assert.equal(
      calls[0][0],
      '/api/characters/drafts/11111111-1111-4111-8111-111111111111/chronicle',
    )
    assert.equal(
      calls[0][1].method,
      'PATCH',
    )
    assert.deepEqual(
      JSON.parse(calls[0][1].body),
      {
        expectedRevision: 3,
        chronicleId:
          '33333333-3333-4333-8333-333333333333',
        confirmChange: false,
      },
    )
  },
)
