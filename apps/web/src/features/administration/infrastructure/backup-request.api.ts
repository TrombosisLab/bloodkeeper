export class BackupRequestApiError extends Error {
  readonly status: number
  readonly code: string
  constructor(status: number, code: string) {
    super(code)
    this.name = 'BackupRequestApiError'
    this.status = status
    this.code = code
  }
}

export function createBackupRequestGateway() {
  return {
    async create(): Promise<{ readonly status: 'accepted' }> {
      const response = await fetch('/api/administration/backups/requests', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      })
      if (!response.ok) {
        let code = 'BACKUP_REQUEST_FAILED'
        try {
          const body = await response.json()
          code = body.code ?? code
        } catch {
          // HTTP status is enough.
        }
        throw new BackupRequestApiError(response.status, code)
      }
      return await response.json()
    },
  }
}
