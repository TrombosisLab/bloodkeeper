import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const schema = await readFile(
  new URL('../prisma/schema.prisma', import.meta.url),
  'utf8',
)

const migration = await readFile(
  new URL(
    '../prisma/migrations/20260803001500_add_character_advantages/migration.sql',
    import.meta.url,
  ),
  'utf8',
)

test(
  '004-C.8 separa catálogo y selecciones del personaje',
  () => {
    const selectionModel = schema.match(
      /model CharacterAdvantageSelection\s*{([\s\S]*?)\n}/,
    )?.[1] ?? ''

    assert.match(selectionModel, /definitionKey\s+String/)
    assert.match(selectionModel, /selectionId\s+String/)
    assert.match(selectionModel, /rating\s+Int/)
    assert.doesNotMatch(selectionModel, /definitionName|summary/)
  },
)

test(
  '004-C.8 modela relaciones y detalles sin JSON genérico',
  () => {
    const detailsModel = schema.match(
      /model CharacterAdvantageDetails\s*{([\s\S]*?)\n}/,
    )?.[1] ?? ''

    assert.match(schema, /parentSelectionId\s+String\?/)
    assert.match(schema, /enum AdvantageDetailsKind\s*{/)
    assert.match(detailsModel, /maskBenefits\s+AdvantageMaskBenefit\[\]/)
    assert.match(detailsModel, /languages\s+String\[\]/)
    assert.match(detailsModel, /loresheetKey\s+String\?/)
    assert.doesNotMatch(detailsModel, /Json/)
  },
)

test(
  '004-C.8 protege padres y detalles por identidad estable',
  () => {
    assert.match(
      migration,
      /FOREIGN KEY \("characterId", "parentSelectionId"\) REFERENCES "character_advantage_selections"\("characterId", "selectionId"\)/,
    )
    assert.match(
      migration,
      /character_advantage_details[\s\S]*FOREIGN KEY \("characterId", "selectionId"\)[\s\S]*ON DELETE CASCADE/,
    )
  },
)
