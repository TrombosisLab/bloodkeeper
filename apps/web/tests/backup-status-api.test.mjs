import assert from 'node:assert/strict'
import test from 'node:test'
import { BackupStatusApiError, createBackupStatusGateway } from '../src/features/administration/infrastructure/backup-status.api.ts'

const status = {status:'ok',lastRunAt:'2026-08-12T01:00:48Z',lastSuccessfulBackupAt:'2026-08-12T01:00:02Z',archiveName:'bloodkeeper_full_20260812T010002Z.tar.gz',sizeBytes:16404235,integrity:'ok',error:null}

test('042-A consulta estado con sesión administrativa', async () => {
  globalThis.fetch = async (url, init) => { assert.equal(url,'/api/administration/backups/status'); assert.equal(init.credentials,'include'); return Response.json(status) }
  assert.deepEqual(await createBackupStatusGateway().status(), status)
})

test('042-A conserva estado y código de error', async () => {
  globalThis.fetch = async () => Response.json({code:'BACKUP_STATUS_PERMISSION_DENIED'},{status:403})
  await assert.rejects(() => createBackupStatusGateway().status(), (error) => error instanceof BackupStatusApiError && error.status === 403 && error.code === 'BACKUP_STATUS_PERMISSION_DENIED')
})
