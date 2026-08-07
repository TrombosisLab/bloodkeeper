import assert from 'node:assert/strict'
import {
  randomUUID,
} from 'node:crypto'
import test from 'node:test'

import {
  ResetUserPasswordUseCase,
} from '../dist/auth/application/reset-user-password.use-case.js'

import {
  DatabaseService,
} from '../dist/database/database.service.js'

import {
  PrismaAuthSessionRepository,
} from '../dist/auth/infrastructure/prisma-auth-session.repository.js'

import {
  PrismaAuthUserRepository,
} from '../dist/auth/infrastructure/prisma-auth-user.repository.js'

import {
  ScryptPasswordHasher,
} from '../dist/auth/infrastructure/scrypt-password-hasher.js'

import {
  Sha256SessionTokenService,
} from '../dist/auth/infrastructure/sha256-session-token.service.js'

test(
  '015-C restablece una cuenta existente y revoca todas sus sesiones',
  async () => {
    const database =
      new DatabaseService()
    const users =
      new PrismaAuthUserRepository(
        database,
      )
    const sessions =
      new PrismaAuthSessionRepository(
        database,
      )
    const hasher =
      new ScryptPasswordHasher()
    const tokens =
      new Sha256SessionTokenService()

    const username =
      `recovery-${randomUUID().slice(0, 12)}`
    const otherUsername =
      `recovery-other-${randomUUID().slice(0, 12)}`
    const oldPassword =
      'contraseña-anterior-segura'
    const newPassword =
      'contraseña-nueva-segura'

    await database.$connect()

    try {
      const account =
        await users.create({
          username,
          displayName:
            'Recuperación de integración',
          passwordHash:
            await hasher.hash(oldPassword),
          status: 'active',
          roles: ['player'],
        })

      const other =
        await users.create({
          username: otherUsername,
          displayName:
            'Otra cuenta',
          passwordHash:
            await hasher.hash(
              'otra-contraseña-segura',
            ),
          status: 'active',
          roles: ['player'],
        })

      const firstToken = tokens.issue()
      const secondToken = tokens.issue()
      const otherToken = tokens.issue()
      const createdAt =
        new Date('2026-08-07T10:20:00.000Z')
      const expiresAt =
        new Date('2026-08-08T10:20:00.000Z')

      await sessions.create({
        userId: account.id,
        tokenHash:
          firstToken.tokenHash,
        createdAt,
        expiresAt,
      })

      await sessions.create({
        userId: account.id,
        tokenHash:
          secondToken.tokenHash,
        createdAt,
        expiresAt,
      })

      await sessions.create({
        userId: other.id,
        tokenHash:
          otherToken.tokenHash,
        createdAt,
        expiresAt,
      })

      const useCase =
        new ResetUserPasswordUseCase(
          users,
          sessions,
          hasher,
          () =>
            new Date(
              '2026-08-07T10:30:00.000Z',
            ),
        )

      const updated =
        await useCase.execute({
          username,
          password: newPassword,
        })

      assert.equal(
        await hasher.verify(
          oldPassword,
          updated.passwordHash,
        ),
        false,
      )
      assert.equal(
        await hasher.verify(
          newPassword,
          updated.passwordHash,
        ),
        true,
      )

      const first =
        await sessions.findByTokenHash(
          firstToken.tokenHash,
        )
      const second =
        await sessions.findByTokenHash(
          secondToken.tokenHash,
        )
      const untouched =
        await sessions.findByTokenHash(
          otherToken.tokenHash,
        )

      assert.notEqual(
        first?.revokedAt,
        null,
      )
      assert.notEqual(
        second?.revokedAt,
        null,
      )
      assert.equal(
        untouched?.revokedAt,
        null,
      )

      assert.equal(
        updated.username,
        username,
      )
      assert.equal(
        updated.displayName,
        'Recuperación de integración',
      )
      assert.equal(
        updated.status,
        'active',
      )
      assert.deepEqual(
        updated.roles,
        ['player'],
      )
    } finally {
      await database.user.deleteMany({
        where: {
          username: {
            in: [
              username,
              otherUsername,
            ],
          },
        },
      })
      await database.$disconnect()
    }
  },
)
