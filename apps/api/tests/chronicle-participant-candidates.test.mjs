import assert from 'node:assert/strict'
import test from 'node:test'

import {
  ListChronicleParticipantCandidatesUseCase,
} from '../dist/chronicles/application/list-chronicle-participant-candidates.use-case.js'

import {
  ChronicleParticipantPermissionError,
} from '../dist/chronicles/application/list-chronicle-participants.use-case.js'

function participantRepository(
  membership,
  existing = [],
) {
  return {
    async findActiveMembership() {
      return membership
    },
    async listByChronicleId() {
      return existing
    },
  }
}

const users = {
  async list() {
    return [
      {
        id: 'u1',
        username: 'uno',
        displayName: 'Uno',
      },
      {
        id: 'u2',
        username: 'dos',
        displayName: 'Dos',
      },
    ]
  },
}

test(
  '031-D sólo Narrador contextual activo consulta candidatos',
  async () => {
    await assert.rejects(
      new ListChronicleParticipantCandidatesUseCase(
        participantRepository({
          role: 'player',
          status: 'active',
        }),
        users,
      ).execute(
        'requester',
        'chronicle',
      ),
      ChronicleParticipantPermissionError,
    )
  },
)

test(
  '031-D candidatos excluyen cualquier relación ya existente',
  async () => {
    const result =
      await new ListChronicleParticipantCandidatesUseCase(
        participantRepository(
          {
            role: 'narrator',
            status: 'active',
          },
          [
            {
              userId: 'u1',
              status: 'retired',
            },
          ],
        ),
        users,
      ).execute(
        'requester',
        'chronicle',
      )

    assert.deepEqual(
      result,
      [
        {
          id: 'u2',
          username: 'dos',
          displayName: 'Dos',
        },
      ],
    )
  },
)
