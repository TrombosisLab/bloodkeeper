import assert from 'node:assert/strict'
import test from 'node:test'
import 'reflect-metadata'
import { RequestMethod } from '@nestjs/common'
import { BackupStatusController } from '../dist/administration/backup-status.controller.js'

const status = { status:'ok', lastRunAt:'2026-08-12T01:00:48Z', lastSuccessfulBackupAt:'2026-08-12T01:00:02Z', archiveName:'bloodkeeper_full_20260812T010002Z.tar.gz', sizeBytes:16404235, integrity:'ok', error:null }
const adminRequest = () => ({user:{id:'10000000-0000-4000-8000-000000000001',roles:['admin']}})
const hasStatus = (expected) => (error) => { assert.equal(error.getStatus(), expected); return true }

test('042-A publica GET administrativo de estado de backups', () => {
  assert.equal(Reflect.getMetadata('path', BackupStatusController), 'administration/backups')
  const handler = BackupStatusController.prototype.status
  assert.equal(Reflect.getMetadata('path', handler), 'status')
  assert.equal(Reflect.getMetadata('method', handler), RequestMethod.GET)
})

test('042-A exige sesión y rol administrador', async () => {
  const controller = new BackupStatusController({async readStatus(){throw new Error('unexpected')}})
  await assert.rejects(controller.status({}), hasStatus(401))
  await assert.rejects(controller.status({user:{id:'10000000-0000-4000-8000-000000000001',roles:['player']}}), hasStatus(403))
})

test('042-A devuelve únicamente el estado sanitizado', async () => {
  const controller = new BackupStatusController({async readStatus(){return status}})
  assert.deepEqual(await controller.status(adminRequest()), status)
  assert.equal(JSON.stringify(status).includes('/home/trombosis'), false)
  assert.equal(JSON.stringify(status).includes('DATABASE_URL'), false)
})
