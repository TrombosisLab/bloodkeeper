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
