import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import test from 'node:test'

import {
  AddChronicleParticipantUseCase,
  ChronicleParticipantUserNotFoundError,
} from '../dist/chronicles/application/add-chronicle-participant.use-case.js'

import {
  ChronicleParticipantDuplicateError,
} from '../dist/chronicles/application/chronicle-participant.repository.js'

import {
  ChronicleParticipantPermissionError,
  ListChronicleParticipantsUseCase,
} from '../dist/chronicles/application/list-chronicle-participants.use-case.js'

import {
  ChronicleLastNarratorRequiredError,
  ChronicleParticipantNotFoundError,
  RetireChronicleParticipantUseCase,
} from '../dist/chronicles/application/retire-chronicle-participant.use-case.js'

function participant({
  id = randomUUID(),
  chronicleId = randomUUID(),
  userId = randomUUID(),
  role = 'player',
  status = 'active',
} = {}) {
  return {
    id,
    chronicleId,
    userId,
    username: 'usuario',
    displayName: 'Usuario',
    role,
    status,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

function repository(seed = {}) {
  return {
    async findActiveMembership() {
      return seed.actorMembership ?? null
    },
    async findById() {
      return seed.targetParticipant ?? null
    },
    async findByUserId() {
      return seed.existing ?? null
    },
    async listByChronicleId() {
      return seed.list ?? []
    },
    async userExists() {
      return seed.userExists ?? true
    },
    async add(data) {
      return participant({
        chronicleId: data.chronicleId,
        userId: data.userId,
        role: data.role,
      })
    },
    async countActiveNarrators() {
      return seed.activeNarrators ?? 1
    },
    async retire() {
      return {
        ...seed.targetParticipant,
        status: 'retired',
      }
    },
  }
}

test(
  '031-B lista participantes para una membresía activa',
  async () => {
    const chronicleId = randomUUID()
    const actorUserId = randomUUID()
    const actorMembership =
      participant({
        chronicleId,
        userId: actorUserId,
        role: 'player',
      })
    const list = [actorMembership]

    const result =
      await new ListChronicleParticipantsUseCase(
        repository({
          actorMembership,
          list,
        }),
      ).execute(
        actorUserId,
        chronicleId,
      )

    assert.deepEqual(result, list)
  },
)

test(
  '031-B exige membresía contextual activa',
  async () => {
    await assert.rejects(
      new ListChronicleParticipantsUseCase(
        repository(),
      ).execute(
        randomUUID(),
        randomUUID(),
      ),
      ChronicleParticipantPermissionError,
    )
  },
)

test(
  '031-B sólo Narrador contextual activo incorpora',
  async () => {
    const chronicleId = randomUUID()
    const actorUserId = randomUUID()
    const targetUserId = randomUUID()

    await assert.rejects(
      new AddChronicleParticipantUseCase(
        repository({
          actorMembership:
            participant({
              chronicleId,
              userId: actorUserId,
              role: 'player',
            }),
        }),
      ).execute(
        actorUserId,
        {
          chronicleId,
          userId: targetUserId,
          role: 'player',
        },
      ),
      ChronicleParticipantPermissionError,
    )

    const added =
      await new AddChronicleParticipantUseCase(
        repository({
          actorMembership:
            participant({
              chronicleId,
              userId: actorUserId,
              role: 'narrator',
            }),
        }),
      ).execute(
        actorUserId,
        {
          chronicleId,
          userId: targetUserId,
          role: 'player',
        },
      )

    assert.equal(added.userId, targetUserId)
  },
)

test(
  '031-B rechaza usuario inexistente y duplicado',
  async () => {
    const chronicleId = randomUUID()
    const actorUserId = randomUUID()
    const targetUserId = randomUUID()
    const actorMembership =
      participant({
        chronicleId,
        userId: actorUserId,
        role: 'narrator',
      })

    await assert.rejects(
      new AddChronicleParticipantUseCase(
        repository({
          actorMembership,
          userExists: false,
        }),
      ).execute(
        actorUserId,
        {
          chronicleId,
          userId: targetUserId,
          role: 'player',
        },
      ),
      ChronicleParticipantUserNotFoundError,
    )

    await assert.rejects(
      new AddChronicleParticipantUseCase(
        repository({
          actorMembership,
          existing: participant({
            chronicleId,
            userId: targetUserId,
          }),
        }),
      ).execute(
        actorUserId,
        {
          chronicleId,
          userId: targetUserId,
          role: 'player',
        },
      ),
      ChronicleParticipantDuplicateError,
    )
  },
)

test(
  '031-B retirada preserva relación y protege último Narrador',
  async () => {
    const chronicleId = randomUUID()
    const actorUserId = randomUUID()
    const actorMembership =
      participant({
        chronicleId,
        userId: actorUserId,
        role: 'narrator',
      })
    const targetNarrator =
      participant({
        chronicleId,
        role: 'narrator',
      })

    await assert.rejects(
      new RetireChronicleParticipantUseCase(
        repository({
          actorMembership,
          targetParticipant: targetNarrator,
          activeNarrators: 1,
        }),
      {
        async hasNonArchivedCharacters() {
          return false
        },
      },
      ).execute(
        actorUserId,
        chronicleId,
        targetNarrator.id,
      ),
      ChronicleLastNarratorRequiredError,
    )

    const targetPlayer =
      participant({
        chronicleId,
        role: 'player',
      })

    const retired =
      await new RetireChronicleParticipantUseCase(
        repository({
          actorMembership,
          targetParticipant: targetPlayer,
        }),
      {
        async hasNonArchivedCharacters() {
          return false
        },
      },
      ).execute(
        actorUserId,
        chronicleId,
        targetPlayer.id,
      )

    assert.equal(retired.status, 'retired')
  },
)

test(
  '031-B retirada ausente se rechaza',
  async () => {
    const chronicleId = randomUUID()
    const actorUserId = randomUUID()
    const actorMembership =
      participant({
        chronicleId,
        userId: actorUserId,
        role: 'narrator',
      })

    await assert.rejects(
      new RetireChronicleParticipantUseCase(
        repository({
          actorMembership,
        }),
      {
        async hasNonArchivedCharacters() {
          return false
        },
      },
      ).execute(
        actorUserId,
        chronicleId,
        randomUUID(),
      ),
      ChronicleParticipantNotFoundError,
    )
  },
)
