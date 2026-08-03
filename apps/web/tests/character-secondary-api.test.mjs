import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CharacterSecondaryApiError,
  createCharacterSecondaryGateway,
} from '../src/features/character-sheet/infrastructure/character-secondary.api.ts'

const characterId =
  '39c1801e-68fe-4c92-8795-723cac284bdf'
const entryId =
  '4f3c19eb-e667-43a3-b94b-31b2b5adb742'

function snapshot() {
  return {
    characterId,
    revision: 3,
    inventory: [
      {
        id: entryId,
        name: 'Llave',
        quantity: 1,
        description: null,
        category: null,
        notes: null,
        status: 'active',
      },
    ],
    notes: [],
    history: [],
  }
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

test(
  '028-F carga datos secundarios usando la sesion del navegador',
  async () => {
    const calls = []
    const gateway =
      createCharacterSecondaryGateway(
        async (...parameters) => {
          calls.push(parameters)
          return jsonResponse(snapshot())
        },
      )

    assert.deepEqual(
      await gateway.load(characterId),
      snapshot(),
    )
    assert.equal(
      calls[0][0],
      `/api/characters/${characterId}/secondary`,
    )
    assert.equal(
      calls[0][1].credentials,
      'include',
    )
    assert.equal(calls[0][1].method, undefined)
    assert.equal(
      calls[0][1].headers.Authorization,
      undefined,
    )
  },
)

test(
  '028-F guarda exclusivamente la seccion modificada y su revision',
  async () => {
    const calls = []
    const gateway =
      createCharacterSecondaryGateway(
        async (...parameters) => {
          calls.push(parameters)
          return jsonResponse(snapshot())
        },
      )
    const data = snapshot()

    await gateway.update(
      characterId,
      2,
      'notes',
      data,
    )

    const request = calls[0][1]
    assert.equal(request.method, 'PATCH')
    assert.equal(request.credentials, 'include')
    assert.deepEqual(
      JSON.parse(request.body),
      {
        expectedRevision: 2,
        section: 'notes',
        notes: [],
      },
    )
  },
)

test(
  '028-F preserva el codigo y estado de los errores HTTP',
  async () => {
    const gateway =
      createCharacterSecondaryGateway(
        async () =>
          jsonResponse(
            {
              code:
                'CHARACTER_SECONDARY_WRITE_CONFLICT',
            },
            409,
          ),
      )

    await assert.rejects(
      gateway.load(characterId),
      (error) => {
        assert.ok(
          error instanceof
            CharacterSecondaryApiError,
        )
        assert.equal(error.status, 409)
        assert.equal(
          error.code,
          'CHARACTER_SECONDARY_WRITE_CONFLICT',
        )
        return true
      },
    )
  },
)

test(
  '028-F rechaza respuestas exitosas con estructura invalida',
  async () => {
    const gateway =
      createCharacterSecondaryGateway(
        async () =>
          jsonResponse({
            characterId,
            revision: 0,
            inventory: [],
            notes: [],
            history: [],
          }),
      )

    await assert.rejects(
      gateway.load(characterId),
      {
        name: 'CharacterSecondaryApiError',
        status: 502,
        code:
          'INVALID_CHARACTER_SECONDARY_RESPONSE',
      },
    )
  },
)

test(
  '028-F rechaza contenido secundario invalido aunque tenga forma JSON',
  async () => {
    const invalid = snapshot()
    invalid.inventory[0].quantity = 0
    const gateway =
      createCharacterSecondaryGateway(
        async () => jsonResponse(invalid),
      )

    await assert.rejects(
      gateway.load(characterId),
      {
        code:
          'INVALID_CHARACTER_SECONDARY_RESPONSE',
      },
    )
  },
)

test(
  '028-F codifica la identidad del personaje en la ruta',
  async () => {
    let url = ''
    const gateway =
      createCharacterSecondaryGateway(
        async (input) => {
          url = String(input)
          return jsonResponse(snapshot())
        },
      )

    await gateway.load('personaje/con espacios')

    assert.equal(
      url,
      '/api/characters/personaje%2Fcon%20espacios/secondary',
    )
  },
)
