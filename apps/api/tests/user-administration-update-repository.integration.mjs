import assert from 'node:assert/strict'
import {
  randomUUID,
} from 'node:crypto'
import test from 'node:test'

import {
  DatabaseService,
} from '../dist/database/database.service.js'

import {
  PrismaUserAdministrationRepository,
} from '../dist/users/infrastructure/prisma-user-administration.repository.js'

test(
  '016-B actualiza identidad y estado preservando credenciales y roles',
  async () => {
    const database =
      new DatabaseService()
    const repository =
      new PrismaUserAdministrationRepository(
        database,
      )

    const suffix =
      randomUUID().slice(0, 10)
    const username =
      `repo-upd-${suffix}`

    await database.$connect()

    try {
      const created =
        await repository.create({
          username,
          displayName: 'Repository User',
          passwordHash:
            'scrypt$repository-preserved',
          status: 'active',
          roles: ['player'],
        })

      const loaded =
        await repository.findById(
          created.id,
        )

      assert.equal(
        loaded?.id,
        created.id,
      )

      const updated =
        await repository.update(
          created.id,
          {
            username:
              `repo-new-${suffix}`,
            displayName:
              'Repository Updated',
            status: 'disabled',
          },
        )

      assert.equal(
        updated.username,
        `repo-new-${suffix}`,
      )
      assert.equal(
        updated.displayName,
        'Repository Updated',
      )
      assert.equal(
        updated.status,
        'disabled',
      )
      assert.deepEqual(
        updated.roles,
        ['player'],
      )

      const row =
        await database.user.findUnique({
          where: {
            id: created.id,
          },
        })

      assert.equal(
        row?.passwordHash,
        'scrypt$repository-preserved',
      )
      assert.deepEqual(
        row?.roles,
        ['PLAYER'],
      )
      assert.equal(
        row?.status,
        'DISABLED',
      )
    } finally {
      await database.user.deleteMany({
        where: {
          username: {
            in: [
              username,
              `repo-new-${suffix}`,
            ],
          },
        },
      })

      await database.$disconnect()
    }
  },
)
