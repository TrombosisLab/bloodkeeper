import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const root = new URL('../src/', import.meta.url)
const read = (path) => readFileSync(new URL(path, root), 'utf8')

test('trash row actions stay inside the list and use a separate row', () => {
  const css = read('features/administration/components/lifecycle-trash-panel.css')
  assert.match(css, /\.lifecycle-trash__item\s*\{[^}]*grid-template-columns:\s*2\.4rem\s+minmax\(0,\s*1\.7fr\)[^}]*minmax\(9rem,\s*auto\)/s)
  assert.match(css, /\.lifecycle-trash__actions\s*\{[^}]*grid-column:\s*6;[^}]*grid-row:\s*1;/s)
  assert.match(css, /@media\s*\(max-width:\s*1120px\)[\s\S]*?\.lifecycle-trash__actions\s*\{[^}]*grid-column:\s*2\s*\/\s*-1;\s*grid-row:\s*2;/s)
})

test('map header reserves title room and preserves the mobile layout', () => {
  const css = read('features/map/components/chronicle-map.css')
  assert.match(css, /\.app-header:has\(\.chronicle-map-global-actions\) \.app-header__page-context\s*\{[^}]*padding-right:\s*clamp\(240px,/s)
  assert.match(css, /@media\s*\(max-width:\s*900px\)[\s\S]*?\.app-header:has\(\.chronicle-map-global-actions\) \.app-header__page-context\s*\{[^}]*padding-right:\s*16px/s)
})

test('chronicle resource category names are not forcibly split mid-word', () => {
  const css = read('features/chronicles/components/chronicle-resources-workspace.css')
  assert.match(css, /\.chronicle-resources-workspace__tabs\s*\{\s*grid-template-columns:\s*minmax\(0,\s*1fr\);/)
  assert.doesNotMatch(css, /overflow-wrap:\s*break-word/)
})

test('selected story title gets its own full-width header row', () => {
  const css = read('features/chronicles/components/chronicle-story-workspace.css')
  assert.match(css, /\.story-detail__header\s*\{\s*grid-template-columns:\s*minmax\(0,\s*1fr\);\s*\}/)
})

test('dice history renders the description value instead of a literal template token', () => {
  const source = read('features/dice/components/DiceHistoryPanel.tsx')
  assert.match(source, /item\.description !== null \? `\$\{item\.description\} · `/)
  assert.doesNotMatch(source, /\? `\{item\.description\} · `/)
})
