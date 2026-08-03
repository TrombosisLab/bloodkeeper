import assert from 'node:assert/strict'
import test from 'node:test'
import 'reflect-metadata'

import {
  RequestMethod,
} from '@nestjs/common'

import {
  CharacterSecondaryWriteConflictError,
} from '../dist/characters/application/character-secondary.repository.js'

import {
  InvalidCharacterSecondaryDataError,
} from '../dist/characters/domain/character-secondary.rules.js'

import {
  CharacterSecondaryController,
} from '../dist/characters/presentation/character-secondary.controller.js'

const ownerId =
  '3bbc46f8-a45f-4589-9872-129e6652082c'
const characterId =
  '39c1801e-68fe-4c92-8795-723cac284bdf'

function secondary() {
  return {
    characterId,
    revision: 2,
    inventory: [],
    notes: [],
    history: [],
  }
}

function controller(overrides = {}) {
  const calls = []
  const loadSecondary = {
    async execute(owner, id) {
      calls.push(['load', owner, id])
      return secondary()
    },
  }
  const updateSecondary = {
    async execute(owner, command) {
      calls.push(['update', owner, command])
      return secondary()
    },
  }

  return {
    calls,
    instance: new CharacterSecondaryController(
      overrides.loadSecondary ?? loadSecondary,
      overrides.updateSecondary ??
        updateSecondary,
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
  '028-E publica GET y PATCH para datos secundarios',
  () => {
    assert.equal(
      Reflect.getMetadata(
        'path',
        CharacterSecondaryController,
      ),
      'characters',
    )

    const routes = [
      [
        'load',
        ':characterId/secondary',
        RequestMethod.GET,
      ],
      [
        'update',
        ':characterId/secondary',
        RequestMethod.PATCH,
      ],
    ]

    for (const [method, path, requestMethod] of routes) {
      const handler =
        CharacterSecondaryController.prototype[
          method
        ]

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
  '028-E exige propietario autenticado',
  async () => {
    const { instance, calls } = controller()

    await assert.rejects(
      instance.load({}, characterId),
      hasStatus(401),
    )
    assert.deepEqual(calls, [])
  },
)

test(
  '028-E carga sin revelar personajes ausentes o ajenos',
  async () => {
    const { instance, calls } = controller()

    assert.deepEqual(
      await instance.load(
        authenticatedRequest(),
        characterId,
      ),
      secondary(),
    )
    assert.deepEqual(calls, [
      ['load', ownerId, characterId],
    ])

    const missing = controller({
      loadSecondary: {
        async execute() {
          return null
        },
      },
    })
    await assert.rejects(
      missing.instance.load(
        authenticatedRequest(),
        characterId,
      ),
      hasStatus(404),
    )
  },
)

test(
  '028-E actualiza una seccion con propietario y revision',
  async () => {
    const { instance, calls } = controller()

    await instance.update(
      authenticatedRequest(),
      characterId,
      {
        expectedRevision: 1,
        section: 'notes',
        notes: [],
      },
    )

    assert.deepEqual(calls, [
      [
        'update',
        ownerId,
        {
          characterId,
          expectedRevision: 1,
          section: 'notes',
          notes: [],
        },
      ],
    ])
  },
)

test(
  '028-E traduce entrada invalida a 400',
  async () => {
    const { instance, calls } = controller()

    await assert.rejects(
      instance.update(
        authenticatedRequest(),
        characterId,
        {
          expectedRevision: 1,
          section: 'notes',
          notes: [],
          history: [],
        },
      ),
      hasStatus(400),
    )
    assert.deepEqual(calls, [])
  },
)

test(
  '028-E traduce conflicto de revision a 409',
  async () => {
    const { instance } = controller({
      updateSecondary: {
        async execute() {
          throw new CharacterSecondaryWriteConflictError(
            characterId,
          )
        },
      },
    })

    await assert.rejects(
      instance.update(
        authenticatedRequest(),
        characterId,
        {
          expectedRevision: 1,
          section: 'notes',
          notes: [],
        },
      ),
      hasStatus(409),
    )
  },
)

test(
  '028-E traduce infracciones de dominio a 422',
  async () => {
    const { instance } = controller({
      updateSecondary: {
        async execute() {
          throw new InvalidCharacterSecondaryDataError(
            ['NOTE_CONTENT_REQUIRED'],
          )
        },
      },
    })

    await assert.rejects(
      instance.update(
        authenticatedRequest(),
        characterId,
        {
          expectedRevision: 1,
          section: 'notes',
          notes: [],
        },
      ),
      hasStatus(422),
    )
  },
)
