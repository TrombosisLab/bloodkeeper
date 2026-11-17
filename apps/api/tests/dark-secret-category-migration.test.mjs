import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const migrationUrl = new URL('../prisma/migrations/20261117120000_fix_dark_secret_category/migration.sql', import.meta.url)

test('migration reclassifies only saved Dark Secret backgrounds as flaws', async () => {
  const migration = await readFile(migrationUrl, 'utf8')
  assert.match(migration, /UPDATE "character_advantage_selections"/)
  assert.match(migration, /SET "category" = 'FLAW'/)
  assert.match(migration, /WHERE "definitionKey" = 'dark-secret'/)
  assert.match(migration, /AND "category" <> 'FLAW'/)
  assert.doesNotMatch(migration, /SET[^;]*(?:"rating"|"origin"|"selectionId")/s)
  assert.doesNotMatch(migration, /DELETE\s+FROM/i)
})
