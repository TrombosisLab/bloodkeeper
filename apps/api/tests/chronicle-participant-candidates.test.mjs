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

function userDirectory(
  entries,
  queries = [],
) {
  return {
    async list(query) {
      if (query === undefined) {
        return entries
      }

      queries.push({
        ...query,
      })

      const rows =
        entries.slice(
          query.offset,
          query.offset +
            query.limit +
            1,
        )

      const items =
        rows.slice(
          0,
          query.limit,
        )

      return {
        items,
        nextOffset:
          rows.length >
          query.limit
            ? query.offset +
              query.limit
            : null,
      }
    },
  }
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
        userDirectory([]),
      ).execute(
        'requester',
        'chronicle',
        {
          limit: 25,
          offset: 0,
        },
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
        userDirectory([
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
        ]),
      ).execute(
        'requester',
        'chronicle',
        {
          limit: 25,
          offset: 0,
        },
      )

    assert.deepEqual(
      result,
      {
        items: [
          {
            id: 'u2',
            username: 'dos',
            displayName: 'Dos',
          },
        ],
        nextOffset: null,
      },
    )
  },
)

test(
  'SPEC-053 participant-candidates pagina en espacio de candidatos tras filtrar',
  async () => {
    const entries =
      Array.from(
        {
          length: 70,
        },
        (_, index) => {
          const number =
            String(
              index + 1,
            ).padStart(
              3,
              '0',
            )

          return {
            id: `u${number}`,
            username:
              `usuario-${number}`,
            displayName:
              `Usuario ${number}`,
          }
        },
      )

    const excluded =
      new Set([
        'u005',
        'u010',
        'u020',
        'u030',
        'u040',
        'u050',
      ])

    const queries = []

    const result =
      await new ListChronicleParticipantCandidatesUseCase(
        participantRepository(
          {
            role: 'narrator',
            status: 'active',
          },
          [...excluded].map(
            (userId) => ({
              userId,
              status: 'retired',
            }),
          ),
        ),
        userDirectory(
          entries,
          queries,
        ),
      ).execute(
        'requester',
        'chronicle',
        {
          limit: 5,
          offset: 48,
        },
      )

    const expectedCandidates =
      entries.filter(
        (entry) =>
          !excluded.has(entry.id),
      )

    assert.deepEqual(
      result.items.map(
        (entry) => entry.id,
      ),
      expectedCandidates
        .slice(
          48,
          53,
        )
        .map(
          (entry) => entry.id,
        ),
    )

    assert.equal(
      result.nextOffset,
      53,
    )

    assert.deepEqual(
      queries.map(
        ({ limit, offset }) => ({
          limit,
          offset,
        }),
      ),
      [
        {
          limit: 50,
          offset: 0,
        },
        {
          limit: 50,
          offset: 50,
        },
      ],
    )
  },
)
