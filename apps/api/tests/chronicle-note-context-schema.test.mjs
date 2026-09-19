import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const apiRoot = process.cwd()

test('El destino contextual de notas conserva UUID en Prisma y PostgreSQL', () => {
  const schema = fs.readFileSync(
    path.join(apiRoot, 'prisma/schema.prisma'),
    'utf8',
  )
  const migration = fs.readFileSync(
    path.join(
      apiRoot,
      'prisma/migrations/20260918222000_add_chronicle_note_context_location/migration.sql',
    ),
    'utf8',
  )

  assert.match(schema, /contextLocationId\s+String\?\s+@db\.Uuid/)
  assert.match(
    migration,
    /ADD COLUMN "contextLocationId" UUID/i,
  )
})
