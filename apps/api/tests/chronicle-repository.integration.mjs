import assert from 'node:assert/strict'
import {
  randomUUID,
} from 'node:crypto'
import test from 'node:test'

import {
  DatabaseService,
} from '../dist/database/database.service.js'

import {
  PrismaChronicleRepository,
} from '../dist/chronicles/infrastructure/prisma-chronicle.repository.js'

test(
  '030-B crea y lista Crónicas aisladas por narrador',
  async () => {
    const database =
      new DatabaseService()
    const repository =
      new PrismaChronicleRepository(
        database,
      )
    const narratorId = randomUUID()
    const otherNarratorId =
      randomUUID()

    await database.$connect()

    await database.user.createMany({
      data: [
        {
          id: narratorId,
          username:
            `chronicle-repository-${narratorId}`,
          displayName:
            'Narrador de repositorio',
          passwordHash:
            'integration-not-used',
        },
        {
          id: otherNarratorId,
          username:
            `chronicle-repository-${otherNarratorId}`,
          displayName:
            'Otro narrador de repositorio',
          passwordHash:
            'integration-not-used',
        },
      ],
    })

    try {
      const created =
        await repository.create({
          narratorId,
          name: 'Noches de A Coruña',
          description:
            'Crónica de integración 030-B.',
        })

      await repository.create({
        narratorId: otherNarratorId,
        name: 'Crónica ajena',
        description: null,
      })

      const listed =
        await repository
          .findByNarratorId(
            narratorId,
          )

      assert.equal(listed.length, 1)
      assert.equal(
        listed[0]?.id,
        created.id,
      )
      assert.equal(
        listed[0]?.narratorId,
        narratorId,
      )
      assert.equal(
        listed[0]?.status,
        'preparation',
      )
    } finally {
      await database.chronicleParticipant.deleteMany({
        where: {
          userId: {
            in: [
              narratorId,
              otherNarratorId,
            ],
          },
        },
      })

      await database.chronicle.deleteMany({
        where: {
          narratorId: {
            in: [
              narratorId,
              otherNarratorId,
            ],
          },
        },
      })

      await database.user.deleteMany({
        where: {
          id: {
            in: [
              narratorId,
              otherNarratorId,
            ],
          },
        },
      })

      await database.$disconnect()
    }
  },
)
