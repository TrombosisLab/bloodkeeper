import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CharacterStateWriteConflictError,
} from '../dist/characters/application/character-draft.repository.js'

import {
  UpdateCharacterStateUseCase,
} from '../dist/characters/application/update-character-state.use-case.js'

function character(overrides = {}) {
  return {
    characterId: 'character-024-b1',
    status: 'active',
    revision: 4,
    attributes: {
      stamina: 3,
      composure: 2,
      resolve: 3,
    },
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
    ...overrides,
  }
}

function setup(current = character()) {
  const calls = []
  const repository = {
    async findById(ownerId, characterId) {
      calls.push([
        'findById',
        ownerId,
        characterId,
      ])
      return current
    },

    async updateState(ownerId, data) {
      calls.push([
        'updateState',
        ownerId,
        data,
      ])
      return {
        ...current,
        revision:
          data.expectedRevision + 1,
        damage:
          data.damage ?? current.damage,
        humanity: {
          ...current.humanity,
          ...(data.humanityValue === undefined
            ? {}
            : {
                value:
                  data.humanityValue,
              }),
          ...(data.humanityStains === undefined
            ? {}
            : {
                stains:
                  data.humanityStains,
              }),
        },
      }
    },
  }

  return {
    calls,
    useCase:
      new UpdateCharacterStateUseCase(
        repository,
      ),
  }
}

test(
  'SPEC-024 permite editar estados de personaje activo',
  async () => {
    const { calls, useCase } = setup()

    const result = await useCase.execute(
      'owner-024',
      {
        characterId: 'character-024-b1',
        expectedRevision: 4,
        damage: {
          health: {
            superficial: 2,
            aggravated: 0,
          },
          willpower: {
            superficial: 0,
            aggravated: 1,
          },
        },
        humanityStains: 2,
      },
    )

    assert.equal(result?.revision, 5)
    assert.equal(
      result?.damage.health.superficial,
      2,
    )
    assert.equal(
      result?.humanity.stains,
      2,
    )
    assert.equal(calls[1][0], 'updateState')
  },
)

test(
  'SPEC-024 conserva también el uso durante draft',
  async () => {
    const { useCase } =
      setup(character({ status: 'draft' }))

    const result = await useCase.execute(
      'owner-024',
      {
        characterId: 'character-024-b1',
        expectedRevision: 4,
        humanityValue: 6,
      },
    )

    assert.equal(result?.humanity.value, 6)
  },
)

test(
  'SPEC-024 bloquea personajes archivados antes de escribir',
  async () => {
    const { calls, useCase } =
      setup(character({ status: 'archived' }))

    await assert.rejects(
      useCase.execute(
        'owner-024',
        {
          characterId:
            'character-024-b1',
          expectedRevision: 4,
          humanityValue: 6,
        },
      ),
      {
        name:
          'InvalidCharacterStateUpdateError',
        violations: [
          'CHARACTER_STATE_NOT_EDITABLE',
        ],
      },
    )

    assert.equal(calls.length, 1)
  },
)

test(
  'SPEC-024 protege revisión antes de validar/escribir',
  async () => {
    const { calls, useCase } = setup()

    await assert.rejects(
      useCase.execute(
        'owner-024',
        {
          characterId:
            'character-024-b1',
          expectedRevision: 3,
          humanityValue: 6,
        },
      ),
      CharacterStateWriteConflictError,
    )

    assert.equal(calls.length, 1)
  },
)

test(
  'SPEC-024 rechaza daño y Humanidad imposibles sin persistir',
  async () => {
    const damage = setup()

    await assert.rejects(
      damage.useCase.execute(
        'owner-024',
        {
          characterId:
            'character-024-b1',
          expectedRevision: 4,
          damage: {
            health: {
              superficial: 7,
              aggravated: 0,
            },
            willpower: {
              superficial: 0,
              aggravated: 0,
            },
          },
        },
      ),
      {
        name:
          'InvalidCharacterDamageStateError',
      },
    )

    assert.equal(damage.calls.length, 1)

    const humanity = setup()

    await assert.rejects(
      humanity.useCase.execute(
        'owner-024',
        {
          characterId:
            'character-024-b1',
          expectedRevision: 4,
          humanityStains: 4,
        },
      ),
      {
        name:
          'InvalidCharacterHumanityStateError',
      },
    )

    assert.equal(humanity.calls.length, 1)
  },
)
