import assert from 'node:assert/strict'
import {
  readFileSync,
} from 'node:fs'
import test from 'node:test'

const schema = readFileSync(
  new URL('../prisma/schema.prisma', import.meta.url),
  'utf8',
)

const migration = readFileSync(
  new URL(
    '../prisma/migrations/20260810194000_add_chronicle_session_entity/migration.sql',
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

test(
  '035-A modela la Sesion de Cronica con estados y campos narrativos',
  () => {
    const status = block(
      schema,
      /enum ChronicleSessionStatus\s*\{/,
    )
    const session = block(
      schema,
      /model ChronicleSession\s*\{/,
    )

    for (const value of [
      'PREPARATION',
      'COMPLETED',
      'ARCHIVED',
    ]) {
      assert.match(status, new RegExp('\\b' + value + '\\b'))
    }
    assert.match(session, /sessionNumber\s+Int\?/)
    assert.match(session, /title\s+String\?/)
    assert.match(session, /realDate\s+DateTime\?\s+@db\.Timestamptz\(3\)/)
    assert.match(session, /status\s+ChronicleSessionStatus\s+@default\(PREPARATION\)/)
    assert.match(session, /summary\s+String\?/)
    assert.match(session, /narratorNotes\s+String\?/)
    assert.match(session, /chronicle Chronicle @relation\("ChronicleSessionChronicle"/)
    assert.match(session, /@@map\("chronicle_sessions"\)/)
    assert.doesNotMatch(
      session,
      /^\s*(?:events?|characters?|npcs?|locations?|dice)\s+/im,
    )
  },
)

test(
  '035-A crea migracion aditiva con pertenencia e indices',
  () => {
    assert.match(migration, /CREATE TYPE "ChronicleSessionStatus"/)
    assert.match(migration, /CREATE TABLE "chronicle_sessions"/)
    assert.match(migration, /"sessionNumber" INTEGER/)
    assert.match(migration, /"status" "ChronicleSessionStatus" NOT NULL DEFAULT 'PREPARATION'/)
    assert.match(migration, /chronicle_sessions_chronicleId_status_idx/)
    assert.match(migration, /chronicle_sessions_chronicleId_sessionNumber_idx/)
    assert.match(migration, /chronicle_sessions_chronicleId_realDate_idx/)
    assert.match(migration, /REFERENCES "chronicles"\("id"\)/)
    assert.doesNotMatch(migration, /chronicle_events|chronicle_npcs|chronicle_locations|dice/i)
  },
)
