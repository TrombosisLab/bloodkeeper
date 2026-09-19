import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import test from 'node:test'

import { DatabaseService } from '../dist/database/database.service.js'
import { ChronicleNotebookController } from '../dist/chronicles/presentation/chronicle-notebook.controller.js'

function requestFor(userId) {
  return { user: { id: userId } }
}

test(
  'chronicle notes persist contextual images and protect private resources',
  async () => {
    const database = new DatabaseService()
    const controller = new ChronicleNotebookController(database)
    const narratorId = randomUUID()
    const playerId = randomUUID()
    const chronicleId = randomUUID()
    const resourceId = randomUUID()

    await database.$connect()

    try {
      await database.user.createMany({
        data: [
          {
            id: narratorId,
            username: `note-integration-narrator-${narratorId}`,
            displayName: 'Note integration narrator',
            passwordHash: 'integration-test-only',
          },
          {
            id: playerId,
            username: `note-integration-player-${playerId}`,
            displayName: 'Note integration player',
            passwordHash: 'integration-test-only',
          },
        ],
      })

      await database.chronicle.create({
        data: {
          id: chronicleId,
          narratorId,
          name: 'Chronicle note integration',
        },
      })

      await database.chronicleParticipant.create({
        data: {
          chronicleId,
          userId: playerId,
          role: 'PLAYER',
          status: 'ACTIVE',
        },
      })

      await database.libraryResource.create({
        data: {
          id: resourceId,
          ownerId: narratorId,
          kind: 'document',
          name: 'Private integration document',
          summary: 'Document used by the persistence test.',
          narratorNotes: 'Narrator-only evidence.',
          metadata: { source: 'integration-test' },
        },
      })

      await database.chronicleResourceBinding.create({
        data: {
          chronicleId,
          resourceId,
          visibility: 'narrator_only',
          status: 'attached',
        },
      })

      await database.chronicleAssetImage.create({
        data: {
          assetType: 'RESOURCE',
          entityId: resourceId,
          mimeType: 'image/png',
          byteSize: 3,
          sha256: 'integration-test-image',
          data: Buffer.from([1, 2, 3]),
        },
      })

      const created = await controller.create(
        requestFor(narratorId),
        chronicleId,
        {
          title: 'Contextual image note',
          content: 'The note keeps the document as its visual context.',
          visibility: 'PRIVATE',
          references: [
            {
              targetType: 'DOCUMENT',
              targetId: resourceId,
              label: 'Private integration document',
            },
          ],
          contextImageTargetType: 'DOCUMENT',
          contextImageTargetId: resourceId,
        },
      )

      assert.equal(created.contextImageTargetType, 'DOCUMENT')
      assert.equal(created.contextImageTargetId, resourceId)
      assert.equal(created.references[0].targetId, resourceId)

      const stored = await database.chronicleNote.findUnique({
        where: { id: created.id },
        include: { references: true },
      })

      assert.ok(stored)
      assert.equal(stored.contextImageTargetType, 'DOCUMENT')
      assert.equal(stored.contextImageTargetId, resourceId)
      assert.equal(stored.references[0].targetType, 'DOCUMENT')
      assert.equal(stored.references[0].targetId, resourceId)

      const narratorNote = await controller.get(
        requestFor(narratorId),
        chronicleId,
        created.id,
      )

      assert.equal(narratorNote.contextImageTargetId, resourceId)

      const narratorPreview = await controller.resourcePreview(
        requestFor(narratorId),
        chronicleId,
        'DOCUMENT',
        resourceId,
      )

      assert.equal(narratorPreview.canViewPrivateDetails, true)
      assert.equal(narratorPreview.narratorDetails, 'Narrator-only evidence.')
      assert.match(narratorPreview.imageUrl, new RegExp(resourceId))

      await assert.rejects(
        () => controller.resourcePreview(
          requestFor(playerId),
          chronicleId,
          'DOCUMENT',
          resourceId,
        ),
        (error) => error?.getStatus?.() === 404,
      )
    } finally {
      await database.chronicleAssetImage.deleteMany({
        where: { entityId: resourceId },
      })
      await database.chronicleParticipant.deleteMany({
        where: { chronicleId },
      })
      await database.chronicle.deleteMany({
        where: { id: chronicleId },
      })
      await database.libraryResource.deleteMany({
        where: { id: resourceId },
      })
      await database.user.deleteMany({
        where: { id: { in: [narratorId, playerId] } },
      })
      await database.$disconnect()
    }
  },
)
