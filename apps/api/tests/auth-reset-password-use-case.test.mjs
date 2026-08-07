import assert from 'node:assert/strict'
import test from 'node:test'

import {
  AuthRecoveryUserNotFoundError,
  ResetUserPasswordUseCase,
} from '../dist/auth/application/reset-user-password.use-case.js'

import {
  InvalidAuthUserError,
} from '../dist/auth/domain/auth-user.rules.js'

function user(overrides = {}) {
  const now =
    new Date('2026-08-07T10:00:00.000Z')

  return {
    id:
      '55f59586-9a58-4e49-99d4-e388a8ec87cf',
    username: 'administrador',
    displayName: 'Administrador',
    passwordHash: 'scrypt$old',
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
  '015-C restablece la contraseña y revoca sesiones antes de persistir el nuevo hash',
  async () => {
    const calls = []
    const account = user()

    const users = {
      async findByUsername(username) {
        calls.push([
          'findByUsername',
          username,
        ])
        return account
      },
      async updatePasswordHash(
        userId,
        passwordHash,
      ) {
        calls.push([
          'updatePasswordHash',
          userId,
          passwordHash,
        ])
        return user({
          passwordHash,
        })
      },
    }

    const sessions = {
      async revokeAllByUserId(
        userId,
        revokedAt,
      ) {
        calls.push([
          'revokeAllByUserId',
          userId,
          revokedAt.toISOString(),
        ])
        return 2
      },
    }

    const hasher = {
      async hash(password) {
        calls.push([
          'hash',
          password,
        ])
        return 'scrypt$new'
      },
      async verify() {
        return false
      },
    }

    const now =
      new Date('2026-08-07T10:15:00.000Z')

    const useCase =
      new ResetUserPasswordUseCase(
        users,
        sessions,
        hasher,
        () => now,
      )

    const updated =
      await useCase.execute({
        username:
          '  Administrador  ',
        password:
          'nueva-contraseña-segura',
      })

    assert.equal(
      updated.passwordHash,
      'scrypt$new',
    )

    assert.deepEqual(calls, [
      [
        'findByUsername',
        'administrador',
      ],
      [
        'hash',
        'nueva-contraseña-segura',
      ],
      [
        'revokeAllByUserId',
        account.id,
        now.toISOString(),
      ],
      [
        'updatePasswordHash',
        account.id,
        'scrypt$new',
      ],
    ])
  },
)

test(
  '015-C rechaza una cuenta inexistente sin hashear ni modificar sesiones',
  async () => {
    let touched = false

    const useCase =
      new ResetUserPasswordUseCase(
        {
          async findByUsername() {
            return null
          },
          async updatePasswordHash() {
            touched = true
            throw new Error('unexpected')
          },
        },
        {
          async revokeAllByUserId() {
            touched = true
            throw new Error('unexpected')
          },
        },
        {
          async hash() {
            touched = true
            throw new Error('unexpected')
          },
          async verify() {
            return false
          },
        },
      )

    await assert.rejects(
      useCase.execute({
        username: 'no-existe',
        password:
          'nueva-contraseña-segura',
      }),
      AuthRecoveryUserNotFoundError,
    )

    assert.equal(touched, false)
  },
)

test(
  '015-C reutiliza las reglas de usuario y contraseña antes de acceder al repositorio',
  async () => {
    let touched = false

    const useCase =
      new ResetUserPasswordUseCase(
        {
          async findByUsername() {
            touched = true
            throw new Error('unexpected')
          },
          async updatePasswordHash() {
            touched = true
            throw new Error('unexpected')
          },
        },
        {
          async revokeAllByUserId() {
            touched = true
            throw new Error('unexpected')
          },
        },
        {
          async hash() {
            touched = true
            throw new Error('unexpected')
          },
          async verify() {
            return false
          },
        },
      )

    await assert.rejects(
      useCase.execute({
        username: 'A',
        password: 'corta',
      }),
      (error) =>
        error instanceof
          InvalidAuthUserError &&
        error.issues.some(
          (issue) =>
            issue.code ===
              'AUTH_USERNAME_INVALID',
        ) &&
        error.issues.some(
          (issue) =>
            issue.code ===
              'AUTH_PASSWORD_TOO_SHORT',
        ),
    )

    assert.equal(touched, false)
  },
)

test(
  '015-C no cambia el hash si no puede revocar las sesiones previas',
  async () => {
    let updated = false

    const useCase =
      new ResetUserPasswordUseCase(
        {
          async findByUsername() {
            return user()
          },
          async updatePasswordHash() {
            updated = true
            return user()
          },
        },
        {
          async revokeAllByUserId() {
            throw new Error(
              'session-store-unavailable',
            )
          },
        },
        {
          async hash() {
            return 'scrypt$new'
          },
          async verify() {
            return false
          },
        },
      )

    await assert.rejects(
      useCase.execute({
        username: 'administrador',
        password:
          'nueva-contraseña-segura',
      }),
      /session-store-unavailable/,
    )

    assert.equal(updated, false)
  },
)
