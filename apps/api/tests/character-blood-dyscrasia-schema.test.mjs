import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const schemaUrl = new URL(
  '../prisma/schema.prisma',
  import.meta.url,
)

const migrationUrl = new URL(
  '../prisma/migrations/20260820210000_add_character_blood_dyscrasia_state/migration.sql',
  import.meta.url,
)

test('058-D2 schema persiste Discrasia activa y evidencia de adquisición', async () => {
  const schema =
    await readFile(schemaUrl, 'utf8')

  assert.match(
    schema,
    /enum CharacterBloodDyscrasiaKey\s*{[\s\S]*AGGRESSIVE[\s\S]*SNIFFING_GAME/,
  )
  assert.match(
    schema,
    /enum CharacterBloodDyscrasiaAcquisitionMode\s*{[\s\S]*DRAIN_AND_KILL[\s\S]*FEED_THREE_NIGHTS/,
  )
  assert.match(
    schema,
    /model CharacterBloodState\s*{[\s\S]*dyscrasiaKey\s+CharacterBloodDyscrasiaKey\?[\s\S]*dyscrasiaAcquisitionMode\s+CharacterBloodDyscrasiaAcquisitionMode\?/,
  )
  assert.match(
    schema,
    /model CharacterBloodResonanceOperation\s*{[\s\S]*dyscrasiaKey\s+CharacterBloodDyscrasiaKey\?[\s\S]*dyscrasiaAcquisitionMode\s+CharacterBloodDyscrasiaAcquisitionMode\?/,
  )
})

test('058-D2 migración es aditiva y protege Agudo + afinidad humoral', async () => {
  const migration =
    await readFile(migrationUrl, 'utf8')

  assert.match(
    migration,
    /ALTER TABLE "character_blood_states"[\s\S]*ADD COLUMN "dyscrasiaKey"/,
  )
  assert.match(
    migration,
    /ALTER TABLE "character_blood_resonance_operations"[\s\S]*ADD COLUMN "dyscrasiaKey"/,
  )
  assert.match(
    migration,
    /character_blood_states_dyscrasia_shape_check/,
  )
  assert.match(
    migration,
    /"resonanceTemperament" = 'ACUTE'/,
  )
  assert.match(
    migration,
    /"resonanceSpecialAffinityKey" IS NULL/,
  )
  assert.match(
    migration,
    /character_blood_resonance_operations_dyscrasia_shape_check/,
  )
  assert.match(
    migration,
    /"temperament" = 'ACUTE'/,
  )
})
