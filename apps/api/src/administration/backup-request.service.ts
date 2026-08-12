import { Injectable } from '@nestjs/common'
import { open } from 'node:fs/promises'

const BACKUP_REQUEST_FILE =
  '/run/bloodkeeper-backup-requests/manual-backup.request'
const REQUEST_CONTENT = 'manual-backup\n'

export class BackupRequestAlreadyPendingError extends Error {
  constructor() {
    super('BACKUP_REQUEST_ALREADY_PENDING')
    this.name = 'BackupRequestAlreadyPendingError'
  }
}

export class BackupRequestUnavailableError extends Error {
  constructor() {
    super('BACKUP_REQUEST_UNAVAILABLE')
    this.name = 'BackupRequestUnavailableError'
  }
}

export async function createBackupRequestFile(
  filePath: string,
): Promise<void> {
  let handle: Awaited<ReturnType<typeof open>> | undefined
  try {
    handle = await open(filePath, 'wx', 0o600)
    await handle.writeFile(REQUEST_CONTENT, 'utf8')
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'EEXIST'
    ) {
      throw new BackupRequestAlreadyPendingError()
    }
    throw new BackupRequestUnavailableError()
  } finally {
    await handle?.close()
  }
}

@Injectable()
export class BackupRequestService {
  async request(): Promise<void> {
    await createBackupRequestFile(BACKUP_REQUEST_FILE)
  }
}
