import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const schemaUrl = new URL(
  '../prisma/schema.prisma',
  import.meta.url,
)

const migrationUrl = new URL(
  '../prisma/migrations/20260820223000_add_character_blood_dyscrasia_consumption/migration.sql',
  import.meta.url,
)

test('058-D3 schema identifica la instancia activa por operación de alimentación', async () => {
  const schema =
    await readFile(schemaUrl, 'utf8')

  assert.match(
    schema,
    /dyscrasiaSourceOperationId\s+String\?\s+@db\.Uuid/,
  )
})

test('058-D3 schema crea ledger idempotente y único por instancia fuente', async () => {
  const schema =
    await readFile(schemaUrl, 'utf8')

  assert.match(
    schema,
    /model CharacterBloodDyscrasiaConsumptionOperation\s*{/,
  )
  assert.match(
    schema,
    /@@id\(\[characterId, operationId\]\)/,
  )
  assert.match(
    schema,
    /@@unique\(\[characterId, sourceBloodOperationId\]\)/,
  )
  assert.match(
    schema,
    /@relation\("CharacterBloodDyscrasiaSource"[\s\S]*references: \[characterId, operationId\]/,
  )
})

test('058-D3 migración hace backfill compatible y FK al evento fuente', async () => {
  const migration =
    await readFile(migrationUrl, 'utf8')

  assert.match(
    migration,
    /ADD COLUMN "dyscrasiaSourceOperationId" UUID/,
  )
  assert.match(
    migration,
    /UPDATE "character_blood_states" AS state/,
  )
  assert.match(
    migration,
    /ORDER BY[\s\S]*operation\."createdAt" DESC/,
  )
  assert.match(
    migration,
    /character_blood_dyscrasia_consumption_operations_source_fkey/,
  )
  assert.match(
    migration,
    /REFERENCES "character_blood_resonance_operations"/,
  )
})
