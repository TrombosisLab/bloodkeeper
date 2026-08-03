import assert from 'node:assert/strict'
import test from 'node:test'
import 'reflect-metadata'

import {
  RequestMethod,
} from '@nestjs/common'

import {
  CharacterValidationController,
} from '../dist/characters/presentation/character-validation.controller.js'

const ownerId =
  '3bbc46f8-a45f-4589-9872-129e6652082c'
const characterId =
  '39c1801e-68fe-4c92-8795-723cac284bdf'

function report() {
  return {
    context: 'activation',
    valid: false,
    canProceed: false,
    sections: [],
    issues: [],
  }
}

function controller(result = report()) {
  const calls = []
  return {
    calls,
    instance: new CharacterValidationController({
      async execute(owner, id, context) {
        calls.push([owner, id, context])
        return result
      },
    }),
  }
}

function hasStatus(status) {
  return (error) => {
    assert.equal(error.getStatus(), status)
    return true
  }
}

test(
  '029-D publica una ruta GET de validacion sin mutaciones',
  () => {
    assert.equal(
      Reflect.getMetadata(
        'path',
        CharacterValidationController,
      ),
      'characters',
    )
    const handler =
      CharacterValidationController.prototype.validate

    assert.equal(
      Reflect.getMetadata('path', handler),
      ':characterId/validation',
    )
    assert.equal(
      Reflect.getMetadata('method', handler),
      RequestMethod.GET,
    )
  },
)

test(
  '029-D exige autenticacion y entradas validas',
  async () => {
    const { instance, calls } = controller()

    await assert.rejects(
      instance.validate(
        {},
        characterId,
        'activation',
      ),
      hasStatus(401),
    )
    await assert.rejects(
      instance.validate(
        { user: { id: ownerId } },
        'not-a-uuid',
        'activation',
      ),
      hasStatus(400),
    )
    await assert.rejects(
      instance.validate(
        { user: { id: ownerId } },
        characterId,
        'unknown',
      ),
      hasStatus(400),
    )
    assert.deepEqual(calls, [])
  },
)

test(
  '029-D consulta con propietario personaje y contexto separados',
  async () => {
    const { instance, calls } = controller()

    assert.deepEqual(
      await instance.validate(
        { user: { id: ownerId } },
        characterId,
        'activation',
      ),
      report(),
    )
    assert.deepEqual(calls, [
      [ownerId, characterId, 'activation'],
    ])
  },
)

test(
  '029-D no distingue entre personaje ausente y ajeno',
  async () => {
    const { instance } = controller(null)

    await assert.rejects(
      instance.validate(
        { user: { id: ownerId } },
        characterId,
        'play',
      ),
      hasStatus(404),
    )
  },
)
