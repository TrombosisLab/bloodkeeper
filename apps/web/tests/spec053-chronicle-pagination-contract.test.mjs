import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

const gateway = await readFile(
  new URL(
    '../src/features/chronicles/' +
      'infrastructure/chronicle.api.ts',
    import.meta.url,
  ),
  'utf8',
)

const list = await readFile(
  new URL(
    '../src/features/chronicles/components/' +
      'ChronicleListCreate.tsx',
    import.meta.url,
  ),
  'utf8',
)

const dashboard = await readFile(
  new URL(
    '../src/features/dashboard/components/' +
      'Dashboard.tsx',
    import.meta.url,
  ),
  'utf8',
)

test(
  'SPEC-053-C1 gateway ofrece página Chronicle',
  () => {
    assert.match(
      gateway,
      /async listPage\(query = \{\}\)/,
    )
    assert.match(
      gateway,
      /\/api\/chronicles\?limit=/,
    )
    assert.match(
      gateway,
      /parseChronicleApiPageResponse/,
    )
  },
)

test(
  'SPEC-053-C1 listado principal carga 25 y añade páginas',
  () => {
    assert.match(
      list,
      /gateway\.listPage\(\{/,
    )
    assert.match(
      list,
      /limit: 25/,
    )
    assert.match(
      list,
      /chroniclesNextOffset/,
    )
    assert.match(
      list,
      /\.\.\.current,[\s\S]*\.\.\.page\.items/,
    )
    assert.match(
      list,
      /Cargar más crónicas/,
    )
  },
)

test('SPEC-053-C1 Dashboard usa el contexto vigente sin limite artificial', () => {
  assert.equal(dashboard.includes('/api/dashboard/context?'), true)
  assert.match(dashboard, /data.chronicles.map/)
  assert.doesNotMatch(dashboard, /gateway.listPage|limit:s*3/)
})
