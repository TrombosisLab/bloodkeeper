import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const component = await readFile(
  new URL(
    '../src/features/character-list/components/CharacterList.tsx',
    import.meta.url,
  ),
  'utf8',
)

test(
  'SPEC-057 permite abrir una ficha humana activa desde el listado',
  () => {
    assert.match(
      component,
      /character\.status ===\s*'active'\s*\?\s*\([\s\S]*?onOpenCharacter/,
    )
    assert.doesNotMatch(
      component,
      /character\.nature === 'vampire'[\s\S]{0,180}creationMode/,
    )
  },
)
