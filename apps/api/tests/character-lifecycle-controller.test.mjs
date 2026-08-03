import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import test from 'node:test'

import {
  CharacterLifecycleController,
} from '../dist/characters/presentation/character-lifecycle.controller.js'

import {
  CharacterLifecycleWriteConflictError,
} from '../dist/characters/application/character-draft.repository.js'

import {
  InvalidCharacterLifecycleTransitionError,
} from '../dist/characters/domain/character-lifecycle.rules.js'

function hasStatus(status) {
  return (error) => {
    assert.equal(error.getStatus(), status)
    return true
  }
}

test(
  '029-G publica una transicion HTTP explicita',
  () => {
    const path = new URL(
      '../src/characters/presentation/character-lifecycle.controller.ts',
      import.meta.url,
    )

    return import('node:fs/promises').then(
      async ({ readFile }) => {
        const source = await readFile(path, 'utf8')

        assert.match(source, /@Controller\('characters'\)/)
        assert.match(
          source,
          /@Patch\(':characterId\/lifecycle'\)/,
        )
      },
    )
  },
)

test(
  '029-G exige autenticacion y una peticion valida',
  async () => {
    const controller =
      new CharacterLifecycleController({
        execute: async () => null,
      })

    await assert.rejects(
      controller.transition(
        {},
        randomUUID(),
        {
          expectedRevision: 1,
          nextStatus: 'active',
          confirmed: false,
        },
      ),
      hasStatus(401),
    )

    await assert.rejects(
      controller.transition(
        { user: { id: randomUUID() } },
        'invalid-id',
        {},
      ),
      hasStatus(400),
    )
  },
)

test(
  '029-G separa propietario identificador y comando',
  async () => {
    const ownerId = randomUUID()
    const characterId = randomUUID()
    const calls = []
    const controller =
      new CharacterLifecycleController({
        async execute(...args) {
          calls.push(args)
          return null
        },
      })

    await assert.rejects(
      controller.transition(
        { user: { id: ownerId } },
        characterId,
        {
          expectedRevision: 3,
          nextStatus: 'archived',
          confirmed: true,
        },
      ),
      hasStatus(404),
    )

    assert.deepEqual(calls, [
      [
        ownerId,
        {
          characterId,
          expectedRevision: 3,
          nextStatus: 'archived',
          confirmed: true,
        },
      ],
    ])
  },
)

test(
  '029-G traduce conflictos concurrentes',
  async () => {
    const characterId = randomUUID()
    const controller =
      new CharacterLifecycleController({
        async execute() {
          throw new CharacterLifecycleWriteConflictError(
            characterId,
          )
        },
      })

    await assert.rejects(
      controller.transition(
        { user: { id: randomUUID() } },
        characterId,
        {
          expectedRevision: 2,
          nextStatus: 'active',
          confirmed: false,
        },
      ),
      hasStatus(409),
    )
  },
)

test(
  '029-G expone los motivos de una transicion rechazada',
  async () => {
    const issue = {
      code: 'CHARACTER_ACTIVATION_VALIDATION_REQUIRED',
      severity: 'error',
      section: 'lifecycle',
      field: 'status',
      message: 'El personaje no puede activarse.',
      details: undefined,
    }
    const controller =
      new CharacterLifecycleController({
        async execute() {
          throw new InvalidCharacterLifecycleTransitionError(
            [issue],
          )
        },
      })

    await assert.rejects(
      controller.transition(
        { user: { id: randomUUID() } },
        randomUUID(),
        {
          expectedRevision: 1,
          nextStatus: 'active',
          confirmed: false,
        },
      ),
      (error) => {
        assert.equal(error.getStatus(), 422)
        assert.deepEqual(
          error.getResponse().issues,
          [issue],
        )
        return true
      },
    )
  },
)
