export type BackupExecutionStatus = 'ok' | 'error' | 'unknown'
export type BackupIntegrityStatus = 'ok' | 'failed' | 'unknown'

export interface AdministrationBackupStatus {
  readonly status: BackupExecutionStatus
  readonly lastRunAt: string | null
  readonly lastSuccessfulBackupAt: string | null
  readonly archiveName: string | null
  readonly sizeBytes: number
  readonly integrity: BackupIntegrityStatus
  readonly error: string | null
}
