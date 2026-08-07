import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import test from 'node:test'

import {
  DatabaseService,
} from '../dist/database/database.service.js'

import {
  PrismaUserAdministrationRepository,
} from '../dist/users/infrastructure/prisma-user-administration.repository.js'

test(
  '016 roles persiste roles preservando identidad estado y credencial',
  async () => {
    const database = new DatabaseService()
    const users =
      new PrismaUserAdministrationRepository(
        database,
      )

    const username =
      `roles-repo-${randomUUID().slice(0, 12)}`
    const passwordHash =
      'scrypt$roles-repository-hash'

    await database.$connect()

    try {
      const created =
        await users.create({
          username,
          displayName: 'Roles Repository',
          passwordHash,
          status: 'active',
          roles: ['player'],
        })

      const updated =
        await users.updateRoles(
          created.id,
          ['admin', 'narrator'],
        )

      assert.deepEqual(
        updated.roles,
        ['admin', 'narrator'],
      )
      assert.equal(
        updated.username,
        created.username,
      )
      assert.equal(
        updated.displayName,
        created.displayName,
      )
      assert.equal(
        updated.status,
        created.status,
      )

      const row =
        await database.user.findUnique({
          where: {
            id: created.id,
          },
        })

      assert.ok(row)
      assert.equal(
        row.passwordHash,
        passwordHash,
      )
      assert.equal(
        row.username,
        created.username,
      )
      assert.equal(
        row.displayName,
        created.displayName,
      )
      assert.equal(row.status, 'ACTIVE')
      assert.deepEqual(
        row.roles,
        ['ADMIN', 'NARRATOR'],
      )
    } finally {
      await database.user.deleteMany({
        where: { username },
      })
      await database.$disconnect()
    }
  },
)
