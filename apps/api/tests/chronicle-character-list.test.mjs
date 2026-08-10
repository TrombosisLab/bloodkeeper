import assert from 'node:assert/strict'
import test from 'node:test'

import {
  ChronicleCharacterListPermissionError,
  ListChronicleCharactersUseCase,
} from '../dist/characters/application/list-chronicle-characters.use-case.js'

function participants(
  membership,
) {
  return {
    async findActiveMembership() {
      return membership
    },
  }
}

function characters() {
  return {
    async listByChronicle() {
      return [
        {
          characterId: 'character-1',
          ownerId: 'owner-1',
          chronicleId: 'chronicle-1',
          status: 'active',
          revision: 2,
          createdAt:
            new Date(
              '2026-08-01T00:00:00Z',
            ),
          updatedAt:
            new Date(
              '2026-08-02T00:00:00Z',
            ),
          identity: {
            name: 'Alicia',
            concept:
              'Investigadora',
          },
        },
      ]
    },
  }
}

test(
  '031-D participante activo recibe sólo resumen de personajes asociados',
  async () => {
    const result =
      await new ListChronicleCharactersUseCase(
        characters(),
        participants({
          role: 'player',
          status: 'active',
        }),
      ).execute(
        'owner-1',
        'chronicle-1',
      )

    assert.deepEqual(
      result,
      [
        {
          characterId:
            'character-1',
          ownerId: 'owner-1',
          chronicleId:
            'chronicle-1',
          status: 'active',
          name: 'Alicia',
          concept:
            'Investigadora',
          updatedAt:
            new Date(
              '2026-08-02T00:00:00Z',
            ),
        },
      ],
    )
  },
)

test(
  '031-D outsider no puede listar personajes asociados',
  async () => {
    await assert.rejects(
      new ListChronicleCharactersUseCase(
        characters(),
        participants(null),
      ).execute(
        'outsider',
        'chronicle-1',
      ),
      ChronicleCharacterListPermissionError,
    )
  },
)
