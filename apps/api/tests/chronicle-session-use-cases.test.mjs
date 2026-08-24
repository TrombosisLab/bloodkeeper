import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ArchiveChronicleSessionUseCase,
} from '../dist/chronicles/application/archive-chronicle-session.use-case.js'
import {
  CompleteChronicleSessionUseCase,
} from '../dist/chronicles/application/complete-chronicle-session.use-case.js'
import {
  CreateChronicleSessionUseCase,
} from '../dist/chronicles/application/create-chronicle-session.use-case.js'
import {
  ListChronicleSessionsUseCase,
} from '../dist/chronicles/application/list-chronicle-sessions.use-case.js'
import {
  ChronicleSessionPermissionError,
} from '../dist/chronicles/application/chronicle-session-permission.js'
import {
  ChronicleSessionNotFoundError,
  UpdateChronicleSessionUseCase,
} from '../dist/chronicles/application/update-chronicle-session.use-case.js'
import {
  CharacterExperienceDuplicateError,
} from '../dist/characters/application/character-experience.repository.js'

const chronicleId =
  '11111111-1111-4111-8111-111111111111'
const sessionId =
  '22222222-2222-4222-8222-222222222222'
const narratorId =
  '33333333-3333-4333-8333-333333333333'

function snapshot(status = 'preparation') {
  return {
    id: sessionId,
    chronicleId,
    sessionNumber: 1,
    title: null,
    realDate: null,
    status,
    summary: null,
    narratorNotes: null,
    createdAt: new Date(0),
    updatedAt: new Date(0),
  }
}

function participants(role = 'narrator') {
  return {
    async findActiveMembership() {
      return role === null
        ? null
        : { role }
    },
  }
}

function repository(current = snapshot()) {
  return {
    async listByChronicleId() {
      return {
        items: [current],
        nextOffset: null,
      }
    },
    async findById() {
      return current
    },
    async create(data) {
      return {
        ...snapshot(),
        ...data,
      }
    },
    async update(data) {
      return {
        ...current,
        ...data,
      }
    },
    async complete() {
      return {
        ...current,
        status: 'completed',
      }
    },
    async archive() {
      return {
        ...current,
        status: 'archived',
      }
    },
  }
}

test(
  '035-B Narrador crea y Jugador no accede',
  async () => {
    const data = {
      chronicleId,
      sessionNumber: null,
      title: null,
      realDate: null,
      summary: null,
      narratorNotes: null,
    }
    const created =
      await new CreateChronicleSessionUseCase(
        repository(),
        participants(),
      ).execute(narratorId, data)
    assert.equal(created.status, 'preparation')

    await assert.rejects(
      new CreateChronicleSessionUseCase(
        repository(),
        participants('player'),
      ).execute(narratorId, data),
      ChronicleSessionPermissionError,
    )
  },
)

test(
  '035-B listado exige Narrador contextual',
  async () => {
    const listed =
      await new ListChronicleSessionsUseCase(
        repository(),
        participants(),
      ).execute(
        narratorId,
        chronicleId,
        { limit: 25, offset: 0 },
      )
    assert.equal(listed.items.length, 1)

    await assert.rejects(
      new ListChronicleSessionsUseCase(
        repository(),
        participants(null),
      ).execute(
        narratorId,
        chronicleId,
        { limit: 25, offset: 0 },
      ),
      ChronicleSessionPermissionError,
    )
  },
)

test(
  '035-B edita PREPARATION o COMPLETED pero no ARCHIVED',
  async () => {
    const updated =
      await new UpdateChronicleSessionUseCase(
        repository(snapshot('completed')),
        participants(),
      ).execute(narratorId, {
        chronicleId,
        sessionId,
        summary: 'Resumen',
      })
    assert.equal(updated.summary, 'Resumen')

    await assert.rejects(
      new UpdateChronicleSessionUseCase(
        repository(snapshot('archived')),
        participants(),
      ).execute(narratorId, {
        chronicleId,
        sessionId,
        summary: 'No',
      }),
      ChronicleSessionNotFoundError,
    )
  },
)

test(
  '035-B completar es explicito e idempotente',
  async () => {
    const completed =
      await new CompleteChronicleSessionUseCase(
        repository(),
        participants(),
      ).execute(
        narratorId,
        chronicleId,
        sessionId,
      )
    assert.equal(completed.status, 'completed')

    const already =
      await new CompleteChronicleSessionUseCase(
        repository(snapshot('completed')),
        participants(),
      ).execute(
        narratorId,
        chronicleId,
        sessionId,
      )
    assert.equal(already.status, 'completed')
  },
)

test(
  'Completar sesion concede 1 XP a cada personaje presente sin duplicar',
  async () => {
    const characterIds = [
      '44444444-4444-4444-8444-444444444444',
      '55555555-5555-4555-8555-555555555555',
    ]
    const attendance = {
      async listBySessionId() {
        return {
          items: characterIds.map(
            (characterId) => ({
              sessionId,
              characterId,
              createdAt: new Date(0),
            }),
          ),
          nextOffset: null,
        }
      },
    }
    const grants = []
    const experience = {
      async appendGrant(data) {
        grants.push(data)
      },
    }

    await new CompleteChronicleSessionUseCase(
      repository(),
      participants(),
      attendance,
      experience,
    ).execute(
      narratorId,
      chronicleId,
      sessionId,
    )

    assert.equal(grants.length, 2)
    assert.deepEqual(
      grants.map((grant) => ({
        characterId: grant.characterId,
        actorId: grant.actorId,
        chronicleId: grant.chronicleId,
        sessionId: grant.sessionId,
        amount: grant.amount,
        reason: grant.reason,
        deduplicationKey:
          grant.deduplicationKey,
      })),
      characterIds.map((characterId) => ({
        characterId,
        actorId: narratorId,
        chronicleId,
        sessionId,
        amount: 1,
        reason: 'session_played',
        deduplicationKey:
          `grant:session:${sessionId}:session_played`,
      })),
    )

    const duplicateExperience = {
      async appendGrant(data) {
        throw new CharacterExperienceDuplicateError(
          data.characterId,
        )
      },
    }
    const already =
      await new CompleteChronicleSessionUseCase(
        repository(snapshot('completed')),
        participants(),
        attendance,
        duplicateExperience,
      ).execute(
        narratorId,
        chronicleId,
        sessionId,
      )
    assert.equal(already.status, 'completed')
  },
)

test(
  '035-B archivar preserva historial y es idempotente',
  async () => {
    const archived =
      await new ArchiveChronicleSessionUseCase(
        repository(snapshot('completed')),
        participants(),
      ).execute(
        narratorId,
        chronicleId,
        sessionId,
      )
    assert.equal(archived.status, 'archived')

    const already =
      await new ArchiveChronicleSessionUseCase(
        repository(snapshot('archived')),
        participants(),
      ).execute(
        narratorId,
        chronicleId,
        sessionId,
      )
    assert.equal(already.status, 'archived')
  },
)
