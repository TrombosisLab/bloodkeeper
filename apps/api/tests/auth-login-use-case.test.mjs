import assert from 'node:assert/strict'
import test from 'node:test'

import {
  InvalidCredentialsError,
  LoginUseCase,
} from '../dist/auth/application/login.use-case.js'

import {
  LogoutUseCase,
} from '../dist/auth/application/logout.use-case.js'

import {
  ResolveSessionUseCase,
} from '../dist/auth/application/resolve-session.use-case.js'

function user(overrides = {}) {
  const now =
    new Date('2026-08-04T18:00:00.000Z')

  return {
    id:
      '9bba00d8-0b23-41fc-82d3-c7c9e6e4d001',
    username: 'narrador',
    displayName: 'Narrador',
    passwordHash: 'scrypt$encoded',
    status: 'active',
    roles: [
      'narrator',
      'player',
    ],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

test(
  '015-B autentica y crea una sesión con identidad pública',
  async () => {
    const calls = []
    const now =
      new Date('2026-08-04T18:00:00.000Z')

    const users = {
      async findById() {
        return user()
      },
      async findByUsername(username) {
        calls.push([
          'findByUsername',
          username,
        ])
        return user()
      },
      async create() {
        throw new Error('unexpected')
      },
    }

    const passwords = {
      async hash() {
        throw new Error('unexpected')
      },
      async verify(
        password,
        encoded,
      ) {
        calls.push([
          'verify',
          password,
          encoded,
        ])
        return true
      },
    }

    const sessions = {
      async create(data) {
        calls.push(['create', data])
        return {
          id: 'session-id',
          ...data,
          lastSeenAt:
            data.createdAt,
          revokedAt: null,
        }
      },
      async findByTokenHash() {
        return null
      },
      async markSeen() {},
      async revokeByTokenHash() {
        return false
      },
    }

    const tokens = {
      issue() {
        return {
          rawToken: 'raw-token',
          tokenHash: 'hash-token',
        }
      },
      hash(value) {
        return `hash:${value}`
      },
    }

    const useCase =
      new LoginUseCase(
        users,
        passwords,
        sessions,
        tokens,
        60_000,
      )

    const result =
      await useCase.execute(
        {
          username:
            '  NARRADOR  ',
          password:
            'contraseña-segura',
        },
        now,
      )

    assert.deepEqual(
      result.user,
      {
        id:
          '9bba00d8-0b23-41fc-82d3-c7c9e6e4d001',
        username: 'narrador',
        displayName: 'Narrador',
        roles: [
          'narrator',
          'player',
        ],
      },
    )

    assert.equal(
      result.sessionToken,
      'raw-token',
    )

    assert.equal(
      result.expiresAt.toISOString(),
      '2026-08-04T18:01:00.000Z',
    )

    assert.equal(
      'passwordHash' in result.user,
      false,
    )

    assert.equal(
      calls[2][1].tokenHash,
      'hash-token',
    )
  },
)

test(
  '015-B usa el mismo error para usuario inexistente contraseña incorrecta y cuenta desactivada',
  async () => {
    const passwords = {
      async hash() {
        return 'dummy-hash'
      },
      async verify() {
        return false
      },
    }

    const sessions = {
      async create() {
        throw new Error('unexpected')
      },
      async findByTokenHash() {
        return null
      },
      async markSeen() {},
      async revokeByTokenHash() {
        return false
      },
    }

    const tokens = {
      issue() {
        throw new Error('unexpected')
      },
      hash(value) {
        return value
      },
    }

    for (const account of [
      null,
      user(),
      user({
        status: 'disabled',
      }),
    ]) {
      const users = {
        async findById() {
          return account
        },
        async findByUsername() {
          return account
        },
        async create() {
          throw new Error('unexpected')
        },
      }

      const useCase =
        new LoginUseCase(
          users,
          passwords,
          sessions,
          tokens,
        )

      await assert.rejects(
        useCase.execute({
          username: 'narrador',
          password: 'incorrecta',
        }),
        InvalidCredentialsError,
      )
    }
  },
)

test(
  '015-B resuelve una sesión activa y rechaza expiradas revocadas o usuarios desactivados',
  async () => {
    const now =
      new Date('2026-08-04T18:00:00.000Z')

    const tokens = {
      issue() {
        throw new Error('unexpected')
      },
      hash(value) {
        return `hash:${value}`
      },
    }

    const states = [
      {
        session: {
          id: 'active',
          userId: user().id,
          tokenHash: 'hash:raw',
          expiresAt:
            new Date(
              '2026-08-04T19:00:00.000Z',
            ),
          createdAt: now,
          lastSeenAt: now,
          revokedAt: null,
        },
        account: user(),
        expected: 'narrador',
      },
      {
        session: {
          id: 'expired',
          userId: user().id,
          tokenHash: 'hash:raw',
          expiresAt:
            new Date(
              '2026-08-04T17:00:00.000Z',
            ),
          createdAt: now,
          lastSeenAt: now,
          revokedAt: null,
        },
        account: user(),
        expected: null,
      },
      {
        session: {
          id: 'revoked',
          userId: user().id,
          tokenHash: 'hash:raw',
          expiresAt:
            new Date(
              '2026-08-04T19:00:00.000Z',
            ),
          createdAt: now,
          lastSeenAt: now,
          revokedAt: now,
        },
        account: user(),
        expected: null,
      },
      {
        session: {
          id: 'disabled',
          userId: user().id,
          tokenHash: 'hash:raw',
          expiresAt:
            new Date(
              '2026-08-04T19:00:00.000Z',
            ),
          createdAt: now,
          lastSeenAt: now,
          revokedAt: null,
        },
        account: user({
          status: 'disabled',
        }),
        expected: null,
      },
    ]

    for (const state of states) {
      const sessions = {
        async create() {
          throw new Error('unexpected')
        },
        async findByTokenHash() {
          return state.session
        },
        async markSeen() {},
        async revokeByTokenHash() {
          return false
        },
      }

      const users = {
        async findById() {
          return state.account
        },
        async findByUsername() {
          return state.account
        },
        async create() {
          throw new Error('unexpected')
        },
      }

      const useCase =
        new ResolveSessionUseCase(
          sessions,
          users,
          tokens,
        )

      const resolved =
        await useCase.execute(
          'raw',
          now,
        )

      assert.equal(
        resolved?.username ?? null,
        state.expected,
      )
    }
  },
)

test(
  '015-B logout revoca exclusivamente el hash de la sesión recibida',
  async () => {
    const calls = []
    const now =
      new Date('2026-08-04T18:00:00.000Z')

    const sessions = {
      async create() {
        throw new Error('unexpected')
      },
      async findByTokenHash() {
        return null
      },
      async markSeen() {},
      async revokeByTokenHash(
        hash,
        revokedAt,
      ) {
        calls.push([
          hash,
          revokedAt,
        ])
        return true
      },
    }

    const tokens = {
      issue() {
        throw new Error('unexpected')
      },
      hash(value) {
        return `sha256:${value}`
      },
    }

    const useCase =
      new LogoutUseCase(
        sessions,
        tokens,
      )

    assert.equal(
      await useCase.execute(
        'raw-session',
        now,
      ),
      true,
    )

    assert.deepEqual(calls, [
      [
        'sha256:raw-session',
        now,
      ],
    ])
  },
)
