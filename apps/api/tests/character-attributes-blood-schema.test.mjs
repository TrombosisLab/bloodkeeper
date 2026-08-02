import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const schema = await readFile(
  new URL('../prisma/schema.prisma', import.meta.url),
  'utf8',
)

const migration = await readFile(
  new URL(
    '../prisma/migrations/20260802203000_add_character_attributes_blood/migration.sql',
    import.meta.url,
  ),
  'utf8',
)

test(
  '004-C.2 modela los nueve Atributos en una relación separada',
  () => {
    assert.match(schema, /model CharacterAttributes\s*{/)

    for (const attribute of [
      'strength',
      'dexterity',
      'stamina',
      'charisma',
      'manipulation',
      'composure',
      'intelligence',
      'wits',
      'resolve',
    ]) {
      assert.match(
        schema,
        new RegExp(`${attribute}\\s+Int`),
      )
    }
  },
)

test(
  '004-C.2 separa el estado de Sangre del resto del personaje',
  () => {
    assert.match(schema, /model CharacterBloodState\s*{/)
    assert.match(schema, /bloodPotency\s+Int/)
    assert.match(schema, /hunger\s+Int/)
  },
)

test(
  '004-C.2 migra ambas relaciones con integridad referencial',
  () => {
    assert.match(
      migration,
      /CREATE TABLE "character_attributes"/,
    )
    assert.match(
      migration,
      /CREATE TABLE "character_blood_states"/,
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
      /INSERT INTO "character_attributes"[\s\S]*SELECT "id" FROM "characters"/,
    )
    assert.match(
      migration,
      /INSERT INTO "character_blood_states"[\s\S]*SELECT "id" FROM "characters"/,
    )
  },
)
