import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CharacterProfilePhaseUnavailableError,
} from '../dist/characters/application/load-character-profile-phase.use-case.js'

import {
  CharacterProfilePhaseController,
} from '../dist/characters/presentation/character-profile-phase.controller.js'

const ownerId =
  '22222222-2222-4222-8222-222222222222'
const characterId =
  '11111111-1111-4111-8111-111111111111'

function request() {
  return {
    user: {
      id: ownerId,
    },
  }
}

test(
  '057-F2A1 controller expone la fase derivada',
  async () => {
    const controller =
      new CharacterProfilePhaseController({
        async read(
          receivedOwnerId,
          receivedCharacterId,
        ) {
          assert.equal(
            receivedOwnerId,
            ownerId,
          )
          assert.equal(
            receivedCharacterId,
            characterId,
          )
          return {
            phase:
              'TRANSITIONAL_VAMPIRE',
            pendingDecisions: [
              'clan',
              'generation',
              'sire',
            ],
          }
        },
      })

    assert.deepEqual(
      await controller.load(
        request(),
        characterId,
      ),
      {
        phase:
          'TRANSITIONAL_VAMPIRE',
        pendingDecisions: [
          'clan',
          'generation',
          'sire',
        ],
      },
    )
  },
)

test(
  '057-F2A1 controller conserva 404 cuando el personaje no existe',
  async () => {
    const controller =
      new CharacterProfilePhaseController({
        async read() {
          return null
        },
      })

    await assert.rejects(
      controller.load(
        request(),
        characterId,
      ),
      (error) =>
        error?.status === 404,
    )
  },
)

test(
  '057-F2A1 controller representa estándar inválido como 422',
  async () => {
    const controller =
      new CharacterProfilePhaseController({
        async read() {
          throw new CharacterProfilePhaseUnavailableError(
            characterId,
          )
        },
      })

    await assert.rejects(
      controller.load(
        request(),
        characterId,
      ),
      (error) =>
        error?.status === 422,
    )
  },
)

test(
  '057-F2A1 controller exige sesión autenticada',
  async () => {
    const controller =
      new CharacterProfilePhaseController({
        async read() {
          throw new Error('unexpected')
        },
      })

    await assert.rejects(
      controller.load(
        {},
        characterId,
      ),
      (error) =>
        error?.status === 401,
    )
  },
)
