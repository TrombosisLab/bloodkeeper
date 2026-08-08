import assert from 'node:assert/strict'
import test from 'node:test'
import 'reflect-metadata'

import {
  RequestMethod,
} from '@nestjs/common'

import {
  CharacterStateWriteConflictError,
} from '../dist/characters/application/character-draft.repository.js'

import {
  InvalidCharacterDamageStateError,
} from '../dist/characters/domain/character-damage.rules.js'

import {
  CharacterStateController,
} from '../dist/characters/presentation/character-state.controller.js'

const ownerId =
  '3bbc46f8-a45f-4589-9872-129e6652082c'
const characterId =
  '39c1801e-68fe-4c92-8795-723cac284bdf'

function persisted() {
  return {
    characterId,
    revision: 2,
    status: 'active',
    damage: {
      health: {
        superficial: 1,
        aggravated: 0,
      },
      willpower: {
        superficial: 0,
        aggravated: 1,
      },
    },
    humanity: {
      value: 7,
      stains: 1,
    },
  }
}

function hasStatus(status) {
  return (error) => {
    assert.equal(error.getStatus(), status)
    return true
  }
}

test(
  'SPEC-024 publica PATCH de estado separado del draft',
  () => {
    assert.equal(
      Reflect.getMetadata(
        'path',
        CharacterStateController,
      ),
      'characters',
    )

    const handler =
      CharacterStateController.prototype.update

    assert.equal(
      Reflect.getMetadata('path', handler),
      ':characterId/state',
    )
    assert.equal(
      Reflect.getMetadata('method', handler),
      RequestMethod.PATCH,
    )
  },
)

test(
  'SPEC-024 exige propietario autenticado',
  async () => {
    const controller =
      new CharacterStateController({
        async execute() {
          throw new Error('unexpected')
        },
      })

    await assert.rejects(
      controller.update(
        {},
        characterId,
        {
          expectedRevision: 1,
          humanityValue: 6,
        },
      ),
      hasStatus(401),
    )
  },
)

test(
  'SPEC-024 entrega propietario y comando al caso de uso',
  async () => {
    const calls = []
    const controller =
      new CharacterStateController({
        async execute(owner, command) {
          calls.push([owner, command])
          return persisted()
        },
      })

    const response =
      await controller.update(
        { user: { id: ownerId } },
        characterId,
        {
          expectedRevision: 1,
          humanityStains: 2,
        },
      )

    assert.equal(response.characterId, characterId)
    assert.deepEqual(calls, [
      [
        ownerId,
        {
          characterId,
          expectedRevision: 1,
          humanityStains: 2,
        },
      ],
    ])
  },
)

test(
  'SPEC-024 traduce petición inválida y ausencia',
  async () => {
    const controller =
      new CharacterStateController({
        async execute() {
          return null
        },
      })

    await assert.rejects(
      controller.update(
        { user: { id: ownerId } },
        characterId,
        {
          expectedRevision: 1,
          hunger: 2,
        },
      ),
      hasStatus(400),
    )

    await assert.rejects(
      controller.update(
        { user: { id: ownerId } },
        characterId,
        {
          expectedRevision: 1,
          humanityValue: 6,
        },
      ),
      hasStatus(404),
    )
  },
)

test(
  'SPEC-024 traduce conflicto a 409 y reglas a 422',
  async () => {
    const conflict =
      new CharacterStateController({
        async execute() {
          throw new CharacterStateWriteConflictError(
            characterId,
          )
        },
      })

    await assert.rejects(
      conflict.update(
        { user: { id: ownerId } },
        characterId,
        {
          expectedRevision: 1,
          humanityValue: 6,
        },
      ),
      hasStatus(409),
    )

    const invalid =
      new CharacterStateController({
        async execute() {
          throw new InvalidCharacterDamageStateError([
            'HEALTH_DAMAGE_EXCEEDS_CAPACITY',
          ])
        },
      })

    await assert.rejects(
      invalid.update(
        { user: { id: ownerId } },
        characterId,
        {
          expectedRevision: 1,
          humanityValue: 6,
        },
      ),
      hasStatus(422),
    )
  },
)
