import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8')
const client = read('../src/features/character-sheet/components/CharacterPortrait.tsx')
const server = read('../../api/src/characters/presentation/character-portrait.controller.ts')

test('la ficha y el servidor admiten retratos de hasta 5 MiB', () => {
  for (const source of [client, server]) {
    assert.match(source, /const MAX_PORTRAIT_BYTES = 5 \* 1024 \* 1024/)
  }
  assert.match(client, /file\.size > MAX_PORTRAIT_BYTES/)
  assert.match(server, /(?:size|byteLength|length|total) > MAX_PORTRAIT_BYTES/)
  assert.match(client, /máximo 5 MB/)
})
