import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const hub = await readFile(
  new URL(
    '../src/features/administration/components/AdministrationHub.tsx',
    import.meta.url,
  ),
  'utf8',
)

const gateway = await readFile(
  new URL(
    '../src/features/administration/infrastructure/system-operations.api.ts',
    import.meta.url,
  ),
  'utf8',
)

test(
  '041-A integra diagnóstico en la tarjeta administrativa existente',
  () => {
    assert.match(
      hub,
      /Operaciones del sistema/,
    )
    assert.match(hub, /PostgreSQL/)
    assert.match(hub, /Versión/)
    assert.match(hub, /scripts SSH existentes/)
    assert.match(
      gateway,
      /\/api\/administration\/system\/diagnostics/,
    )
  },
)

test(
  '041-A no incorpora control del host ni terminal web',
  () => {
    assert.doesNotMatch(
      `${hub}\n${gateway}`,
      /docker compose|\/var\/run\/docker\.sock|terminal|privileged|child_process|spawn\(|shell/i,
    )
  },
)
