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

test(
  'SPEC-021 persiste la categoría etaria sin derivarla de Generación',
  async () => {
    const ageMigration =
      await readFile(
        new URL(
          '../prisma/migrations/20260808153000_add_character_age_category/migration.sql',
          import.meta.url,
        ),
        'utf8',
      )

    assert.match(
      schema,
      /enum CharacterAgeCategory\s*{[\s\S]*FLEDGLING[\s\S]*NEONATE[\s\S]*ANCILLA[\s\S]*ELDER[\s\S]*}/,
    )

    assert.match(
      schema,
      /ageCategory\s+CharacterAgeCategory\?/,
    )

    assert.match(
      ageMigration,
      /ADD COLUMN "ageCategory" "CharacterAgeCategory"/,
    )

    assert.doesNotMatch(
      ageMigration,
      /\bUPDATE\s+"character_identities"/i,
    )

    assert.doesNotMatch(
      ageMigration,
      /\b(?:ADD|ALTER)\s+COLUMN\s+"generation"/i,
    )
  },
)

test(
  'SPEC-022 hace explícitas propiedad y crónica con integridad referencial',
  async () => {
    const relationalMigration =
      await readFile(
        new URL(
          '../prisma/migrations/20260808220500_add_character_owner_chronicle_relations/migration.sql',
          import.meta.url,
        ),
        'utf8',
      )

    assert.match(
      schema,
      /ownedCharacters\s+Character\[\]\s+@relation\("CharacterOwner"\)/,
    )

    assert.match(
      schema,
      /characters\s+Character\[\]\s+@relation\("CharacterChronicle"\)/,
    )

    assert.match(
      schema,
      /owner\s+User\s+@relation\("CharacterOwner",\s*fields:\s*\[ownerId\],\s*references:\s*\[id\],\s*onDelete:\s*Restrict,\s*onUpdate:\s*Cascade\)/,
    )

    assert.match(
      schema,
      /chronicle\s+Chronicle\?\s+@relation\("CharacterChronicle",\s*fields:\s*\[chronicleId\],\s*references:\s*\[id\],\s*onDelete:\s*Restrict,\s*onUpdate:\s*Cascade\)/,
    )

    assert.match(
      relationalMigration,
      /ADD CONSTRAINT "characters_ownerId_fkey"[\s\S]*FOREIGN KEY \("ownerId"\)[\s\S]*REFERENCES "users"\("id"\)[\s\S]*ON DELETE RESTRICT[\s\S]*ON UPDATE CASCADE/,
    )

    assert.match(
      relationalMigration,
      /ADD CONSTRAINT "characters_chronicleId_fkey"[\s\S]*FOREIGN KEY \("chronicleId"\)[\s\S]*REFERENCES "chronicles"\("id"\)[\s\S]*ON DELETE RESTRICT[\s\S]*ON UPDATE CASCADE/,
    )

    assert.match(
      relationalMigration,
      /RAISE EXCEPTION[\s\S]*orphan character owners exist/,
    )

    assert.match(
      relationalMigration,
      /RAISE EXCEPTION[\s\S]*orphan chronicle references exist/,
    )

    assert.doesNotMatch(
      relationalMigration,
      /\bDELETE\s+FROM\s+"characters"/i,
    )
  },
)


test(
  'SPEC-057-A añade naturaleza y modo de creación con defaults compatibles',
  async () => {
    const spec057Migration =
      await readFile(
        new URL(
          '../prisma/migrations/20260816185000_add_character_nature_creation_mode/migration.sql',
          import.meta.url,
        ),
        'utf8',
      )

    assert.match(
      schema,
      /enum CharacterNature\s*{[\s\S]*HUMAN[\s\S]*VAMPIRE[\s\S]*}/,
    )

    assert.match(
      schema,
      /enum CharacterCreationMode\s*{[\s\S]*STANDARD[\s\S]*SESSION_ZERO[\s\S]*}/,
    )

    assert.match(
      schema,
      /nature\s+CharacterNature\s+@default\(VAMPIRE\)/,
    )

    assert.match(
      schema,
      /creationMode\s+CharacterCreationMode\s+@default\(STANDARD\)/,
    )

    assert.match(
      spec057Migration,
      /ADD COLUMN "nature" "CharacterNature" NOT NULL[\s\S]*DEFAULT 'VAMPIRE'/,
    )

    assert.match(
      spec057Migration,
      /ADD COLUMN "creationMode" "CharacterCreationMode" NOT NULL[\s\S]*DEFAULT 'STANDARD'/,
    )

    assert.doesNotMatch(
      spec057Migration,
      /\b(?:DROP|DELETE|TRUNCATE|UPDATE)\b/i,
    )
  },
)
