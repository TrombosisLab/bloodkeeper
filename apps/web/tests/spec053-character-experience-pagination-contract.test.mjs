import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

async function source(relative) {
  return readFile(
    new URL(
      `../src/features/character-sheet/${relative}`,
      import.meta.url,
    ),
    'utf8',
  )
}

test('SPEC-053 gateway Experience devuelve una página física', async () => {
  const types =
    await source(
      'types/character-experience.types.ts',
    )
  const api =
    await source(
      'infrastructure/character-experience.api.ts',
    )

  assert.match(
    types,
    /CharacterExperienceLedgerPage[\s\S]*nextOffset:\s*number \| null/,
  )
  assert.match(
    types,
    /load\([\s\S]*CharacterExperienceListQuery[\s\S]*Promise<CharacterExperienceLedgerPage>/,
  )

  assert.match(
    api,
    /parseCharacterExperienceLedgerPage/,
  )
  assert.match(
    api,
    /\?limit=\$\{limit\}&offset=\$\{offset\}/,
  )
  assert.match(
    api,
    /query\.limit \?\? 25/,
  )
  assert.match(
    api,
    /query\.offset \?\? 0/,
  )

  assert.match(
    api,
    /parseCharacterExperienceLedger\(body\.experience\)/,
  )
})

test('SPEC-053 panel carga incrementalmente sin helper COMPLETE', async () => {
  const panel =
    await source(
      'components/PersistedCharacterExperience.tsx',
    )
  const api =
    await source(
      'infrastructure/character-experience.api.ts',
    )

  assert.match(
    panel,
    /limit:\s*25[\s\S]*offset:\s*0/,
  )
  assert.match(
    panel,
    /loadMoreExperience/,
  )
  assert.match(
    panel,
    /Cargar más/,
  )
  assert.match(
    panel,
    /\.\.\.current\.movements[\s\S]*\.\.\.page\.movements/,
  )
  assert.doesNotMatch(
    api,
    /while\s*\(\s*nextOffset\s*!==\s*null\s*\)/,
  )
})
