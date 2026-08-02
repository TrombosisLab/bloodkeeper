import assert from 'node:assert/strict'
import test from 'node:test'
import 'reflect-metadata'

import {
  RequestMethod,
} from '@nestjs/common'

import {
  CharacterDraftWriteConflictError,
} from '../dist/characters/application/character-draft.repository.js'

import {
  CharacterDraftController,
} from '../dist/characters/presentation/character-draft.controller.js'

const ownerId =
  '3bbc46f8-a45f-4589-9872-129e6652082c'
const characterId =
  '39c1801e-68fe-4c92-8795-723cac284bdf'

function draft() {
  return {
    characterId,
    revision: 2,
    createdAt: new Date(
      '2026-08-02T18:00:00.000Z',
    ),
    updatedAt: new Date(
      '2026-08-02T19:00:00.000Z',
    ),
    creation: {
      currentStep: 'identity',
      skillDistributionMethod: 'balanced',
      updatedAt: new Date(
        '2026-08-02T19:00:00.000Z',
      ),
    },
  }
}

function controller(overrides = {}) {
  const calls = []
  const createDraft = {
    async execute(command) {
      calls.push(['create', command])
      return draft()
    },
  }
  const loadDraft = {
    async execute(owner, id) {
      calls.push(['load', owner, id])
      return draft()
    },
  }
  const updateDraft = {
    async execute(owner, command) {
      calls.push(['update', owner, command])
      return draft()
    },
  }

  return {
    calls,
    instance: new CharacterDraftController(
      overrides.createDraft ?? createDraft,
      overrides.loadDraft ?? loadDraft,
      overrides.updateDraft ?? updateDraft,
    ),
  }
}

function authenticatedRequest() {
  return { user: { id: ownerId } }
}

function hasStatus(status) {
  return (error) => {
    assert.equal(error.getStatus(), status)
    return true
  }
}

test(
  '004-D.3 publica el contrato minimo de rutas',
  () => {
    assert.equal(
      Reflect.getMetadata(
        'path',
        CharacterDraftController,
      ),
      'characters/drafts',
    )

    const routes = [
      ['create', '/', RequestMethod.POST],
      ['load', ':characterId', RequestMethod.GET],
      ['update', ':characterId', RequestMethod.PATCH],
    ]

    for (const [method, path, requestMethod] of routes) {
      const handler =
        CharacterDraftController.prototype[method]

      assert.equal(
        Reflect.getMetadata('path', handler),
        path,
      )
      assert.equal(
        Reflect.getMetadata('method', handler),
        requestMethod,
      )
    }
  },
)

test(
  '004-D.3 exige contexto autenticado',
  async () => {
    const { instance, calls } = controller()

    await assert.rejects(
      instance.load({}, characterId),
      hasStatus(401),
    )
    await assert.rejects(
      instance.load(
        { user: { id: 'not-a-uuid' } },
        characterId,
      ),
      hasStatus(401),
    )
    assert.deepEqual(calls, [])
  },
)

test(
  '004-D.3 convierte entradas invalidas en respuesta 400',
  async () => {
    const { instance, calls } = controller()

    await assert.rejects(
      instance.create(authenticatedRequest(), {}),
      hasStatus(400),
    )
    assert.deepEqual(calls, [])
  },
)

test(
  '004-D.3 carga y serializa solo para el propietario autenticado',
  async () => {
    const { instance, calls } = controller()

    const response = await instance.load(
      authenticatedRequest(),
      characterId,
    )

    assert.equal(
      response.updatedAt,
      '2026-08-02T19:00:00.000Z',
    )
    assert.deepEqual(calls, [
      ['load', ownerId, characterId],
    ])
  },
)

test(
  '004-D.3 no revela borradores ausentes o ajenos',
  async () => {
    const { instance } = controller({
      loadDraft: {
        async execute() {
          return null
        },
      },
    })

    await assert.rejects(
      instance.load(
        authenticatedRequest(),
        characterId,
      ),
      hasStatus(404),
    )
  },
)

test(
  '004-D.3 actualiza con revision y propietario separados',
  async () => {
    const { instance, calls } = controller()

    await instance.update(
      authenticatedRequest(),
      characterId,
      { expectedRevision: 1 },
    )

    assert.deepEqual(calls, [
      [
        'update',
        ownerId,
        {
          characterId,
          expectedRevision: 1,
        },
      ],
    ])
  },
)

test(
  '004-D.3 traduce conflictos sin revelar su causa',
  async () => {
    const { instance } = controller({
      updateDraft: {
        async execute() {
          throw new CharacterDraftWriteConflictError(
            characterId,
          )
        },
      },
    })

    await assert.rejects(
      instance.update(
        authenticatedRequest(),
        characterId,
        { expectedRevision: 1 },
      ),
      hasStatus(409),
    )
  },
)
