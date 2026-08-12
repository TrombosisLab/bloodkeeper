import { Injectable } from '@nestjs/common'
import { readFile } from 'node:fs/promises'

const BACKUP_STATUS_FILE =
  '/run/bloodkeeper-backup/backup-status.json'

export type BackupExecutionStatus =
  | 'ok'
  | 'error'
  | 'unknown'

export type BackupIntegrityStatus =
  | 'ok'
  | 'failed'
  | 'unknown'

export interface BackupStatusResponse {
  readonly status: BackupExecutionStatus
  readonly lastRunAt: string | null
  readonly lastSuccessfulBackupAt: string | null
  readonly archiveName: string | null
  readonly sizeBytes: number
  readonly integrity: BackupIntegrityStatus
  readonly error: string | null
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('INVALID_BACKUP_STATUS')
  }
  return value as Record<string, unknown>
}

function nullableIsoDate(value: unknown): string | null {
  if (value === null) return null
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value) || Number.isNaN(Date.parse(value))) {
    throw new Error('INVALID_BACKUP_STATUS')
  }
  return value
}

function nullableArchiveName(value: unknown): string | null {
  if (value === null) return null
  if (typeof value !== 'string' || !/^bloodkeeper_full_\d{8}T\d{6}Z\.tar\.gz$/.test(value)) {
    throw new Error('INVALID_BACKUP_STATUS')
  }
  return value
}

function nullableError(value: unknown): string | null {
  if (value === null) return null
  if (typeof value !== 'string' || value.length === 0 || value.length > 240 || /[\r\n]/.test(value)) {
    throw new Error('INVALID_BACKUP_STATUS')
  }
  return value
}

export function parseBackupStatusDocument(raw: string): BackupStatusResponse {
  let parsed: unknown
  try { parsed = JSON.parse(raw) } catch { throw new Error('INVALID_BACKUP_STATUS') }
  const value = asRecord(parsed)
  const allowed = new Set(['status','lastRunAt','lastSuccessfulBackupAt','archiveName','sizeBytes','integrity','error'])
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) throw new Error('INVALID_BACKUP_STATUS')
  }
  if (value.status !== 'ok' && value.status !== 'error' && value.status !== 'unknown') throw new Error('INVALID_BACKUP_STATUS')
  if (value.integrity !== 'ok' && value.integrity !== 'failed' && value.integrity !== 'unknown') throw new Error('INVALID_BACKUP_STATUS')
  if (typeof value.sizeBytes !== 'number' || !Number.isSafeInteger(value.sizeBytes) || value.sizeBytes < 0) throw new Error('INVALID_BACKUP_STATUS')
  return {
    status: value.status,
    lastRunAt: nullableIsoDate(value.lastRunAt),
    lastSuccessfulBackupAt: nullableIsoDate(value.lastSuccessfulBackupAt),
    archiveName: nullableArchiveName(value.archiveName),
    sizeBytes: value.sizeBytes,
    integrity: value.integrity,
    error: nullableError(value.error),
  }
}

function unknownStatus(): BackupStatusResponse {
  return { status: 'unknown', lastRunAt: null, lastSuccessfulBackupAt: null, archiveName: null, sizeBytes: 0, integrity: 'unknown', error: null }
}

function unreadableStatus(): BackupStatusResponse {
  return { status: 'error', lastRunAt: null, lastSuccessfulBackupAt: null, archiveName: null, sizeBytes: 0, integrity: 'unknown', error: 'El estado de las copias no está disponible.' }
}

@Injectable()
export class BackupStatusService {
  async readStatus(): Promise<BackupStatusResponse> {
    try {
      const raw = await readFile(BACKUP_STATUS_FILE, 'utf8')
      return parseBackupStatusDocument(raw)
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT') return unknownStatus()
      return unreadableStatus()
    }
  }
}
