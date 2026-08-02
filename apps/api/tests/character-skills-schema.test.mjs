import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const schema = await readFile(
  new URL('../prisma/schema.prisma', import.meta.url),
  'utf8',
)

const migration = await readFile(
  new URL(
    '../prisma/migrations/20260802213000_add_character_skills/migration.sql',
    import.meta.url,
  ),
  'utf8',
)

test(
  '004-C.3 modela Habilidades como catálogo extensible por clave',
  () => {
    assert.match(schema, /model CharacterSkill\s*{/)
    assert.match(schema, /skillKey\s+String/)
    assert.match(
      schema,
      /@@id\(\[characterId, skillKey\]\)/,
    )
    assert.doesNotMatch(schema, /enum CharacterSkillKey/)
  },
)

test(
  '004-C.3 vincula cada Especialidad con una Habilidad existente',
  () => {
    assert.match(
      schema,
      /model CharacterSkillSpecialty\s*{/,
    )
    assert.match(
      schema,
      /fields: \[characterId, skillKey\], references: \[characterId, skillKey\]/,
    )
    assert.match(
      migration,
      /FOREIGN KEY \("characterId", "skillKey"\)/,
    )
  },
)

test(
  '004-C.3 conserva las 27 Habilidades al migrar borradores existentes',
  () => {
    const values =
      migration.match(/\('[a-zA-Z]+'\)/g) ?? []

    assert.equal(values.length, 27)
    assert.match(
      migration,
      /INSERT INTO "character_skills"/,
    )
    assert.match(
      migration,
      /CROSS JOIN/,
    )
  },
)
