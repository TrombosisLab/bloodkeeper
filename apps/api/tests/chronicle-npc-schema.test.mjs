import assert from 'node:assert/strict'
import {
  readFileSync,
} from 'node:fs'
import test from 'node:test'

const schema = readFileSync(
  new URL(
    '../prisma/schema.prisma',
    import.meta.url,
  ),
  'utf8',
)

const migration = readFileSync(
  new URL(
    '../prisma/migrations/' +
      '20260810101500_add_chronicle_npc_entity/' +
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
  '032-A modela PNJ simple como recurso explícito de Crónica',
  () => {
    const chronicle = block(
      schema,
      /model Chronicle\s*\{/,
    )
    const npc = block(
      schema,
      /model ChronicleNpc\s*\{/,
    )

    assert.match(
      chronicle,
      /npcs\s+ChronicleNpc\[\]\s+@relation\("ChronicleNpcChronicle"\)/,
    )

    assert.match(
      npc,
      /id\s+String\s+@id\s+@default\(uuid\(\)\)\s+@db\.Uuid/,
    )
    assert.match(
      npc,
      /chronicleId\s+String\s+@db\.Uuid/,
    )
    assert.match(
      npc,
      /name\s+String/,
    )
    assert.match(
      npc,
      /category\s+String\?/,
    )
    assert.match(
      npc,
      /description\s+String\?/,
    )
    assert.match(
      npc,
      /narrativeRole\s+String\?/,
    )
    assert.match(
      npc,
      /notes\s+String\?/,
    )
    assert.match(
      npc,
      /@@map\("chronicle_npcs"\)/,
    )
  },
)

test(
  '032-A persiste sólo el nivel SIMPLE operativo',
  () => {
    const detail = block(
      schema,
      /enum ChronicleNpcDetailLevel\s*\{/,
    )
    const npc = block(
      schema,
      /model ChronicleNpc\s*\{/,
    )

    assert.match(
      detail,
      /\bSIMPLE\b/,
    )
    assert.doesNotMatch(
      detail,
      /\bDEVELOPED\b|\bFULL\b|\bCHARACTER\b/,
    )
    assert.match(
      npc,
      /detailLevel\s+ChronicleNpcDetailLevel\s+@default\(SIMPLE\)/,
    )
  },
)

test(
  '032-A implementa Active y Archived sin inventar estados adicionales',
  () => {
    const status = block(
      schema,
      /enum ChronicleNpcStatus\s*\{/,
    )
    const npc = block(
      schema,
      /model ChronicleNpc\s*\{/,
    )

    assert.match(status, /\bACTIVE\b/)
    assert.match(status, /\bARCHIVED\b/)
    assert.doesNotMatch(
      status,
      /\bINACTIVE\b/,
    )
    assert.match(
      npc,
      /status\s+ChronicleNpcStatus\s+@default\(ACTIVE\)/,
    )
  },
)

test(
  '032-A mantiene pertenencia e integridad con Crónica sin borrado destructivo',
  () => {
    const npc = block(
      schema,
      /model ChronicleNpc\s*\{/,
    )

    assert.match(
      npc,
      /@relation\("ChronicleNpcChronicle",[\s\S]*onDelete:\s*Restrict,[\s\S]*onUpdate:\s*Cascade\)/,
    )
    assert.match(
      npc,
      /@@index\(\[chronicleId, status\]\)/,
    )
    assert.match(
      npc,
      /@@index\(\[chronicleId, detailLevel\]\)/,
    )
  },
)

test(
  '032-A migración es aditiva y protege nombre no vacío',
  () => {
    assert.match(
      migration,
      /CREATE TYPE "ChronicleNpcStatus"/,
    )
    assert.match(
      migration,
      /CREATE TYPE "ChronicleNpcDetailLevel"/,
    )
    assert.match(
      migration,
      /CREATE TABLE "chronicle_npcs"/,
    )
    assert.match(
      migration,
      /CHECK \(length\(btrim\("name"\)\) > 0\)/,
    )
    assert.match(
      migration,
      /REFERENCES "chronicles"\("id"\)[\s\S]*ON DELETE RESTRICT[\s\S]*ON UPDATE CASCADE/,
    )
  },
)

test(
  '032-A no adelanta relaciones ni duplica la ficha completa',
  () => {
    const npc = block(
      schema,
      /model ChronicleNpc\s*\{/,
    )

    assert.doesNotMatch(
      npc,
      /location|event|session|characterId|attribute|skill|discipline|health|willpower/i,
    )
    assert.doesNotMatch(
      migration,
      /location|event|session|characterId|attribute|skill|discipline|health|willpower/i,
    )
  },
)
