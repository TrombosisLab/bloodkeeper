import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import test from 'node:test'

import {
  DatabaseService,
} from '../dist/database/database.service.js'

import {
  PrismaCharacterSecondaryRepository,
} from '../dist/characters/infrastructure/prisma-character-secondary.repository.js'


async function createTestOwner(
  database,
  ownerId,
) {
  await database.user.create({
    data: {
      id: ownerId,
      username: `character-test-${ownerId}`,
      displayName: 'Character integration owner',
      passwordHash: 'integration-test-only',
    },
  })
}

test(
  '028-D persiste datos secundarios con propietario y revisión optimista',
  async () => {
    const database = new DatabaseService()
    const repository =
      new PrismaCharacterSecondaryRepository(
        database,
      )
    const ownerId = randomUUID()
    const otherOwnerId = randomUUID()
    let characterId = null

    const inventoryId = randomUUID()
    const noteId = randomUUID()
    const historyId = randomUUID()

    await database.$connect()

    try {
      await createTestOwner(
        database,
        ownerId,
      )

      const character =
        await database.character.create({
          data: { ownerId },
        })

      characterId = character.id

      assert.deepEqual(
        await repository.findByCharacterId(
          ownerId,
          characterId,
        ),
        {
          characterId,
          revision: 1,
          inventory: [],
          notes: [],
          history: [],
        },
      )

      const withInventory =
        await repository.update(ownerId, {
          characterId,
          expectedRevision: 1,
          section: 'inventory',
          inventory: [
            {
              id: inventoryId,
              name: 'Llave del refugio',
              quantity: 1,
              description: null,
              category: 'Acceso',
              notes: null,
              status: 'active',
            },
          ],
        })

      assert.equal(withInventory.revision, 2)
      assert.equal(
        withInventory.inventory[0]?.id,
        inventoryId,
      )

      const withNote = await repository.update(
        ownerId,
        {
          characterId,
          expectedRevision: 2,
          section: 'notes',
          notes: [
            {
              id: noteId,
              content: 'Recordatorio persistido',
            },
          ],
        },
      )

      assert.equal(withNote.revision, 3)
      assert.equal(withNote.inventory.length, 1)
      assert.equal(withNote.notes.length, 1)

      const withHistory =
        await repository.update(ownerId, {
          characterId,
          expectedRevision: 3,
          section: 'history',
          history: [
            {
              id: historyId,
              title: 'Hito persistido',
              description:
                'Acontecimiento narrativo.',
            },
          ],
        })

      assert.equal(withHistory.revision, 4)
      assert.equal(withHistory.history.length, 1)

      const archived = await repository.update(
        ownerId,
        {
          characterId,
          expectedRevision: 4,
          section: 'inventory',
          inventory: [
            {
              ...withHistory.inventory[0],
              status: 'archived',
            },
          ],
        },
      )

      assert.equal(
        archived.inventory[0]?.status,
        'archived',
      )

      const withoutNotes =
        await repository.update(ownerId, {
          characterId,
          expectedRevision: 5,
          section: 'notes',
          notes: [],
        })

      assert.equal(withoutNotes.revision, 6)
      assert.deepEqual(withoutNotes.notes, [])
      assert.equal(withoutNotes.history.length, 1)

      assert.equal(
        await repository.findByCharacterId(
          otherOwnerId,
          characterId,
        ),
        null,
      )

      await assert.rejects(
        repository.update(otherOwnerId, {
          characterId,
          expectedRevision: 6,
          section: 'history',
          history: [],
        }),
        {
          name:
            'CharacterSecondaryWriteConflictError',
        },
      )

      await assert.rejects(
        repository.update(ownerId, {
          characterId,
          expectedRevision: 5,
          section: 'history',
          history: [],
        }),
        {
          name:
            'CharacterSecondaryWriteConflictError',
        },
      )
    } finally {
      if (characterId !== null) {
        await database.character.delete({
          where: { id: characterId },
        })
      }

      await database.user.deleteMany({
        where: { id: ownerId },
      })

      await database.$disconnect()
    }
  },
)
