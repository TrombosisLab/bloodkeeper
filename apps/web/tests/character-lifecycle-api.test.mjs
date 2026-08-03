import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CharacterLifecycleApiError,
  createCharacterLifecycleGateway,
} from '../src/features/character-sheet/infrastructure/character-lifecycle.api.ts'

const characterId =
  '39c1801e-68fe-4c92-8795-723cac284bdf'

const sections = [
  'identity',
  'attributes',
  'skills',
  'blood',
  'disciplines',
  'advantages',
  'humanity',
  'derived',
  'dependencies',
]

function report() {
  return {
    context: 'activation',
    valid: true,
    canProceed: true,
    sections: sections.map((section) => ({
      section,
      state: 'complete',
      issues: [],
    })),
    issues: [],
  }
}

function responseBody({
  status = 'active',
  revision = 5,
  validation = report(),
} = {}) {
  return {
    character: {
      characterId,
      status,
      revision,
      ignoredCharacterData: true,
    },
    validation,
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
  '029-J envia una transicion explicita con sesion y revision',
  async () => {
    const calls = []
    const gateway = createCharacterLifecycleGateway(
      async (...parameters) => {
        calls.push(parameters)
        return jsonResponse(responseBody())
      },
    )

    const result = await gateway.transition(
      characterId,
      4,
      'active',
      false,
    )

    assert.deepEqual(result, {
      characterId,
      status: 'active',
      revision: 5,
      validation: report(),
    })
    assert.equal(
      calls[0][0],
      `/api/characters/${characterId}/lifecycle`,
    )
    assert.equal(calls[0][1].method, 'PATCH')
    assert.equal(
      calls[0][1].credentials,
      'include',
    )
    assert.deepEqual(
      JSON.parse(calls[0][1].body),
      {
        expectedRevision: 4,
        nextStatus: 'active',
        confirmed: false,
      },
    )
  },
)

test(
  '029-J admite archivado sin informe de activacion',
  async () => {
    const gateway = createCharacterLifecycleGateway(
      async () =>
        jsonResponse(
          responseBody({
            status: 'archived',
            revision: 8,
            validation: null,
          }),
        ),
    )

    assert.deepEqual(
      await gateway.transition(
        characterId,
        7,
        'archived',
        true,
      ),
      {
        characterId,
        status: 'archived',
        revision: 8,
        validation: null,
      },
    )
  },
)

test(
  '029-J conserva codigo estado e incidencias del rechazo',
  async () => {
    const issue = {
      code: 'CHARACTER_ACTIVATION_VALIDATION_REQUIRED',
    }
    const gateway = createCharacterLifecycleGateway(
      async () =>
        jsonResponse(
          {
            code:
              'CHARACTER_LIFECYCLE_TRANSITION_REJECTED',
            issues: [issue],
          },
          422,
        ),
    )

    await assert.rejects(
      gateway.transition(
        characterId,
        4,
        'active',
        false,
      ),
      (error) => {
        assert.ok(
          error instanceof CharacterLifecycleApiError,
        )
        assert.equal(error.status, 422)
        assert.equal(
          error.code,
          'CHARACTER_LIFECYCLE_TRANSITION_REJECTED',
        )
        assert.deepEqual(error.issues, [issue])
        return true
      },
    )
  },
)

test(
  '029-J rechaza estado revision o validacion invalidos',
  async () => {
    for (const body of [
      responseBody({ status: 'unknown' }),
      responseBody({ revision: 0 }),
      responseBody({ validation: { valid: true } }),
      { character: null, validation: null },
    ]) {
      const gateway =
        createCharacterLifecycleGateway(
          async () => jsonResponse(body),
        )

      await assert.rejects(
        gateway.transition(
          characterId,
          4,
          'active',
          false,
        ),
        {
          name: 'CharacterLifecycleApiError',
          status: 502,
          code:
            'INVALID_CHARACTER_LIFECYCLE_RESPONSE',
        },
      )
    }
  },
)

test(
  '029-J codifica la identidad del personaje en la ruta',
  async () => {
    let url = ''
    const gateway = createCharacterLifecycleGateway(
      async (input) => {
        url = String(input)
        return jsonResponse(responseBody())
      },
    )

    await gateway.transition(
      'personaje/con espacios',
      4,
      'active',
      false,
    )

    assert.equal(
      url,
      '/api/characters/personaje%2Fcon%20espacios/lifecycle',
    )
  },
)
