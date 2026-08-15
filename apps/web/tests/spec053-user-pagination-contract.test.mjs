import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

const hub = await readFile(
  new URL(
    '../src/features/administration/' +
      'components/AdministrationHub.tsx',
    import.meta.url,
  ),
  'utf8',
)

const gateway = await readFile(
  new URL(
    '../src/features/administration/' +
      'infrastructure/user-administration.api.ts',
    import.meta.url,
  ),
  'utf8',
)

test(
  'SPEC-053-A Administración consume páginas de 25 usuarios',
  () => {
    assert.match(
      gateway,
      /limit=query\.limit \?\? 25/,
    )
    assert.match(
      gateway,
      /offset=query\.offset \?\? 0/,
    )
    assert.match(
      gateway,
      /\/api\/users\?limit=/,
    )
  },
)

test(
  'SPEC-053-A permite cargar la siguiente página sin reemplazar la actual',
  () => {
    assert.match(
      hub,
      /usersNextOffset/,
    )
    assert.match(
      hub,
      /limit: 25/,
    )
    assert.match(
      hub,
      /\.\.\.current,[\s\S]*\.\.\.page\.items/,
    )
    assert.match(
      hub,
      /Cargar más usuarios/,
    )
  },
)
