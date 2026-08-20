import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const schema = readFileSync(
  new URL('../prisma/schema.prisma', import.meta.url),
  'utf8',
)
const migration = readFileSync(
  new URL(
    '../prisma/migrations/20260811221000_add_dice_roll_history/migration.sql',
    import.meta.url,
  ),
  'utf8',
)

function block(source, startPattern) {
  const start = source.search(startPattern)
  assert.notEqual(start, -1)
  const remaining = source.slice(start)
  const end = remaining.indexOf('\n}')
  assert.notEqual(end, -1)
  return remaining.slice(0, end + 2)
}

test('039-A conserva un snapshot completo y versionado sin campos recalculados', () => {
  const record = block(schema, /model DiceRollRecord\s*\{/)

  assert.match(record, /poolSnapshot\s+Json/)
  assert.match(record, /rollSnapshot\s+Json/)
  assert.match(record, /rulesVersion\s+String/)
  assert.match(record, /source\s+DiceRollSource/)
  assert.match(record, /description\s+String\?/)
  assert.match(record, /createdAt\s+DateTime\s+@default\(now\(\)\)/)
  assert.doesNotMatch(record, /updatedAt|currentHunger|currentDifficulty/)
})

test('039-A modela contextos opcionales y rerolls sin sobrescribir originales', () => {
  const record = block(schema, /model DiceRollRecord\s*\{/)

  assert.match(record, /actorId\s+String\s+@db\.Uuid/)
  assert.match(record, /characterId\s+String\?\s+@db\.Uuid/)
  assert.match(record, /chronicleId\s+String\?\s+@db\.Uuid/)
  assert.match(record, /sessionId\s+String\?\s+@db\.Uuid/)
  assert.match(record, /rerollParentId\s+String\?\s+@db\.Uuid/)
  assert.match(record, /DiceRollActor/)
  assert.match(record, /DiceRollCharacter/)
  assert.match(record, /DiceRollChronicle/)
  assert.match(record, /DiceRollSession/)
  assert.match(record, /DiceRollRerolls/)
})

test('039-A prepara privacidad y consultas paginadas por cada contexto', () => {
  const visibility = block(schema, /enum DiceRollVisibility\s*\{/)
  const record = block(schema, /model DiceRollRecord\s*\{/)

  assert.match(visibility, /\bCONTEXTUAL\b/)
  assert.match(visibility, /\bPRIVATE\b/)
  assert.match(record, /@@index\(\[actorId, createdAt, id\]\)/)
  assert.match(record, /@@index\(\[characterId, createdAt, id\]\)/)
  assert.match(record, /@@index\(\[chronicleId, visibility, createdAt, id\]\)/)
  assert.match(record, /@@index\(\[sessionId, createdAt, id\]\)/)
  assert.match(record, /@@index\(\[rerollParentId\]\)/)
})

test('039-A impone inmutabilidad y coherencia contextual en PostgreSQL', () => {
  assert.match(migration, /CREATE TABLE "dice_roll_records"/)
  assert.match(migration, /"poolSnapshot" JSONB NOT NULL/)
  assert.match(migration, /"rollSnapshot" JSONB NOT NULL/)
  assert.match(migration, /dice_roll_records_snapshot_objects_check/)
  assert.match(migration, /validate_dice_roll_context/)
  assert.match(migration, /Dice roll session does not belong to chronicle/)
  assert.match(migration, /Dice roll character does not belong to chronicle/)
  assert.match(migration, /reject_dice_roll_record_mutation/)
  assert.match(migration, /BEFORE UPDATE OR DELETE/)
  assert.match(migration, /REFERENCES "users"\("id"\)/)
  assert.match(migration, /REFERENCES "characters"\("id"\)/)
  assert.match(migration, /REFERENCES "chronicles"\("id"\)/)
  assert.match(migration, /REFERENCES "chronicle_sessions"\("id"\)/)
  assert.match(migration, /REFERENCES "dice_roll_records"\("id"\)/)
})

test('039-A no adelanta repositorio API ni interfaz de historial', () => {
  const diceRollRecordModel =
    schema.match(
      /model DiceRollRecord\s*\{[\s\S]*?\n\}/,
    )?.[0]

  assert.ok(diceRollRecordModel)

  assert.doesNotMatch(
    diceRollRecordModel,
    /operationId|analytics|exportedAt|purgedAt/i,
  )
  assert.doesNotMatch(migration, /INSERT\s+INTO\s+"dice_roll_records"/i)
})
