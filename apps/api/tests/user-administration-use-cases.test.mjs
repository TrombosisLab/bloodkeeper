import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CreateUserUseCase,
  UserAlreadyExistsError,
} from '../dist/users/application/create-user.use-case.js'

import {
  ListUsersUseCase,
} from '../dist/users/application/list-users.use-case.js'

function user(overrides = {}) {
  const now =
    new Date('2026-08-04T20:00:00.000Z')

  return {
    id:
      '775a3cb0-7509-49db-9665-5d2d881cb397',
    username: 'jugador',
    displayName: 'Jugador',
    status: 'active',
    roles: ['player'],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

test(
  '016-A crea un usuario activo con contraseña hasheada',
  async () => {
    const calls = []
    const expected = user()

    const repository = {
      async findByUsername(username) {
        calls.push([
          'findByUsername',
          username,
        ])
        return null
      },
      async create(data) {
        calls.push(['create', data])
        return expected
      },
      async list() {
        return []
      },
    }

    const passwords = {
      async hash(password) {
        calls.push(['hash', password])
        return 'scrypt$encoded'
      },
      async verify() {
        return false
      },
    }

    const useCase =
      new CreateUserUseCase(
        repository,
        passwords,
      )

    assert.equal(
      await useCase.execute({
        username: ' JUGADOR ',
        displayName: ' Jugador ',
        password:
          'contraseña-segura-016',
        roles: ['player'],
      }),
      expected,
    )

    assert.deepEqual(calls, [
      [
        'findByUsername',
        'jugador',
      ],
      [
        'hash',
        'contraseña-segura-016',
      ],
      [
        'create',
        {
          username: 'jugador',
          displayName: 'Jugador',
          passwordHash:
            'scrypt$encoded',
          status: 'active',
          roles: ['player'],
        },
      ],
    ])
  },
)

test(
  '016-A rechaza un nombre de usuario existente',
  async () => {
    const repository = {
      async findByUsername() {
        return user()
      },
      async create() {
        throw new Error('unexpected')
      },
      async list() {
        return []
      },
    }

    const passwords = {
      async hash() {
        throw new Error('unexpected')
      },
      async verify() {
        return false
      },
    }

    await assert.rejects(
      new CreateUserUseCase(
        repository,
        passwords,
      ).execute({
        username: 'jugador',
        displayName: 'Jugador',
        password:
          'contraseña-segura-016',
        roles: ['player'],
      }),
      UserAlreadyExistsError,
    )
  },
)

test(
  '016-A consulta usuarios mediante el repositorio',
  async () => {
    const expected = [user()]
    const repository = {
      async findByUsername() {
        return null
      },
      async create() {
        throw new Error('unexpected')
      },
      async list() {
        return expected
      },
    }

    assert.equal(
      await new ListUsersUseCase(
        repository,
      ).execute(),
      expected,
    )
  },
)
