import type {
  SystemOperationsDiagnostics,
  SystemStorageUsage,
} from '../types/system-operations.types'

export class SystemOperationsApiError
  extends Error {
  readonly status: number
  readonly code: string

  constructor(
    status: number,
    code: string,
  ) {
    super(code)
    this.name = 'SystemOperationsApiError'
    this.status = status
    this.code = code
  }
}

export function createSystemOperationsGateway() {
  return {
    async storage(): Promise<SystemStorageUsage> {
      const response = await fetch('/api/administration/system/storage', { credentials: 'include' })
      if (!response.ok) {
        throw new SystemOperationsApiError(response.status, 'SYSTEM_STORAGE_REQUEST_FAILED')
      }
      return await response.json()
    },

    async diagnostics(): Promise<SystemOperationsDiagnostics> {
      const response = await fetch(
        '/api/administration/system/diagnostics',
        {
          credentials: 'include',
        },
      )

      if (!response.ok) {
        let code =
          'SYSTEM_OPERATIONS_REQUEST_FAILED'

        try {
          const body = await response.json()
          code = body.code ?? code
        } catch {
          // El estado HTTP sigue siendo suficiente.
        }

        throw new SystemOperationsApiError(
          response.status,
          code,
        )
      }

      return await response.json()
    },
  }
}
