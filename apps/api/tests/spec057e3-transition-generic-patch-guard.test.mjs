import assert from 'node:assert/strict'
import test from 'node:test'

import {
  SessionZeroVampireInitialStateMutationError,
  UpdateCharacterDraftUseCase,
} from '../dist/characters/application/update-character-draft.use-case.js'

const ownerId =
  '11111111-1111-4111-8111-111111111111'

const characterId =
  '22222222-2222-4222-8222-222222222222'

function advantages() {
  return {
    selections: [
      {
        selectionId: 'replacement',
        definitionKey: 'resources',
        category: 'background',
        rating: 1,
        origin: 'creation',
        parentSelectionId: null,
        details: {
          kind: 'resources',
          source: 'Test',
        },
      },
    ],
  }
}

function repositoryFor(
  creationMode,
) {
  const calls = []

  return {
    calls,
    repository: {
      async findById(
        receivedOwnerId,
        receivedCharacterId,
      ) {
        calls.push([
          'findById',
          receivedOwnerId,
          receivedCharacterId,
        ])

        return {
          characterId,
          ownerId,
          revision: 4,
          nature: 'vampire',
          chronicleId: null,
          creation: {
            creationMode,
          },
        }
      },

      async update(
        receivedOwnerId,
        data,
      ) {
        calls.push([
          'update',
          receivedOwnerId,
          data,
        ])

        return {
          characterId,
          ownerId,
          revision:
            data.expectedRevision + 1,
          nature: 'vampire',
          chronicleId: null,
          creation: {
            creationMode,
          },
          advantages:
            data.advantages,
        }
      },
    },
  }
}

test(
  '057-E3 transición bloquea advantages en PATCH genérico para SESSION_ZERO',
  async () => {
    const {
      repository,
      calls,
    } = repositoryFor(
      'sessionZero',
    )

    const useCase =
      new UpdateCharacterDraftUseCase(
        repository,
      )

    await assert.rejects(
      useCase.execute(
        ownerId,
        {
          characterId,
          expectedRevision: 4,
          advantages: advantages(),
        },
      ),
      SessionZeroVampireInitialStateMutationError,
    )

    assert.deepEqual(
      calls,
      [
        [
          'findById',
          ownerId,
          characterId,
        ],
      ],
    )
  },
)

test(
  '057-E3 PATCH genérico de advantages sigue permitido en vampiro STANDARD',
  async () => {
    const {
      repository,
      calls,
    } = repositoryFor(
      'standard',
    )

    const useCase =
      new UpdateCharacterDraftUseCase(
        repository,
      )

    const payload = {
      characterId,
      expectedRevision: 4,
      advantages: advantages(),
    }

    const result =
      await useCase.execute(
        ownerId,
        payload,
      )

    assert.equal(
      result.revision,
      5,
    )

    assert.deepEqual(
      calls,
      [
        [
          'findById',
          ownerId,
          characterId,
        ],
        [
          'update',
          ownerId,
          payload,
        ],
      ],
    )
  },
)
