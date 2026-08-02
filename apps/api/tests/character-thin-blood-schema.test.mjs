import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const schema = await readFile(
  new URL('../prisma/schema.prisma', import.meta.url),
  'utf8',
)

const migration = await readFile(
  new URL(
    '../prisma/migrations/20260803000000_add_character_thin_blood/migration.sql',
    import.meta.url,
  ),
  'utf8',
)

test(
  '004-C.7 separa Alquimia y fórmulas adquiridas',
  () => {
    assert.match(
      schema,
      /model CharacterThinBloodAlchemyState\s*{/,
    )
    assert.match(
      schema,
      /model CharacterThinBloodAlchemyFormula\s*{/,
    )
    assert.match(
      schema,
      /enum ThinBloodAlchemyMethod\s*{/,
    )
    assert.match(
      schema,
      /@@id\(\[characterId, formulaKey\]\)/,
    )
  },
)

test(
  '004-C.7 conserva detalles tipados sin JSON genérico',
  () => {
    const traitModel = schema.match(
      /model CharacterThinBloodTrait\s*{([\s\S]*?)\n}/,
    )?.[1] ?? ''

    assert.match(traitModel, /clanCurseClanKey\s+String\?/)
    assert.match(
      traitModel,
      /disciplineAffinityDisciplineKey\s+String\?/,
    )
    assert.match(
      traitModel,
      /disciplineAffinityPowerKey\s+String\?/,
    )
    assert.doesNotMatch(traitModel, /Json/)
    assert.match(
      migration,
      /character_thin_blood_traits_affinity_pair_check/,
    )
  },
)

test(
  '004-C.7 conserva el estado vacío de borradores existentes',
  () => {
    assert.match(
      migration,
      /INSERT INTO "character_thin_blood_alchemy_states" \("characterId"\)[\s\S]*SELECT "id" FROM "characters"/,
    )
    assert.match(
      migration,
      /character_thin_blood_traits[\s\S]*ON DELETE CASCADE/,
    )
  },
)
