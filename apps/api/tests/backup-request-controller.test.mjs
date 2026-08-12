import assert from 'node:assert/strict'
import test from 'node:test'
import 'reflect-metadata'
import { RequestMethod } from '@nestjs/common'
import { BackupRequestController } from '../dist/administration/backup-request.controller.js'

const admin = { user: { id: '10000000-0000-4000-8000-000000000001', roles: ['admin'] } }
const hasStatus = (status) => (error) => { assert.equal(error.getStatus(), status); return true }

test('042-B publica POST requests con 202', () => {
  assert.equal(Reflect.getMetadata('path', BackupRequestController), 'administration/backups')
  const handler = BackupRequestController.prototype.request
  assert.equal(Reflect.getMetadata('path', handler), 'requests')
  assert.equal(Reflect.getMetadata('method', handler), RequestMethod.POST)
  assert.equal(Reflect.getMetadata('__httpCode__', handler), 202)
})

test('042-B exige sesión admin y confirmación exacta', async () => {
  const c = new BackupRequestController({ async request() {} })
  await assert.rejects(c.request({}, { confirm: true }), hasStatus(401))
  await assert.rejects(c.request({ user: { id: admin.user.id, roles: ['player'] } }, { confirm: true }), hasStatus(403))
  await assert.rejects(c.request(admin, { confirm: false }), hasStatus(400))
  await assert.rejects(c.request(admin, { confirm: true, command: 'x' }), hasStatus(400))
})

test('042-B acepta sólo la solicitud fija confirmada', async () => {
  let calls = 0
  const c = new BackupRequestController({ async request() { calls += 1 } })
  assert.deepEqual(await c.request(admin, { confirm: true }), { status: 'accepted' })
  assert.equal(calls, 1)
})
