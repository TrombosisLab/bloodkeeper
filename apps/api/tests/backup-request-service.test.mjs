import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import {
  BackupRequestAlreadyPendingError,
  createBackupRequestFile,
} from '../dist/administration/backup-request.service.js'

test('042-B escribe sólo el marcador fijo', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'v5r-backup-request-'))
  try {
    const file = path.join(dir, 'manual-backup.request')
    await createBackupRequestFile(file)
    assert.equal(await readFile(file, 'utf8'), 'manual-backup\n')
    assert.equal((await stat(file)).mode & 0o777, 0o600)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('042-B impide duplicar una solicitud pendiente', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'v5r-backup-request-'))
  try {
    const file = path.join(dir, 'manual-backup.request')
    await createBackupRequestFile(file)
    await assert.rejects(
      createBackupRequestFile(file),
      BackupRequestAlreadyPendingError,
    )
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
