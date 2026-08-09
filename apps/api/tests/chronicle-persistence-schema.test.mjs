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
    '../prisma/migrations/' +
      '20260804193000_add_chronicle_entity/' +
      'migration.sql',
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
  '030-A modela la entidad Crónica mínima',
  () => {
    const status = block(
      schema,
      /enum ChronicleStatus\s*\{/,
    )
    const chronicle = block(
      schema,
      /model Chronicle\s*\{/,
    )

    assert.match(status, /\bPREPARATION\b/)
    assert.match(status, /\bACTIVE\b/)
    assert.match(status, /\bARCHIVED\b/)

    assert.match(
      chronicle,
      /id\s+String\s+@id\s+@default\(uuid\(\)\)\s+@db\.Uuid/,
    )
    assert.match(
      chronicle,
      /narratorId\s+String\s+@db\.Uuid/,
    )
    assert.match(chronicle, /name\s+String/)
    assert.match(
      chronicle,
      /description\s+String\?/,
    )
    assert.match(
      chronicle,
      /status\s+ChronicleStatus\s+@default\(PREPARATION\)/,
    )
    assert.match(
      chronicle,
      /createdAt\s+DateTime\s+@default\(now\(\)\)\s+@db\.Timestamptz\(3\)/,
    )
    assert.match(
      chronicle,
      /updatedAt\s+DateTime\s+@updatedAt\s+@db\.Timestamptz\(3\)/,
    )
    assert.match(
      chronicle,
      /@@index\(\[narratorId\]\)/,
    )
    assert.match(
      chronicle,
      /@@index\(\[status\]\)/,
    )
    assert.match(
      chronicle,
      /@@map\("chronicles"\)/,
    )
  },
)

test(
  '030-A incluye una migración aditiva y protege el nombre',
  () => {
    assert.match(
      migration,
      /CREATE TYPE "ChronicleStatus"/,
    )
    assert.match(
      migration,
      /CREATE TABLE "chronicles"/,
    )
    assert.match(
      migration,
      /CHECK \(length\(btrim\("name"\)\) > 0\)/,
    )
    assert.match(
      migration,
      /chronicles_narratorId_idx/,
    )
    assert.match(
      migration,
      /chronicles_status_idx/,
    )
  },
)

test(
  '030-A no adelanta participantes ni recursos propios de SPEC-031–035',
  () => {
    const chronicle = block(
      schema,
      /model Chronicle\s*\{/,
    )

    assert.doesNotMatch(
      chronicle,
      /participant|player|session|event|location|npc|pnj/i,
    )
    assert.doesNotMatch(
      migration,
      /ALTER TABLE "characters".*REFERENCES "chronicles"/s,
    )
  },
)
