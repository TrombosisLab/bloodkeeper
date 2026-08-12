import assert from 'node:assert/strict'
import test, { afterEach } from 'node:test'

import {
  SystemOperationsApiError,
  createSystemOperationsGateway,
} from '../src/features/administration/infrastructure/system-operations.api.ts'

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

const diagnostics = {
  status: 'ok',
  application: 'Vampiro V5 Revolution',
  version: '0.1.0',
  services: {
    api: 'ok',
    database: 'ok',
  },
  hostMaintenance: 'ssh-only',
  timestamp: '2026-08-12T12:00:00.000Z',
}

test(
  '041-A consulta diagnóstico con la sesión administrativa',
  async () => {
    globalThis.fetch = async (url, init) => {
      assert.equal(
        url,
        '/api/administration/system/diagnostics',
      )
      assert.equal(
        init.credentials,
        'include',
      )
      assert.equal(init.method, undefined)
      return Response.json(diagnostics)
    }

    assert.deepEqual(
      await createSystemOperationsGateway()
        .diagnostics(),
      diagnostics,
    )
  },
)

test(
  '041-A conserva estado y código de errores administrativos',
  async () => {
    globalThis.fetch = async () =>
      Response.json(
        {
          code:
            'SYSTEM_OPERATIONS_PERMISSION_DENIED',
        },
        { status: 403 },
      )

    await assert.rejects(
      () =>
        createSystemOperationsGateway()
          .diagnostics(),
      (error) =>
        error instanceof
          SystemOperationsApiError &&
        error.status === 403 &&
        error.code ===
          'SYSTEM_OPERATIONS_PERMISSION_DENIED',
    )
  },
)
