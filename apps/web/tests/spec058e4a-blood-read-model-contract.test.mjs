import assert from 'node:assert/strict'
import {
  access,
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

const read = (relative) =>
  readFile(
    new URL(
      `../src/${relative}`,
      import.meta.url,
    ),
    'utf8',
  )

const [
  apiTypes,
  apiParser,
  bloodTypes,
  sheetModel,
  adapter,
  bloodComponent,
  sheet,
] = await Promise.all([
  read(
    'features/character-creation/types/character-draft-api.types.ts',
  ),
  read(
    'features/character-creation/infrastructure/character-draft.api.ts',
  ),
  read(
    'features/character-sheet/types/character-blood-experience.types.ts',
  ),
  read(
    'features/character-sheet/types/character-sheet-model.types.ts',
  ),
  read(
    'features/character-sheet/domain/persisted-character-sheet.adapter.ts',
  ),
  read(
    'features/character-sheet/components/CharacterBloodExperience.tsx',
  ),
  read(
    'features/character-sheet/components/CharacterSheet.tsx',
  ),
])

test('058-E4A transporta Resonancia y Discrasia sin abrir autoridad de update', () => {
  for (const token of [
    'CharacterDraftApiBloodResonance',
    'CharacterDraftApiBloodDyscrasia',
    'resonanceKey',
    'specialAffinityKey',
    'temperament',
    'acquisitionMode',
  ]) {
    assert.equal(
      apiTypes.includes(token),
      true,
      `falta ${token}`,
    )
  }

  assert.match(
    apiTypes,
    /blood\?: Partial<[\s\S]*Pick<[\s\S]*'bloodPotency' \| 'hunger'/,
  )

  assert.match(
    apiParser,
    /characterBloodResonanceCatalog/,
  )
  assert.match(
    apiParser,
    /characterBloodDyscrasiaCatalog/,
  )
  assert.match(
    apiParser,
    /validBloodResonance/,
  )
  assert.match(
    apiParser,
    /validBloodDyscrasia/,
  )
})

test('058-E4A ficha recibe estado real y no mezcla Experience ficticia', async () => {
  assert.match(
    bloodTypes,
    /resonance:[\s\S]*CharacterDraftApiBloodResonance \| null/,
  )
  assert.match(
    bloodTypes,
    /dyscrasia:[\s\S]*CharacterDraftApiBloodDyscrasia \| null/,
  )

  assert.match(
    sheetModel,
    /blood: CharacterBloodExperience \| null/,
  )
  assert.match(
    adapter,
    /snapshot\.blood\.resonance/,
  )
  assert.match(
    adapter,
    /snapshot\.blood\.dyscrasia/,
  )

  assert.match(
    bloodComponent,
    /Sin Resonancia activa/,
  )
  assert.match(
    bloodComponent,
    /Discrasia activa/,
  )
  assert.match(
    bloodComponent,
    /characterBloodResonanceCatalog/,
  )
  assert.match(
    bloodComponent,
    /characterBloodDyscrasiaCatalog/,
  )

  assert.doesNotMatch(
    bloodComponent,
    /experienceCurrent|experienceSpent|totalExperience|demoBloodExperience/,
  )

  assert.match(
    sheet,
    /<CharacterBloodExperience[\s\S]*blood=\{model\.blood\}/,
  )
  assert.match(
    sheet,
    /<PersistedCharacterExperience/,
  )

  const demoUrl =
    new URL(
      '../src/features/character-sheet/data/demo-blood-experience.ts',
      import.meta.url,
    )

  await assert.rejects(
    access(demoUrl),
  )
})
