import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const schema = await readFile(
  new URL('../prisma/schema.prisma', import.meta.url),
  'utf8',
)

const migration = await readFile(
  new URL(
    '../prisma/migrations/20260802234500_add_character_rituals_ceremonies/migration.sql',
    import.meta.url,
  ),
  'utf8',
)

test(
  '004-C.6 persiste referencias de Rituales y Ceremonias',
  () => {
    assert.match(
      schema,
      /model CharacterBloodSorceryRitual\s*{/,
    )
    assert.match(
      schema,
      /model CharacterOblivionCeremony\s*{/,
    )
    assert.match(
      schema,
      /@@id\(\[characterId, ritualKey\]\)/,
    )
    assert.match(
      schema,
      /@@id\(\[characterId, ceremonyKey\]\)/,
    )
  },
)

test(
  '004-C.6 no duplica definiciones de los catálogos',
  () => {
    const ritualModel = schema.match(
      /model CharacterBloodSorceryRitual\s*{([\s\S]*?)\n}/,
    )?.[1]
    const ceremonyModel = schema.match(
      /model CharacterOblivionCeremony\s*{([\s\S]*?)\n}/,
    )?.[1]

    assert.doesNotMatch(ritualModel ?? '', /name|summary|level/)
    assert.doesNotMatch(ceremonyModel ?? '', /name|summary|level/)
  },
)

test(
  '004-C.6 elimina selecciones al eliminar el personaje',
  () => {
    assert.match(
      migration,
      /character_blood_sorcery_rituals[\s\S]*ON DELETE CASCADE/,
    )
    assert.match(
      migration,
      /character_oblivion_ceremonies[\s\S]*ON DELETE CASCADE/,
    )
  },
)
