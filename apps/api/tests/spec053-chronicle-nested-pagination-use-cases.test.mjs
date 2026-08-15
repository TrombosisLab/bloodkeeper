import assert from 'node:assert/strict'
import test from 'node:test'

import {
  ListChronicleCharactersUseCase,
} from '../dist/characters/application/list-chronicle-characters.use-case.js'

import {
  ListChronicleParticipantsUseCase,
} from '../dist/chronicles/application/list-chronicle-participants.use-case.js'

const query = {
  limit: 25,
  offset: 50,
}

test(
  'SPEC-053-C2 Characters reenvía query y conserva OffsetPage',
  async () => {
    let receivedQuery = null

    const characters = {
      async listByChronicle(
        _chronicleId,
        forwarded,
      ) {
        receivedQuery = forwarded

        return {
          items: [
            {
              characterId: 'character-1',
              ownerId: 'owner-1',
              chronicleId: 'chronicle-1',
              status: 'active',
              identity: {
                name: 'Alicia',
                concept: null,
              },
              updatedAt:
                new Date(
                  '2026-08-14T10:00:00Z',
                ),
            },
          ],
          nextOffset: 75,
        }
      },
    }

    const participants = {
      async findActiveMembership() {
        return {
          role: 'player',
          status: 'active',
        }
      },
    }

    const result =
      await new ListChronicleCharactersUseCase(
        characters,
        participants,
      ).execute(
        'user-1',
        'chronicle-1',
        query,
      )

    assert.deepEqual(
      receivedQuery,
      query,
    )
    assert.equal(
      result.nextOffset,
      75,
    )
    assert.equal(
      result.items[0].name,
      'Alicia',
    )
  },
)

test(
  'SPEC-053-C2 Participants reenvía query y conserva OffsetPage',
  async () => {
    let receivedQuery = null

    const participant = {
      id: 'participant-1',
      chronicleId: 'chronicle-1',
      userId: 'user-1',
      username: 'uno',
      displayName: 'Uno',
      role: 'player',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const repository = {
      async findActiveMembership() {
        return participant
      },

      async listByChronicleId(
        _chronicleId,
        forwarded,
      ) {
        receivedQuery = forwarded

        return {
          items: [participant],
          nextOffset: 75,
        }
      },
    }

    const result =
      await new ListChronicleParticipantsUseCase(
        repository,
      ).execute(
        'user-1',
        'chronicle-1',
        query,
      )

    assert.deepEqual(
      receivedQuery,
      query,
    )
    assert.equal(
      result.nextOffset,
      75,
    )
    assert.equal(
      result.items[0].id,
      'participant-1',
    )
  },
)
