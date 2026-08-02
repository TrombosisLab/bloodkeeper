import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const schema = await readFile(
  new URL('../prisma/schema.prisma', import.meta.url),
  'utf8',
)

const migration = await readFile(
  new URL(
    '../prisma/migrations/20260802223000_add_character_humanity/migration.sql',
    import.meta.url,
  ),
  'utf8',
)

test(
  '004-C.4 separa Humanidad de sus elementos narrativos',
  () => {
    assert.match(
      schema,
      /model CharacterHumanityState\s*{/,
    )
    assert.match(schema, /model CharacterConviction\s*{/)
    assert.match(schema, /model CharacterTouchstone\s*{/)
  },
)

test(
  '004-C.4 vincula Convicciones y Piedras de Toque del mismo personaje',
  () => {
    assert.match(
      schema,
      /fields: \[characterId, touchstoneId\], references: \[characterId, touchstoneId\]/,
    )
    assert.match(
      migration,
      /FOREIGN KEY \("characterId", "touchstoneId"\)/,
    )
    assert.match(migration, /ON DELETE RESTRICT/)
  },
)

test(
  '004-C.4 conserva Humanidad al migrar borradores existentes',
  () => {
    assert.match(
      migration,
      /INSERT INTO "character_humanity_states"/,
    )
    assert.match(
      migration,
      /SELECT "id" FROM "characters"/,
    )
  },
)
