import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

const gateway = await readFile(
  new URL(
    '../src/features/character-creation/' +
      'infrastructure/character-draft.api.ts',
    import.meta.url,
  ),
  'utf8',
)

const list = await readFile(
  new URL(
    '../src/features/character-list/' +
      'components/CharacterList.tsx',
    import.meta.url,
  ),
  'utf8',
)

test(
  'SPEC-053-B gateway expone página de borradores',
  () => {
    assert.match(
      gateway,
      /CharacterDraftApiPage/,
    )
    assert.match(
      gateway,
      /async listPage\(query = \{\}\)/,
    )
    assert.match(
      gateway,
      /\/api\/characters\/drafts\?limit=/,
    )
    assert.match(
      gateway,
      /parseCharacterDraftApiPageResponse/,
    )
  },
)

test(
  'SPEC-053-B CharacterList consume páginas de 25',
  () => {
    assert.match(
      list,
      /gateway\.listPage\(\{/,
    )
    assert.match(
      list,
      /limit: 25/,
    )
    assert.match(
      list,
      /charactersNextOffset/,
    )
    assert.match(
      list,
      /\.\.\.current,[\s\S]*\.\.\.page\.items/,
    )
    assert.match(
      list,
      /Cargar más personajes/,
    )
  },
)
