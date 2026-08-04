import assert from 'node:assert/strict'
import {
  randomUUID,
} from 'node:crypto'
import test from 'node:test'

import {
  DatabaseService,
} from '../dist/database/database.service.js'

import {
  PrismaAuthUserRepository,
} from '../dist/auth/infrastructure/prisma-auth-user.repository.js'

import {
  ScryptPasswordHasher,
} from '../dist/auth/infrastructure/scrypt-password-hasher.js'

test(
  '015-A persiste y recupera una cuenta sin guardar contraseña en claro',
  async () => {
    const database =
      new DatabaseService()
    const repository =
      new PrismaAuthUserRepository(
        database,
      )
    const hasher =
      new ScryptPasswordHasher()
    const username =
      `admin-${randomUUID()}`
    const plainPassword =
      'una-contraseña-segura'
    const passwordHash =
      await hasher.hash(
        plainPassword,
      )

    await database.$connect()

    try {
      const created =
        await repository.create({
          username,
          displayName:
            'Administrador de integración',
          passwordHash,
          status: 'active',
          roles: [
            'admin',
            'narrator',
            'player',
          ],
        })

      assert.equal(
        created.username,
        username,
      )
      assert.notEqual(
        created.passwordHash,
        plainPassword,
      )
      assert.equal(
        await hasher.verify(
          plainPassword,
          created.passwordHash,
        ),
        true,
      )

      const loaded =
        await repository.findByUsername(
          username,
        )

      assert.equal(
        loaded?.id,
        created.id,
      )
      assert.deepEqual(
        loaded?.roles,
        [
          'admin',
          'narrator',
          'player',
        ],
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
