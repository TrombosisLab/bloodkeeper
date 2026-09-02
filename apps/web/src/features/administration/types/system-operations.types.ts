export type SystemDiagnosticState =
  | 'ok'
  | 'unavailable'

export interface SystemOperationsDiagnostics {
  readonly status: 'ok' | 'degraded'
  readonly application: string
  readonly version: string
  readonly services: {
    readonly api: 'ok'
    readonly database: SystemDiagnosticState
  }
  readonly hostMaintenance: 'ssh-only'
  readonly timestamp: string
}

export interface SystemStorageUsage {
  readonly totalBytes: number
  readonly databaseBytes: number
  readonly portraitBytes: number
  readonly portraitCount: number
  readonly backupBytes: number
  readonly backupFiles: number
  readonly scope: 'managed-persistent-data'
  readonly measuredAt: string
}
