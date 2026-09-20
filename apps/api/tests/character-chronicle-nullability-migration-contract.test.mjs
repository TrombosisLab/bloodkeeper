import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const migration = await readFile(
  new URL('../prisma/migrations/20260920110000_make_character_chronicle_optional/migration.sql', import.meta.url),
  'utf8',
)

test('la migración permite conservar personajes sin crónica', () => {
  assert.match(
    migration,
    /ALTER TABLE\s+"characters"[\s\S]*ALTER COLUMN\s+"chronicleId"\s+DROP NOT NULL\s*;/,
  )
})
