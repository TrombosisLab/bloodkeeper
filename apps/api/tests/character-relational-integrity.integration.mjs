import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import test from 'node:test'

import {
  DatabaseService,
} from '../dist/database/database.service.js'

async function createOwner(
  database,
  ownerId,
) {
  await database.user.create({
    data: {
      id: ownerId,
      username: `spec022-owner-${ownerId}`,
      displayName: 'SPEC-022 owner',
      passwordHash: 'integration-test-only',
    },
  })
}

test(
  'SPEC-022 mantiene referencias válidas a propietario y crónica',
  async () => {
    const database = new DatabaseService()
    const ownerId = randomUUID()
    let chronicleId = null
    let characterId = null

    await database.$connect()

    try {
      await createOwner(database, ownerId)

      const chronicle =
        await database.chronicle.create({
          data: {
            narratorId: ownerId,
            name: 'Crónica relacional SPEC-022',
          },
        })

      chronicleId = chronicle.id

      const character =
        await database.character.create({
          data: {
            ownerId,
            chronicleId,
          },
          include: {
            owner: true,
            chronicle: true,
          },
        })

      characterId = character.id

      assert.equal(
        character.owner.id,
        ownerId,
      )
      assert.equal(
        character.chronicle?.id,
        chronicleId,
      )

      await assert.rejects(
        () =>
          database.user.delete({
            where: { id: ownerId },
          }),
      )

      await assert.rejects(
        () =>
          database.chronicle.delete({
            where: { id: chronicleId },
          }),
      )
    } finally {
      if (characterId !== null) {
        await database.character.deleteMany({
          where: { id: characterId },
        })
      }

      if (chronicleId !== null) {
        await database.chronicle.deleteMany({
          where: { id: chronicleId },
        })
      }

      await database.user.deleteMany({
        where: { id: ownerId },
      })

      await database.$disconnect()
    }
  },
)

test(
  'SPEC-022 rechaza propietarios y crónicas inexistentes',
  async () => {
    const database = new DatabaseService()
    const ownerId = randomUUID()

    await database.$connect()

    try {
      await createOwner(database, ownerId)

      await assert.rejects(
        () =>
          database.character.create({
            data: {
              ownerId: randomUUID(),
            },
          }),
      )

      await assert.rejects(
        () =>
          database.character.create({
            data: {
              ownerId,
              chronicleId: randomUUID(),
            },
          }),
      )
    } finally {
      await database.user.deleteMany({
        where: { id: ownerId },
      })

      await database.$disconnect()
    }
  },
)
