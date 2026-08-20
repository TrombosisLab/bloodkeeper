import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const schemaUrl = new URL(
  '../prisma/schema.prisma',
  import.meta.url,
)
const migrationUrl = new URL(
  '../prisma/migrations/20260820180000_add_character_blood_resonance_state/migration.sql',
  import.meta.url,
)

test('058-B schema añade estado activo nullable y ledger idempotente', async () => {
  const schema =
    await readFile(schemaUrl, 'utf8')

  assert.match(
    schema,
    /model CharacterBloodState\s*{[\s\S]*resonanceSourceKind\s+CharacterBloodSourceKind\?[\s\S]*resonanceKey\s+CharacterBloodResonanceKey\?[\s\S]*resonanceTemperament\s+CharacterBloodTemperament\?[\s\S]*resonanceSpecialAffinityKey\s+CharacterBloodSpecialAffinityKey\?/,
  )
  assert.match(
    schema,
    /model CharacterBloodResonanceOperation\s*{[\s\S]*@@id\(\[characterId, operationId\]\)/,
  )
})

test('058-B migración es aditiva y protege forma/hambre', async () => {
  const migration =
    await readFile(migrationUrl, 'utf8')

  assert.match(
    migration,
    /ALTER TABLE "character_blood_states"[\s\S]*ADD COLUMN "resonanceSourceKind"/,
  )
  assert.match(
    migration,
    /character_blood_states_resonance_shape_check/,
  )
  assert.match(
    migration,
    /"hungerBefore" - "hungerAfter" = "hungerSlaked"/,
  )
  assert.match(
    migration,
    /ON DELETE CASCADE/,
  )
})
