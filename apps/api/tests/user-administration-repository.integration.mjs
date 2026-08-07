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
  '016-A persiste y consulta usuarios públicos ordenados',
  async () => {
    const database =
      new DatabaseService()

    const repository =
      new PrismaUserAdministrationRepository(
        database,
      )

    const suffix = randomUUID()
    const first =
      `a-user-${suffix}`
    const second =
      `b-user-${suffix}`

    await database.$connect()

    try {
      const created =
        await repository.create({
          username: second,
          displayName: 'Segundo',
          passwordHash:
            'scrypt$integration',
          status: 'active',
          roles: ['player'],
        })

      await repository.create({
        username: first,
        displayName: 'Primero',
        passwordHash:
          'scrypt$integration',
        status: 'active',
        roles: [
          'narrator',
          'player',
        ],
      })

      assert.equal(
        'passwordHash' in created,
        false,
      )

      assert.equal(
        (
          await repository
            .findByUsername(second)
        )?.id,
        created.id,
      )

      const listed =
        await repository.list()

      const selected =
        listed.filter(
          (user) =>
            user.username === first ||
            user.username === second,
        )

      assert.deepEqual(
        selected.map(
          (user) => user.username,
        ),
        [first, second],
      )
    } finally {
      await database.user.deleteMany({
        where: {
          username: {
            in: [first, second],
          },
        },
      })

      await database.$disconnect()
    }
  },
)
