import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const schema = await readFile(
  new URL('../prisma/schema.prisma', import.meta.url),
  'utf8',
)

const migration = await readFile(
  new URL(
    '../prisma/migrations/20260802233000_add_character_disciplines/migration.sql',
    import.meta.url,
  ),
  'utf8',
)

test(
  '004-C.5 separa Disciplinas y Poderes adquiridos',
  () => {
    assert.match(schema, /model CharacterDiscipline\s*{/)
    assert.match(
      schema,
      /model CharacterDisciplinePower\s*{/,
    )
    assert.match(
      schema,
      /@@id\(\[characterId, disciplineKey\]\)/,
    )
    assert.match(
      schema,
      /@@id\(\[characterId, disciplineKey, powerKey\]\)/,
    )
  },
)

test(
  '004-C.5 mantiene el origen de cada Disciplina',
  () => {
    assert.match(schema, /enum DisciplineOrigin\s*{/)
    assert.match(schema, /CREATION/)
    assert.match(schema, /PREDATOR_TYPE/)
    assert.match(schema, /THIN_BLOOD/)
  },
)

test(
  '004-C.5 protege Poderes sin Disciplina adquirida',
  () => {
    assert.match(
      migration,
      /FOREIGN KEY \("characterId", "disciplineKey"\) REFERENCES "character_disciplines"\("characterId", "disciplineKey"\) ON DELETE CASCADE/,
    )
    assert.doesNotMatch(
      migration,
      /INSERT INTO "character_disciplines"/,
    )
  },
)
