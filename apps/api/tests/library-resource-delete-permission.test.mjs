import assert from 'node:assert/strict'
import test from 'node:test'
import 'reflect-metadata'
import { LibraryResourceController } from '../dist/chronicles/presentation/library-resource.controller.js'

const ownerId = '10000000-0000-4000-8000-000000000001'
const attackerId = '10000000-0000-4000-8000-000000000002'
const resourceId = '20000000-0000-4000-8000-000000000001'

const request = (userId) => ({ user: { id: userId } })
const hasStatus = (expected) => (error) => {
  assert.equal(error.getStatus(), expected)
  return true
}

test('legacy resource deletion checks ownership before removing bindings', async () => {
  const calls = []
  const transaction = {
    libraryResource: {
      async findFirst(input) {
        calls.push(['findFirst', input])
        return null
      },
      async deleteMany() {
        throw new Error('resource deletion must not be reached')
      },
    },
    chronicleResourceBinding: {
      async deleteMany() {
        throw new Error('bindings must not be removed')
      },
    },
  }
  const db = {
    async $transaction(callback) {
      return callback(transaction)
    },
  }
  const controller = new LibraryResourceController(db, {})

  await assert.rejects(
    controller.remove(request(attackerId), resourceId),
    hasStatus(404),
  )
  assert.deepEqual(calls, [[
    'findFirst',
    {
      where: { id: resourceId, ownerId: attackerId, status: 'archived' },
      select: { id: true },
    },
  ]])
})

test('legacy resource deletion removes bindings and the owned archived resource atomically', async () => {
  const calls = []
  const transaction = {
    libraryResource: {
      async findFirst(input) {
        calls.push(['findFirst', input])
        return { id: resourceId }
      },
      async deleteMany(input) {
        calls.push(['deleteResource', input])
        return { count: 1 }
      },
    },
    chronicleResourceBinding: {
      async deleteMany(input) {
        calls.push(['deleteBindings', input])
        return { count: 1 }
      },
    },
  }
  let transactionCalls = 0
  const db = {
    async $transaction(callback) {
      transactionCalls += 1
      return callback(transaction)
    },
  }
  const controller = new LibraryResourceController(db, {})

  assert.deepEqual(
    await controller.remove(request(ownerId), resourceId),
    { deleted: true },
  )
  assert.equal(transactionCalls, 1)
  assert.deepEqual(calls.map(([name]) => name), [
    'findFirst',
    'deleteBindings',
    'deleteResource',
  ])
  assert.deepEqual(calls[2][1], {
    where: { id: resourceId, ownerId, status: 'archived' },
  })
})
