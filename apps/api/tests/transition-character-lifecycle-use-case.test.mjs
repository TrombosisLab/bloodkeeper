import assert from 'node:assert/strict'
import test from 'node:test'

import {
  TransitionCharacterLifecycleUseCase,
} from '../dist/characters/application/transition-character-lifecycle.use-case.js'

function validationReport(valid = true) {
  return {
    context: 'activation',
    valid,
    canProceed: valid,
    issues: valid
      ? []
      : [
          {
            code: 'CHARACTER_SECTION_PENDING',
            severity: 'error',
            section: 'disciplines',
            message: 'La seccion sigue pendiente.',
          },
        ],
    sections: [],
  }
}

function setup({
  character = {
    characterId: 'character-029-f',
    status: 'draft',
    revision: 4,
  },
  report = validationReport(),
} = {}) {
  const calls = []
  const repository = {
    async findById(ownerId, characterId) {
      calls.push(['findById', ownerId, characterId])
      return character
    },
    async transitionLifecycle(ownerId, data) {
      calls.push([
        'transitionLifecycle',
        ownerId,
        data,
      ])
      return {
        ...character,
        status: data.nextStatus,
        revision: data.expectedRevision + 1,
      }
    },
  }
  const validator = {
    validate(value, context) {
      calls.push(['validate', value, context])
      return report
    },
  }

  return {
    calls,
    useCase:
      new TransitionCharacterLifecycleUseCase(
        repository,
        validator,
      ),
  }
}

test(
  '029-F activa un borrador solo con validacion global completa',
  async () => {
    const { calls, useCase } = setup()

    const result = await useCase.execute(
      'owner-029-f',
      {
        characterId: 'character-029-f',
        expectedRevision: 4,
        nextStatus: 'active',
        confirmed: false,
      },
    )

    assert.equal(result?.character.status, 'active')
    assert.equal(result?.character.revision, 5)
    assert.equal(result?.validation?.context, 'activation')
    assert.deepEqual(calls[1], [
      'validate',
      {
        characterId: 'character-029-f',
        status: 'draft',
        revision: 4,
      },
      'activation',
    ])
    assert.deepEqual(calls[2], [
      'transitionLifecycle',
      'owner-029-f',
      {
        characterId: 'character-029-f',
        expectedRevision: 4,
        expectedStatus: 'draft',
        nextStatus: 'active',
      },
    ])
  },
)

test(
  '029-F rechaza activacion incompleta sin escribir',
  async () => {
    const { calls, useCase } = setup({
      report: validationReport(false),
    })

    await assert.rejects(
      useCase.execute('owner-029-f', {
        characterId: 'character-029-f',
        expectedRevision: 4,
        nextStatus: 'active',
        confirmed: false,
      }),
      {
        name:
          'InvalidCharacterLifecycleTransitionError',
      },
    )

    assert.equal(
      calls.some(
        ([name]) =>
          name === 'transitionLifecycle',
      ),
      false,
    )
  },
)

test(
  '029-F exige confirmacion explicita para archivar',
  async () => {
    const activeCharacter = {
      characterId: 'character-029-f',
      status: 'active',
      revision: 8,
    }
    const blocked = setup({
      character: activeCharacter,
    })

    await assert.rejects(
      blocked.useCase.execute('owner-029-f', {
        characterId: 'character-029-f',
        expectedRevision: 8,
        nextStatus: 'archived',
        confirmed: false,
      }),
      {
        name:
          'InvalidCharacterLifecycleTransitionError',
      },
    )

    const allowed = setup({
      character: activeCharacter,
    })
    const result = await allowed.useCase.execute(
      'owner-029-f',
      {
        characterId: 'character-029-f',
        expectedRevision: 8,
        nextStatus: 'archived',
        confirmed: true,
      },
    )

    assert.equal(
      result?.character.status,
      'archived',
    )
    assert.equal(result?.validation, null)
    assert.equal(
      allowed.calls.some(
        ([name]) => name === 'validate',
      ),
      false,
    )
  },
)

test(
  '029-F revalida al reactivar un personaje archivado',
  async () => {
    const { calls, useCase } = setup({
      character: {
        characterId: 'character-029-f',
        status: 'archived',
        revision: 10,
      },
    })

    const result = await useCase.execute(
      'owner-029-f',
      {
        characterId: 'character-029-f',
        expectedRevision: 10,
        nextStatus: 'active',
        confirmed: false,
      },
    )

    assert.equal(result?.character.status, 'active')
    assert.equal(
      calls.some(
        ([name, , context]) =>
          name === 'validate' &&
          context === 'activation',
      ),
      true,
    )
  },
)

test(
  '029-F protege propietario y revision antes de validar',
  async () => {
    const missing = setup({ character: null })

    assert.equal(
      await missing.useCase.execute(
        'foreign-owner',
        {
          characterId: 'character-029-f',
          expectedRevision: 4,
          nextStatus: 'active',
          confirmed: false,
        },
      ),
      null,
    )
    assert.deepEqual(missing.calls, [
      [
        'findById',
        'foreign-owner',
        'character-029-f',
      ],
    ])

    const stale = setup()

    await assert.rejects(
      stale.useCase.execute('owner-029-f', {
        characterId: 'character-029-f',
        expectedRevision: 3,
        nextStatus: 'active',
        confirmed: false,
      }),
      {
        name:
          'CharacterLifecycleWriteConflictError',
      },
    )
    assert.deepEqual(stale.calls, [
      [
        'findById',
        'owner-029-f',
        'character-029-f',
      ],
    ])
  },
)
