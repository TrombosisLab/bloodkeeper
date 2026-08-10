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
    '../prisma/migrations/20260810165000_add_chronicle_location_entity/migration.sql',
    import.meta.url,
  ),
  'utf8',
)

function block(
  source,
  startPattern,
  endPattern,
) {
  const start =
    source.search(startPattern)

  assert.notEqual(
    start,
    -1,
    `No se encontró ${startPattern}`,
  )

  const rest =
    source.slice(start)

  const endMatch =
    rest.slice(1).search(endPattern)

  if (endMatch === -1) {
    return rest
  }

  return rest.slice(
    0,
    endMatch + 1,
  )
}

const chronicle = block(
  schema,
  /model Chronicle\s*\{/,
  /\n}\n/,
)

const location = block(
  schema,
  /model ChronicleLocation\s*\{/,
  /\n}\n/,
)

const status = block(
  schema,
  /enum ChronicleLocationStatus\s*\{/,
  /\n}\n/,
)

test(
  '033-A modela Localización como recurso explícito de Crónica',
  () => {
    assert.match(
      chronicle,
      /locations\s+ChronicleLocation\[\]\s+@relation\("ChronicleLocationChronicle"\)/,
    )

    assert.match(
      location,
      /id\s+String\s+@id\s+@default\(uuid\(\)\)\s+@db\.Uuid/,
    )

    assert.match(
      location,
      /chronicleId\s+String\s+@db\.Uuid/,
    )

    assert.match(
      location,
      /name\s+String/,
    )

    assert.match(
      location,
      /category\s+String\?/,
    )

    assert.match(
      location,
      /description\s+String\?/,
    )

    assert.match(
      location,
      /narratorNotes\s+String\?/,
    )

    assert.match(
      location,
      /createdAt\s+DateTime/,
    )

    assert.match(
      location,
      /updatedAt\s+DateTime/,
    )
  },
)

test(
  '033-A persiste jerarquía opcional simple sin profundidad fija',
  () => {
    assert.match(
      location,
      /parentLocationId\s+String\?\s+@db\.Uuid/,
    )

    assert.match(
      location,
      /parentLocation\s+ChronicleLocation\?\s+@relation\("ChronicleLocationHierarchy"/,
    )

    assert.match(
      location,
      /childLocations\s+ChronicleLocation\[\]\s+@relation\("ChronicleLocationHierarchy"\)/,
    )

    assert.match(
      location,
      /@@index\(\[chronicleId, parentLocationId\]\)/,
    )

    assert.doesNotMatch(
      location,
      /depth|level|path|ltree/i,
    )
  },
)

test(
  '033-A mantiene sólo Active y Archived como estados técnicos operativos',
  () => {
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
      /\bINACTIVE\b/,
    )

    assert.match(
      location,
      /status\s+ChronicleLocationStatus\s+@default\(ACTIVE\)/,
    )
  },
)

test(
  '033-A primera versión conserva notas reservadas sin inventar sharing prematuro',
  () => {
    assert.match(
      location,
      /narratorNotes\s+String\?/,
    )

    assert.doesNotMatch(
      location,
      /visibility|public|shared|player/i,
    )
  },
)

test(
  '033-A migración es aditiva y protege pertenencia jerarquía y nombre',
  () => {
    assert.match(
      migration,
      /CREATE TYPE "ChronicleLocationStatus"/,
    )

    assert.match(
      migration,
      /CREATE TABLE "chronicle_locations"/,
    )

    assert.match(
      migration,
      /CHECK \(length\(btrim\("name"\)\) > 0\)/,
    )

    assert.match(
      migration,
      /FOREIGN KEY \("chronicleId"\)[\s\S]*REFERENCES "chronicles"\("id"\)[\s\S]*ON DELETE RESTRICT/,
    )

    assert.match(
      migration,
      /FOREIGN KEY \("parentLocationId"\)[\s\S]*REFERENCES "chronicle_locations"\("id"\)[\s\S]*ON DELETE RESTRICT/,
    )
  },
)

test(
  '033-A no adelanta relaciones de recursos ni complejidad cartográfica',
  () => {
    assert.doesNotMatch(
      location,
      /npcId|characterId|eventId|sessionId/i,
    )

    assert.doesNotMatch(
      location,
      /latitude|longitude|coordinate|geometry|geography|mapImage|imageUrl|gis/i,
    )

    assert.doesNotMatch(
      schema,
      /enum ChronicleLocationCategory/,
    )
  },
)
