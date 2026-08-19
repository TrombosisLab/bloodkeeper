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
    '../prisma/migrations/20260818210000_add_chronicle_session_context_relations/migration.sql',
    import.meta.url,
  ),
  'utf8',
)

function block(source, pattern) {
  const start = source.search(pattern)
  assert.notEqual(start, -1)

  const rest = source.slice(start)
  const end = rest.indexOf('\n}')

  assert.notEqual(end, -1)

  return rest.slice(0, end + 2)
}

test(
  '035-D modela tres relaciones explicitas de contexto de Sesion',
  () => {
    const session =
      block(
        schema,
        /model ChronicleSession\s*\{/,
      )

    assert.match(
      session,
      /eventLinks\s+ChronicleSessionEvent\[\]/,
    )
    assert.match(
      session,
      /npcLinks\s+ChronicleSessionNpc\[\]/,
    )
    assert.match(
      session,
      /locationLinks\s+ChronicleSessionLocation\[\]/,
    )

    for (const model of [
      'ChronicleSessionEvent',
      'ChronicleSessionNpc',
      'ChronicleSessionLocation',
    ]) {
      assert.match(
        schema,
        new RegExp(
          `model ${model}\\s*\\{`,
        ),
      )
    }
  },
)

test(
  '035-D usa pares unicos y FKs restrictivas sin copiar contenido',
  () => {
    for (const pair of [
      ['sessionId', 'eventId'],
      ['sessionId', 'npcId'],
      ['sessionId', 'locationId'],
    ]) {
      const expression =
        new RegExp(
          `@@id\\(\\[${pair[0]}, ${pair[1]}\\]\\)`,
        )

      assert.match(
        schema,
        expression,
      )
    }

    for (const table of [
      'chronicle_session_event_links',
      'chronicle_session_npc_links',
      'chronicle_session_location_links',
    ]) {
      assert.match(
        migration,
        new RegExp(
          `CREATE TABLE "${table}"`,
        ),
      )
    }

    assert.doesNotMatch(
      migration,
      /description|notes|summary|title|name/i,
    )

    assert.match(
      migration,
      /ON DELETE RESTRICT/g,
    )
  },
)
