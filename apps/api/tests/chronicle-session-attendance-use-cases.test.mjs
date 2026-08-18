import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import test from 'node:test'

import {
  AddChronicleSessionAttendanceUseCase,
  ChronicleSessionAttendanceCharacterNotEligibleError,
  ChronicleSessionAttendanceSessionNotEditableError,
  ChronicleSessionAttendanceSessionNotFoundError,
  ListChronicleSessionAttendancesUseCase,
  RemoveChronicleSessionAttendanceUseCase,
} from '../dist/chronicles/application/chronicle-session-attendance.use-cases.js'

import {
  ChronicleSessionPermissionError,
} from '../dist/chronicles/application/chronicle-session-permission.js'

function membership(role = 'narrator') {
  return {
    id: randomUUID(),
    chronicleId: randomUUID(),
    userId: randomUUID(),
    username: 'narrador',
    displayName: 'Narrador',
    role,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

function participantRepository(value) {
  return {
    async findActiveMembership() {
      return value
    },
  }
}

function session({
  status = 'preparation',
  chronicleId = randomUUID(),
  id = randomUUID(),
} = {}) {
  return {
    id,
    chronicleId,
    sessionNumber: 1,
    title: 'Sesión',
    realDate: null,
    status,
    summary: null,
    narratorNotes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

function sessionRepository(current) {
  return {
    async findById() {
      return current
    },
  }
}

function attendanceRepository({
  eligible = true,
} = {}) {
  const calls = []

  return {
    calls,

    async listBySessionId(
      sessionId,
      query,
    ) {
      calls.push([
        'list',
        sessionId,
        query,
      ])

      return {
        items: [],
        nextOffset: null,
      }
    },

    async isEligibleCharacter(
      chronicleId,
      characterId,
    ) {
      calls.push([
        'eligible',
        chronicleId,
        characterId,
      ])
      return eligible
    },

    async add(
      sessionId,
      characterId,
    ) {
      calls.push([
        'add',
        sessionId,
        characterId,
      ])

      return {
        id: randomUUID(),
        sessionId,
        characterId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    },

    async remove(
      sessionId,
      characterId,
    ) {
      calls.push([
        'remove',
        sessionId,
        characterId,
      ])
    },
  }
}

test(
  'Attendance exige Narrador contextual también para consultar',
  async () => {
    const chronicleId = randomUUID()
    const current = session({
      chronicleId,
    })

    await assert.rejects(
      new ListChronicleSessionAttendancesUseCase(
        attendanceRepository(),
        sessionRepository(current),
        participantRepository(null),
      ).execute(
        randomUUID(),
        chronicleId,
        current.id,
        {
          limit: 25,
          offset: 0,
        },
      ),
      ChronicleSessionPermissionError,
    )
  },
)

test(
  'Attendance distingue sesión inexistente',
  async () => {
    const chronicleId = randomUUID()

    await assert.rejects(
      new AddChronicleSessionAttendanceUseCase(
        attendanceRepository(),
        sessionRepository(null),
        participantRepository(
          membership(),
        ),
      ).execute(
        randomUUID(),
        chronicleId,
        randomUUID(),
        randomUUID(),
      ),
      ChronicleSessionAttendanceSessionNotFoundError,
    )
  },
)

test(
  'Attendance permite lectura de archivada pero bloquea escritura',
  async () => {
    const chronicleId = randomUUID()
    const current = session({
      chronicleId,
      status: 'archived',
    })
    const actor =
      membership('narrator')

    await new ListChronicleSessionAttendancesUseCase(
      attendanceRepository(),
      sessionRepository(current),
      participantRepository(actor),
    ).execute(
      actor.userId,
      chronicleId,
      current.id,
      {
        limit: 25,
        offset: 0,
      },
    )

    await assert.rejects(
      new AddChronicleSessionAttendanceUseCase(
        attendanceRepository(),
        sessionRepository(current),
        participantRepository(actor),
      ).execute(
        actor.userId,
        chronicleId,
        current.id,
        randomUUID(),
      ),
      ChronicleSessionAttendanceSessionNotEditableError,
    )
  },
)

test(
  'Attendance rechaza personaje no ACTIVE o de otra Crónica',
  async () => {
    const chronicleId = randomUUID()
    const current = session({
      chronicleId,
      status: 'completed',
    })
    const actor =
      membership('narrator')

    await assert.rejects(
      new AddChronicleSessionAttendanceUseCase(
        attendanceRepository({
          eligible: false,
        }),
        sessionRepository(current),
        participantRepository(actor),
      ).execute(
        actor.userId,
        chronicleId,
        current.id,
        randomUUID(),
      ),
      ChronicleSessionAttendanceCharacterNotEligibleError,
    )
  },
)

test(
  'Attendance puede añadir y retirar en PREPARATION o COMPLETED',
  async () => {
    for (const status of [
      'preparation',
      'completed',
    ]) {
      const chronicleId =
        randomUUID()
      const current =
        session({
          chronicleId,
          status,
        })
      const actor =
        membership('narrator')
      const characterId =
        randomUUID()
      const attendances =
        attendanceRepository()

      await new AddChronicleSessionAttendanceUseCase(
        attendances,
        sessionRepository(current),
        participantRepository(actor),
      ).execute(
        actor.userId,
        chronicleId,
        current.id,
        characterId,
      )

      await new RemoveChronicleSessionAttendanceUseCase(
        attendances,
        sessionRepository(current),
        participantRepository(actor),
      ).execute(
        actor.userId,
        chronicleId,
        current.id,
        characterId,
      )

      assert.equal(
        attendances.calls.some(
          ([name]) => name === 'add',
        ),
        true,
      )

      assert.equal(
        attendances.calls.some(
          ([name]) => name === 'remove',
        ),
        true,
      )
    }
  },
)
