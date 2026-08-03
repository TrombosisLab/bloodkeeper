import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CharacterValidationApiError,
  createCharacterValidationGateway,
} from '../src/features/character-sheet/infrastructure/character-validation.api.ts'

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
  const issue = {
    code: 'CHARACTER_SECTION_PENDING',
    severity: 'error',
    section: 'disciplines',
    field: null,
    message: 'La seccion esta pendiente.',
    details: { required: true },
  }

  return {
    context: 'activation',
    valid: false,
    canProceed: false,
    sections: sections.map((section) => ({
      section,
      state:
        section === 'disciplines'
          ? 'pending'
          : 'complete',
      issues:
        section === 'disciplines'
          ? [issue]
          : [],
    })),
    issues: [issue],
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
  '029-H consulta la validacion usando la sesion del navegador',
  async () => {
    const calls = []
    const gateway =
      createCharacterValidationGateway(
        async (...parameters) => {
          calls.push(parameters)
          return jsonResponse(report())
        },
      )

    assert.deepEqual(
      await gateway.validate(
        characterId,
        'activation',
      ),
      report(),
    )
    assert.equal(
      calls[0][0],
      `/api/characters/${characterId}/validation?context=activation`,
    )
    assert.equal(
      calls[0][1].credentials,
      'include',
    )
    assert.equal(calls[0][1].method, undefined)
    assert.equal(
      calls[0][1].headers?.Authorization,
      undefined,
    )
  },
)

test(
  '029-H conserva secciones incidencias y detalles estructurados',
  async () => {
    const source = report()
    const gateway =
      createCharacterValidationGateway(
        async () => jsonResponse(source),
      )
    const loaded = await gateway.validate(
      characterId,
      'activation',
    )

    assert.equal(loaded.sections.length, 9)
    assert.deepEqual(
      loaded.issues[0]?.details,
      { required: true },
    )
    assert.notEqual(
      loaded.issues[0],
      source.issues[0],
    )
  },
)

test(
  '029-H preserva estado y codigo de errores HTTP',
  async () => {
    const gateway =
      createCharacterValidationGateway(
        async () =>
          jsonResponse(
            { code: 'CHARACTER_NOT_FOUND' },
            404,
          ),
      )

    await assert.rejects(
      gateway.validate(characterId, 'play'),
      (error) => {
        assert.ok(
          error instanceof CharacterValidationApiError,
        )
        assert.equal(error.status, 404)
        assert.equal(error.code, 'CHARACTER_NOT_FOUND')
        return true
      },
    )
  },
)

test(
  '029-H rechaza informes incompletos o incoherentes',
  async () => {
    for (const invalid of [
      { ...report(), context: 'unknown' },
      { ...report(), canProceed: 'yes' },
      { ...report(), sections: report().sections.slice(1) },
      {
        ...report(),
        sections: [
          ...report().sections.slice(0, 8),
          report().sections[0],
        ],
      },
    ]) {
      const gateway =
        createCharacterValidationGateway(
          async () => jsonResponse(invalid),
        )

      await assert.rejects(
        gateway.validate(
          characterId,
          'activation',
        ),
        {
          name: 'CharacterValidationApiError',
          status: 502,
          code:
            'INVALID_CHARACTER_VALIDATION_RESPONSE',
        },
      )
    }
  },
)

test(
  '029-H rechaza detalles no serializables por el contrato',
  async () => {
    const invalid = report()
    invalid.issues[0].details = {
      nested: { unsafe: true },
    }
    const gateway =
      createCharacterValidationGateway(
        async () => jsonResponse(invalid),
      )

    await assert.rejects(
      gateway.validate(
        characterId,
        'activation',
      ),
      {
        code:
          'INVALID_CHARACTER_VALIDATION_RESPONSE',
      },
    )
  },
)

test(
  '029-H codifica personaje y contexto en la ruta',
  async () => {
    let url = ''
    const gateway =
      createCharacterValidationGateway(
        async (input) => {
          url = String(input)
          return jsonResponse(report())
        },
      )

    await gateway.validate(
      'personaje/con espacios',
      'draftSave',
    )

    assert.equal(
      url,
      '/api/characters/personaje%2Fcon%20espacios/validation?context=draftSave',
    )
  },
)
