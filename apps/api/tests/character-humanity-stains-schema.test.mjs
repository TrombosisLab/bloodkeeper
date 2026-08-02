import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const schema = await readFile(
  new URL('../prisma/schema.prisma', import.meta.url),
  'utf8',
)

const migration = await readFile(
  new URL(
    '../prisma/migrations/20260803020000_add_humanity_stains/migration.sql',
    import.meta.url,
  ),
  'utf8',
)

test(
  '006-D persiste Manchas separadas de Humanidad',
  () => {
    assert.match(
      schema,
      /model CharacterHumanityState[\s\S]*stains\s+Int\s+@default\(0\)/,
    )
    assert.match(
      migration,
      /ADD COLUMN "stains" INTEGER NOT NULL DEFAULT 0/,
    )
  },
)

test(
  '006-D protege el rango y el límite combinado',
  () => {
    assert.match(migration, /value_range/)
    assert.match(migration, /stains_range/)
    assert.match(migration, /combined_limit/)
    assert.match(
      migration,
      /"value" \+ "stains" <= 10/,
    )
  },
)
