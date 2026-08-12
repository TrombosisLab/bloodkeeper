import assert from 'node:assert/strict'
import test from 'node:test'
import {
  BackupRequestApiError,
  createBackupRequestGateway,
} from '../src/features/administration/infrastructure/backup-request.api.ts'

test('042-B solicita sólo la operación confirmada', async () => {
  globalThis.fetch = async (url, init) => {
    assert.equal(url, '/api/administration/backups/requests')
    assert.equal(init.method, 'POST')
    assert.equal(init.credentials, 'include')
    assert.deepEqual(JSON.parse(init.body), { confirm: true })
    return Response.json({ status: 'accepted' }, { status: 202 })
  }
  assert.deepEqual(await createBackupRequestGateway().create(), { status: 'accepted' })
})

test('042-B conserva error de solicitud rechazada', async () => {
  globalThis.fetch = async () => Response.json(
    { code: 'BACKUP_REQUEST_ALREADY_PENDING' },
    { status: 409 },
  )
  await assert.rejects(
    () => createBackupRequestGateway().create(),
    (error) => error instanceof BackupRequestApiError && error.status === 409 && error.code === 'BACKUP_REQUEST_ALREADY_PENDING',
  )
})
