import type { AdministrationBackupStatus } from '../types/backup-status.types'

export class BackupStatusApiError extends Error {
  readonly status: number
  readonly code: string
  constructor(status: number, code: string) {
    super(code)
    this.name = 'BackupStatusApiError'
    this.status = status
    this.code = code
  }
}

export function createBackupStatusGateway() {
  return {
    async status(): Promise<AdministrationBackupStatus> {
      const response = await fetch('/api/administration/backups/status', {credentials:'include'})
      if (!response.ok) {
        let code = 'BACKUP_STATUS_REQUEST_FAILED'
        try { const body = await response.json(); code = body.code ?? code } catch { /* HTTP status remains enough */ }
        throw new BackupStatusApiError(response.status, code)
      }
      return await response.json()
    },
  }
}
