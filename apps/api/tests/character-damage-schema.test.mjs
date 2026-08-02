import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const schema = await readFile(
  new URL('../prisma/schema.prisma', import.meta.url),
  'utf8',
)

const migration = await readFile(
  new URL(
    '../prisma/migrations/20260803013000_add_character_damage_state/migration.sql',
    import.meta.url,
  ),
  'utf8',
)

test(
  '006-C persiste solo las cantidades necesarias para reconstruir el daño',
  () => {
    assert.match(schema, /model CharacterDamageState/)
    for (const field of [
      'healthSuperficial',
      'healthAggravated',
      'willpowerSuperficial',
      'willpowerAggravated',
    ]) {
      assert.match(schema, new RegExp(field))
    }
    assert.doesNotMatch(schema, /healthCapacity/)
    assert.doesNotMatch(schema, /willpowerCapacity/)
  },
)

test(
  '006-C migra personajes existentes y protege cantidades imposibles',
  () => {
    assert.match(
      migration,
      /INSERT INTO "character_damage_states"/,
    )
    assert.match(migration, /nonnegative/)
    assert.match(migration, /health_limit/)
    assert.match(migration, /willpower_limit/)
    assert.match(migration, /ON DELETE CASCADE/)
  },
)
