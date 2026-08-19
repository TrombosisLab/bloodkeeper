import assert from 'node:assert/strict'
import test from 'node:test'

import {
  LoadChronicleSessionContextUseCase,
} from '../dist/chronicles/application/load-chronicle-session-context.use-case.js'

import {
  ReplaceChronicleSessionContextUseCase,
} from '../dist/chronicles/application/replace-chronicle-session-context.use-case.js'

import {
  ChronicleSessionPermissionError,
} from '../dist/chronicles/application/chronicle-session-permission.js'

const actorId =
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'

const chronicleId =
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'

const sessionId =
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc'

const context = {
  sessionId,
  events: [],
  npcs: [],
  locations: [],
}

function participants(role = 'narrator') {
  return {
    async findActiveMembership() {
      return role === null
        ? null
        : {
            role,
          }
    },
  }
}

test(
  '035-D lectura exige Narrador contextual y delega por Crónica/Sesión',
  async () => {
    const calls = []

    const repository = {
      async findBySessionId(
        receivedChronicleId,
        receivedSessionId,
      ) {
        calls.push([
          receivedChronicleId,
          receivedSessionId,
        ])
        return context
      },

      async replace() {
        throw new Error(
          'not used',
        )
      },
    }

    const useCase =
      new LoadChronicleSessionContextUseCase(
        repository,
        participants(),
      )

    assert.deepEqual(
      await useCase.execute(
        actorId,
        chronicleId,
        sessionId,
      ),
      context,
    )

    assert.deepEqual(
      calls,
      [[chronicleId, sessionId]],
    )
  },
)

test(
  '035-D reemplazo exige Narrador contextual y conserva listas exactas',
  async () => {
    const calls = []

    const repository = {
      async findBySessionId() {
        throw new Error(
          'not used',
        )
      },

      async replace(data) {
        calls.push(data)
        return context
      },
    }

    const data = {
      chronicleId,
      sessionId,
      eventIds: [
        'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      ],
      npcIds: [
        'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
      ],
      locationIds: [
        'ffffffff-ffff-4fff-8fff-ffffffffffff',
      ],
    }

    const useCase =
      new ReplaceChronicleSessionContextUseCase(
        repository,
        participants(),
      )

    assert.deepEqual(
      await useCase.execute(
        actorId,
        data,
      ),
      context,
    )

    assert.deepEqual(
      calls,
      [data],
    )
  },
)

test(
  '035-D jugador no puede consultar ni reemplazar contexto privado',
  async () => {
    const repository = {
      async findBySessionId() {
        return context
      },

      async replace() {
        return context
      },
    }

    const load =
      new LoadChronicleSessionContextUseCase(
        repository,
        participants('player'),
      )

    const replace =
      new ReplaceChronicleSessionContextUseCase(
        repository,
        participants('player'),
      )

    await assert.rejects(
      () =>
        load.execute(
          actorId,
          chronicleId,
          sessionId,
        ),
      ChronicleSessionPermissionError,
    )

    await assert.rejects(
      () =>
        replace.execute(
          actorId,
          {
            chronicleId,
            sessionId,
            eventIds: [],
            npcIds: [],
            locationIds: [],
          },
        ),
      ChronicleSessionPermissionError,
    )
  },
)
