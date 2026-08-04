import assert from 'node:assert/strict'
import {
  randomUUID,
} from 'node:crypto'
import test from 'node:test'

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
  Sha256SessionTokenService,
} from '../dist/auth/infrastructure/sha256-session-token.service.js'

test(
  '015-B persiste hash, resuelve y revoca una sesión',
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

    const tokens =
      new Sha256SessionTokenService()

    const username =
      `session-${randomUUID()}`

    await database.$connect()

    try {
      const account =
        await users.create({
          username,
          displayName:
            'Sesión de integración',
          passwordHash:
            'scrypt$integration',
          status: 'active',
          roles: ['player'],
        })

      const token =
        tokens.issue()

      const created =
        await sessions.create({
          userId: account.id,
          tokenHash:
            token.tokenHash,
          createdAt: new Date(),
          expiresAt:
            new Date(
              Date.now() + 60_000,
            ),
        })

      assert.equal(
        created.tokenHash,
        token.tokenHash,
      )
      assert.notEqual(
        created.tokenHash,
        token.rawToken,
      )

      const loaded =
        await sessions.findByTokenHash(
          token.tokenHash,
        )

      assert.equal(
        loaded?.userId,
        account.id,
      )

      assert.equal(
        await sessions.revokeByTokenHash(
          token.tokenHash,
          new Date(),
        ),
        true,
      )

      const revoked =
        await sessions.findByTokenHash(
          token.tokenHash,
        )

      assert.notEqual(
        revoked?.revokedAt,
        null,
      )
    } finally {
      await database.user.deleteMany({
        where: {
          username,
        },
      })
      await database.$disconnect()
    }
  },
)
