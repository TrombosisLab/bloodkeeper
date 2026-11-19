import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const css = readFileSync(new URL('../src/features/character-list/character-list.css', import.meta.url), 'utf8')
const tablet = css.slice(css.lastIndexOf('CHARACTER_LIST_TABLET_ACTION_BELOW_V1'))

test('intermediate character cards put the action below content without spanning the portrait into its row', () => {
  assert.match(tablet, /@container\s+character-list\s*\(min-width:\s*40rem\)\s+and\s+\(max-width:\s*71\.99rem\)/)
  assert.match(tablet, /\.character-list-card__portrait\s*\{[^}]*grid-row:\s*1;/s)
  assert.doesNotMatch(tablet, /\.character-list-card__portrait\s*\{[^}]*grid-row:\s*1\s*\/\s*3/s)
  assert.match(tablet, /\.character-list-card__actions\s*\{[^}]*grid-column:\s*1\s*\/\s*-1;[^}]*grid-row:\s*2;[^}]*width:\s*100%;/s)
  assert.match(tablet, /\.character-list-card__actions button\s*\{[^}]*width:\s*100%;/s)
})
