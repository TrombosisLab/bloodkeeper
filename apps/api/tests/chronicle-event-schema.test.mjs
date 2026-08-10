import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
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
    '../prisma/migrations/20260810174500_add_chronicle_event_entity/migration.sql',
    import.meta.url,
  ),
  'utf8',
)

function block(
  source,
  startPattern,
) {
  const match =
    startPattern.exec(source)

  assert.ok(
    match,
    `No se encontró ${startPattern}`,
  )

  const start =
    match.index
  const opening =
    source.indexOf('{', start)

  assert.notEqual(
    opening,
    -1,
  )

  let depth = 0

  for (
    let index = opening;
    index < source.length;
    index += 1
  ) {
    if (source[index] === '{') {
      depth += 1
    }

    if (source[index] === '}') {
      depth -= 1

      if (depth === 0) {
        return source.slice(
          start,
          index + 1,
        )
      }
    }
  }

  assert.fail(
    `Bloque sin cierre: ${startPattern}`,
  )
}

test(
  '034-A ChronicleEvent pertenece explícitamente a Chronicle',
  () => {
    const chronicle =
      block(
        schema,
        /model Chronicle\s*\{/,
      )

    const event =
      block(
        schema,
        /model ChronicleEvent\s*\{/,
      )

    assert.match(
      chronicle,
      /events\s+ChronicleEvent\[\][\s\S]*ChronicleEventChronicle/,
    )

    assert.match(
      event,
      /chronicleId\s+String[\s\S]*@db\.Uuid/,
    )

    assert.match(
      event,
      /chronicle\s+Chronicle[\s\S]*ChronicleEventChronicle/,
    )
  },
)

test(
  '034-A conserva tiempo narrativo flexible y fecha real opcional',
  () => {
    const event =
      block(
        schema,
        /model ChronicleEvent\s*\{/,
      )

    assert.match(
      event,
      /narrativeTimeLabel\s+String\?/,
    )

    assert.match(
      event,
      /realDate\s+DateTime\?[\s\S]*@db\.Timestamptz\(3\)/,
    )

    assert.doesNotMatch(
      event,
      /EXACT|PARTIAL|RELATIVE|TEXT/,
    )
  },
)

test(
  '034-A timelineOrder hace reproducible el orden sin depender de fechas',
  () => {
    const event =
      block(
        schema,
        /model ChronicleEvent\s*\{/,
      )

    assert.match(
      event,
      /timelineOrder\s+Int/,
    )

    assert.match(
      event,
      /@@index\(\[chronicleId,\s*timelineOrder\]\)/,
    )

    assert.doesNotMatch(
      event,
      /@@unique\(\[chronicleId,\s*timelineOrder\]\)/,
    )
  },
)

test(
  '034-A usa sólo ACTIVE y ARCHIVED en primera versión',
  () => {
    const status =
      block(
        schema,
        /enum ChronicleEventStatus\s*\{/,
      )

    assert.match(
      status,
      /\bACTIVE\b/,
    )

    assert.match(
      status,
      /\bARCHIVED\b/,
    )

    assert.doesNotMatch(
      status,
      /PLANNED|OCCURRED|PLANIFICADO|OCURRIDO/,
    )
  },
)

test(
  '034-A incluye campos narrativos e información reservada sin sharing prematuro',
  () => {
    const event =
      block(
        schema,
        /model ChronicleEvent\s*\{/,
      )

    for (const field of [
      'title',
      'description',
      'narratorNotes',
      'createdAt',
      'updatedAt',
    ]) {
      assert.match(
        event,
        new RegExp(`\\b${field}\\b`),
      )
    }

    assert.doesNotMatch(
      event,
      /shared|visibility|playerVisible|public/,
    )
  },
)

test(
  '034-A migración es aditiva y protege título y pertenencia',
  () => {
    assert.match(
      migration,
      /CREATE TYPE "ChronicleEventStatus"/,
    )

    assert.match(
      migration,
      /CREATE TABLE "chronicle_events"/,
    )

    assert.match(
      migration,
      /chronicle_events_title_not_blank/,
    )

    assert.match(
      migration,
      /CHECK \(length\(btrim\("title"\)\) > 0\)/,
    )

    assert.match(
      migration,
      /chronicle_events_chronicleId_fkey/,
    )

    assert.match(
      migration,
      /REFERENCES "chronicles"\("id"\)[\s\S]*ON DELETE RESTRICT[\s\S]*ON UPDATE CASCADE/,
    )
  },
)

test(
  '034-A crea índices mínimos de estado orden y fecha real',
  () => {
    for (const index of [
      'chronicle_events_chronicleId_status_idx',
      'chronicle_events_chronicleId_timelineOrder_idx',
      'chronicle_events_chronicleId_realDate_idx',
    ]) {
      assert.match(
        migration,
        new RegExp(index),
      )
    }
  },
)

test(
  '034-A no adelanta relaciones con recursos ni SPEC-035',
  () => {
    const event =
      block(
        schema,
        /model ChronicleEvent\s*\{/,
      )

    assert.doesNotMatch(
      event,
      /characterId|npcId|locationId|sessionId/i,
    )

    assert.doesNotMatch(
      migration,
      /characters|chronicle_npcs|chronicle_locations|chronicle_sessions/i,
    )
  },
)
