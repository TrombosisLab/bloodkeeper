import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const catalog = JSON.parse(
  readFileSync(
    new URL('../../../packages/character-rules/catalogs/predator-types.json', import.meta.url),
    'utf8',
  ),
)

function collectDarkSecretGrants(value, grants = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectDarkSecretGrants(item, grants)
    return grants
  }

  if (!value || typeof value !== 'object') return grants
  if (value.definitionKey === 'dark-secret') grants.push(value)
  for (const child of Object.values(value)) collectDarkSecretGrants(child, grants)
  return grants
}

test('all predator grants classify Dark Secret as a flaw', () => {
  const grants = collectDarkSecretGrants(catalog)

  assert.equal(grants.length, 3, 'expected to cover every Dark Secret predator grant')
  assert.deepEqual(grants.map(grant => grant.category), ['flaw', 'flaw', 'flaw'])
})
