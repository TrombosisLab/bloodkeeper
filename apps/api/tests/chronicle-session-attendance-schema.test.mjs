import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const schema = await readFile(
  new URL(
    '../prisma/schema.prisma',
    import.meta.url,
  ),
  'utf8',
)

const migration = await readFile(
  new URL(
    '../prisma/migrations/20260818163000_add_chronicle_session_attendance/migration.sql',
    import.meta.url,
  ),
  'utf8',
)

test(
  'Attendance modela relación única Session + Character con retirada trazable',
  () => {
    assert.match(
      schema,
      /model ChronicleSessionAttendance\s*\{/,
    )
    assert.match(
      schema,
      /removedAt\s+DateTime\?/,
    )
    assert.match(
      schema,
      /@@unique\(\[sessionId, characterId\]\)/,
    )
    assert.match(
      schema,
      /@@index\(\[sessionId\]\)/,
    )
    assert.match(
      schema,
      /@@index\(\[characterId\]\)/,
    )
    assert.match(
      schema,
      /@@map\("chronicle_session_attendances"\)/,
    )
  },
)

test(
  'Attendance añade relaciones inversas sin tocar XP',
  () => {
    assert.match(
      schema,
      /attendances\s+ChronicleSessionAttendance\[\]\s+@relation\("ChronicleSessionAttendanceSession"\)/,
    )
    assert.match(
      schema,
      /sessionAttendances\s+ChronicleSessionAttendance\[\]\s+@relation\("ChronicleSessionAttendanceCharacter"\)/,
    )
  },
)

test(
  'Migración usa FKs restrictivas e índices explícitos',
  () => {
    assert.match(
      migration,
      /REFERENCES "chronicle_sessions"\("id"\)[\s\S]*ON DELETE RESTRICT/,
    )
    assert.match(
      migration,
      /REFERENCES "characters"\("id"\)[\s\S]*ON DELETE RESTRICT/,
    )
    assert.match(
      migration,
      /UNIQUE INDEX[\s\S]*\("sessionId", "characterId"\)/,
    )
    assert.match(
      migration,
      /ON "chronicle_session_attendances"\("sessionId"\)/,
    )
    assert.match(
      migration,
      /ON "chronicle_session_attendances"\("characterId"\)/,
    )
  },
)
