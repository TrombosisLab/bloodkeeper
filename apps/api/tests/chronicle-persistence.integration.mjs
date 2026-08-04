import assert from 'node:assert/strict'
import {
  randomUUID,
} from 'node:crypto'
import test from 'node:test'

import {
  PrismaClient,
} from '@prisma/client'

test(
  '030-A persiste la entidad Crónica mínima',
  async () => {
    const database = new PrismaClient()
    const id = randomUUID()
    const narratorId = randomUUID()

    try {
      const created =
        await database.chronicle.create({
          data: {
            id,
            narratorId,
            name: 'Noches de A Coruña',
            description:
              'Crónica de prueba del primer incremento.',
          },
        })

      assert.equal(created.id, id)
      assert.equal(created.narratorId, narratorId)
      assert.equal(created.status, 'PREPARATION')
      assert.equal(
        created.name,
        'Noches de A Coruña',
      )
      assert.ok(created.createdAt instanceof Date)
      assert.ok(created.updatedAt instanceof Date)

      await assert.rejects(
        database.chronicle.create({
          data: {
            narratorId,
            name: '   ',
          },
        }),
      )
    } finally {
      await database.chronicle.deleteMany({
        where: { narratorId },
      })
      await database.$disconnect()
    }
  },
)
