import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const schemaUrl = new URL(
  '../prisma/schema.prisma',
  import.meta.url,
)

const migrationUrl = new URL(
  '../prisma/migrations/20260802193000_init_character_persistence/migration.sql',
  import.meta.url,
)

const baselineUrl = new URL(
  '../prisma/migrations/20260802190000_baseline_milestone_validation/migration.sql',
  import.meta.url,
)

const schema = await readFile(schemaUrl, 'utf8')
const migration = await readFile(
  migrationUrl,
  'utf8',
)
const baseline = await readFile(
  baselineUrl,
  'utf8',
)

test(
  '004-B conserva la tabla de infraestructura en la línea base',
  () => {
    assert.match(
      schema,
      /model MilestoneValidation\s*{[\s\S]*@@map\("milestone_validation"\)[\s\S]*}/,
    )
    assert.match(
      baseline,
      /CREATE TABLE "milestone_validation"/,
    )
    assert.doesNotMatch(
      baseline,
      /DROP TABLE|DELETE FROM|INSERT INTO/,
    )
  },
)

test(
  '004-B modela el ciclo de vida sin eliminación física implícita',
  () => {
    assert.match(
      schema,
      /enum CharacterStatus\s*{[\s\S]*DRAFT[\s\S]*ACTIVE[\s\S]*ARCHIVED[\s\S]*}/,
    )
    assert.match(
      schema,
      /status\s+CharacterStatus\s+@default\(DRAFT\)/,
    )
  },
)

test(
  '004-B conserva identidad, propietario y asociación opcional a crónica',
  () => {
    assert.match(schema, /model Character\s*{/)
    assert.match(schema, /id\s+String\s+@id/)
    assert.match(schema, /ownerId\s+String\s+@db\.Uuid/)
    assert.match(
      schema,
      /chronicleId\s+String\?\s+@db\.Uuid/,
    )
    assert.match(
      schema,
      /identity\s+CharacterIdentity\?/,
    )
  },
)

test(
  '004-B separa identidad y progreso en relaciones uno a uno',
  () => {
    assert.match(
      schema,
      /characterId\s+String\s+@unique\s+@db\.Uuid/,
    )
    assert.match(
      schema,
      /characterId\s+String\s+@id\s+@db\.Uuid/,
    )
    assert.match(
      schema,
      /currentStep\s+CharacterCreationStep/,
    )
    assert.match(schema, /schemaVersion\s+Int/)
    assert.match(schema, /revision\s+Int/)
  },
)

test(
  '004-B aporta una migración PostgreSQL versionada e íntegra',
  () => {
    assert.match(
      migration,
      /CREATE TABLE "characters"/,
    )
    assert.match(
      migration,
      /CREATE TABLE "character_identities"/,
    )
    assert.match(
      migration,
      /CREATE TABLE "character_creation_states"/,
    )
    assert.equal(
      (
        migration.match(
          /ON DELETE CASCADE ON UPDATE CASCADE/g,
        ) ?? []
      ).length,
      2,
    )
    assert.match(
      migration,
      /CHECK \("revision" > 0\)/,
    )
    assert.match(
      migration,
      /CHECK \("schemaVersion" > 0\)/,
    )
  },
)
