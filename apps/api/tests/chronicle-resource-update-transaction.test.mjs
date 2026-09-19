import assert from 'node:assert/strict'
import test from 'node:test'
import 'reflect-metadata'
import { ChronicleResourceController } from '../dist/chronicles/presentation/chronicle-resource.controller.js'

const ownerId = '10000000-0000-4000-8000-000000000001'
const chronicleId = '20000000-0000-4000-8000-000000000001'
const resourceId = '30000000-0000-4000-8000-000000000001'
const timestamp = new Date('2026-09-19T10:00:00.000Z')

const request = { user: { id: ownerId } }
const binding = {
  chronicleId,
  resourceId,
  status: 'attached',
  visibility: 'narrator_only',
}
const resource = {
  id: resourceId,
  kind: 'DOCUMENT',
  name: 'Documento inicial',
  summary: null,
  narratorNotes: null,
  metadata: null,
  status: 'active',
  createdAt: timestamp,
  updatedAt: timestamp,
}

test('chronicle resource update changes global data and binding in one transaction', async () => {
  const calls = []
  let currentResource = resource
  let currentBinding = binding
  const current = () => ({ ...currentResource, bindings: [currentBinding] })
  const transaction = {
    libraryResource: {
      async update(input) {
        calls.push(['resource', input])
        currentResource = { ...currentResource, name: input.data.name }
        return currentResource
      },
    },
    chronicleResourceBinding: {
      async update(input) {
        calls.push(['binding', input])
        currentBinding = { ...currentBinding, visibility: input.data.visibility }
        return currentBinding
      },
    },
  }
  const database = {
    libraryResource: {
      async findFirst() {
        return current()
      },
    },
    async $transaction(callback) {
      calls.push(['transaction'])
      return callback(transaction)
    },
  }
  const participants = {
    async findActiveMembership() {
      return { role: 'narrator' }
    },
  }
  const controller = new ChronicleResourceController(database, participants)

  const result = await controller.update(
    request,
    chronicleId,
    resourceId,
    { name: 'Documento actualizado', visibility: 'chronicle_participants' },
  )

  assert.equal(result.name, 'Documento actualizado')
  assert.equal(result.visibility, 'chronicle_participants')
  assert.deepEqual(calls.map(([name]) => name), [
    'transaction',
    'resource',
    'binding',
  ])
})
