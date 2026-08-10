import assert from 'node:assert/strict'
import {
  randomUUID,
} from 'node:crypto'
import test from 'node:test'

import {
  ChronicleParticipantActiveCharacterRelationError,
  RetireChronicleParticipantUseCase,
} from '../dist/chronicles/application/retire-chronicle-participant.use-case.js'

function participant(
  overrides = {},
) {
  return {
    id: randomUUID(),
    chronicleId: randomUUID(),
    userId: randomUUID(),
    username: 'usuario',
    displayName: 'Usuario',
    role: 'player',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

function repository(
  actor,
  target,
) {
  return {
    async findActiveMembership() {
      return actor
    },
    async findById() {
      return target
    },
    async countActiveNarrators() {
      return 2
    },
    async retire() {
      return {
        ...target,
        status: 'retired',
      }
    },
  }
}

test(
  '031-D retirada bloquea participante con personaje no archivado asociado',
  async () => {
    const chronicleId =
      randomUUID()
    const actor =
      participant({
        chronicleId,
        role: 'narrator',
      })
    const target =
      participant({
        chronicleId,
        role: 'player',
      })

    const relations = {
      async hasNonArchivedCharacters() {
        return true
      },
    }

    await assert.rejects(
      new RetireChronicleParticipantUseCase(
        repository(
          actor,
          target,
        ),
        relations,
      ).execute(
        actor.userId,
        chronicleId,
        target.id,
      ),
      ChronicleParticipantActiveCharacterRelationError,
    )
  },
)

test(
  '031-D retirada procede cuando no quedan personajes no archivados asociados',
  async () => {
    const chronicleId =
      randomUUID()
    const actor =
      participant({
        chronicleId,
        role: 'narrator',
      })
    const target =
      participant({
        chronicleId,
        role: 'player',
      })

    const relations = {
      async hasNonArchivedCharacters() {
        return false
      },
    }

    const retired =
      await new RetireChronicleParticipantUseCase(
        repository(
          actor,
          target,
        ),
        relations,
      ).execute(
        actor.userId,
        chronicleId,
        target.id,
      )

    assert.equal(
      retired.status,
      'retired',
    )
  },
)
