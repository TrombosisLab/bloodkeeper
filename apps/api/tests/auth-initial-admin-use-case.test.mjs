import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CreateInitialAdminUseCase,
  InitialAdminAlreadyExistsError,
} from '../dist/auth/application/create-initial-admin.use-case.js'

import {
  InvalidAuthUserError,
} from '../dist/auth/domain/auth-user.rules.js'

function user(overrides = {}) {
  const now =
    new Date('2026-08-04T18:00:00.000Z')

  return {
    id:
      '6c130fb1-d738-4dce-b343-98e32b968cd2',
    username: 'administrador',
    displayName: 'Administrador',
    passwordHash: 'scrypt$encoded',
    status: 'active',
    roles: [
      'admin',
      'narrator',
      'player',
    ],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

test(
  '015-A crea el administrador inicial con datos normalizados',
  async () => {
    const calls = []
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
        return user({
          username: data.username,
          displayName:
            data.displayName,
          passwordHash:
            data.passwordHash,
        })
      },
    }
    const hasher = {
      async hash(password) {
        calls.push([
          'hash',
          password,
        ])
        return 'scrypt$encoded'
      },
      async verify() {
        return false
      },
    }

    const useCase =
      new CreateInitialAdminUseCase(
        repository,
        hasher,
      )

    const created =
      await useCase.execute({
        username:
          '  Administrador  ',
        displayName:
          '  Administrador  ',
        password:
          'una-contraseña-segura',
      })

    assert.equal(
      created.username,
      'administrador',
    )
    assert.deepEqual(
      created.roles,
      [
        'admin',
        'narrator',
        'player',
      ],
    )
    assert.deepEqual(calls, [
      [
        'findByUsername',
        'administrador',
      ],
      [
        'hash',
        'una-contraseña-segura',
      ],
      [
        'create',
        {
          username: 'administrador',
          displayName:
            'Administrador',
          passwordHash:
            'scrypt$encoded',
          status: 'active',
          roles: [
            'admin',
            'narrator',
            'player',
          ],
        },
      ],
    ])
  },
)

test(
  '015-A no sustituye una cuenta existente',
  async () => {
    const repository = {
      async findByUsername() {
        return user()
      },
      async create() {
        throw new Error('unexpected')
      },
    }
    const hasher = {
      async hash() {
        throw new Error('unexpected')
      },
      async verify() {
        return false
      },
    }

    const useCase =
      new CreateInitialAdminUseCase(
        repository,
        hasher,
      )

    await assert.rejects(
      useCase.execute({
        username: 'administrador',
        displayName: 'Administrador',
        password:
          'una-contraseña-segura',
      }),
      InitialAdminAlreadyExistsError,
    )
  },
)

test(
  '015-A valida usuario nombre visible y contraseña',
  async () => {
    const repository = {
      async findByUsername() {
        throw new Error('unexpected')
      },
      async create() {
        throw new Error('unexpected')
      },
    }
    const hasher = {
      async hash() {
        throw new Error('unexpected')
      },
      async verify() {
        return false
      },
    }

    const useCase =
      new CreateInitialAdminUseCase(
        repository,
        hasher,
      )

    await assert.rejects(
      useCase.execute({
        username: 'A',
        displayName: ' ',
        password: 'corta',
      }),
      (error) =>
        error instanceof
          InvalidAuthUserError &&
        error.issues.length === 3,
    )
  },
)
