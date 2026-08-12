import assert from 'node:assert/strict'
import test from 'node:test'
import { parseBackupStatusDocument } from '../dist/administration/backup-status.service.js'

const validStatus = {
  status: 'ok',
  lastRunAt: '2026-08-12T01:00:48Z',
  lastSuccessfulBackupAt: '2026-08-12T01:00:02Z',
  archiveName: 'bloodkeeper_full_20260812T010002Z.tar.gz',
  sizeBytes: 16404235,
  integrity: 'ok',
  error: null,
}

test('042-A valida el manifiesto sanitizado de backup', () => {
  assert.deepEqual(parseBackupStatusDocument(JSON.stringify(validStatus)), validStatus)
})

test('042-A rechaza rutas absolutas y nombres de archivo ajenos', () => {
  assert.throws(() => parseBackupStatusDocument(JSON.stringify({...validStatus, archiveName:'/home/user/secret.tar.gz'})), /INVALID_BACKUP_STATUS/)
})

test('042-A rechaza campos adicionales que puedan filtrar secretos', () => {
  assert.throws(() => parseBackupStatusDocument(JSON.stringify({...validStatus, databaseUrl:'postgresql://secret'})), /INVALID_BACKUP_STATUS/)
})

test('042-A limita error a una línea sanitizada', () => {
  assert.throws(() => parseBackupStatusDocument(JSON.stringify({...validStatus, status:'error', error:'fallo\nDATABASE_URL=secret'})), /INVALID_BACKUP_STATUS/)
})
