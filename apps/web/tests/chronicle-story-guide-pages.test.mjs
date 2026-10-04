import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { normalizeGuidePages, guidePageCards, guidePageConnections, FIRST_GUIDE_PAGE } from '../src/features/chronicles/domain/story-guide-pages.ts'

test('opening an existing guide adds Inicio without changing original content', () => {
  const old = { cards: [{ id: 'a', title: 'Domicilio', x: 4, y: 5, narratorNote: 'Nota' }], connections: [] }
  const normalized = normalizeGuidePages(old)
  assert.equal(normalized.pages[0].id, FIRST_GUIDE_PAGE)
  assert.deepEqual(normalized.cards[0], { ...old.cards[0], pageId: FIRST_GUIDE_PAGE })
  assert.equal(old.cards[0].pageId, undefined)
  assert.deepEqual(normalizeGuidePages(normalized), normalized)
})

test('each page only renders its cards and local arrows; cross-page arrows stay saved', () => {
  const guide = { pages: [{ id: 'p1', title: 'Inicio' }, { id: 'p2', title: 'Consecuencias' }],
    cards: [{ id: 'a', pageId: 'p1' }, { id: 'b', pageId: 'p1' }, { id: 'c', pageId: 'p2' }],
    connections: [{ id: 'local', from: 'a', to: 'b' }, { id: 'cross', from: 'b', to: 'c' }] }
  assert.deepEqual(guidePageCards(guide, 'p1').map(c => c.id), ['a', 'b'])
  assert.deepEqual(guidePageConnections(guide, 'p1').map(c => c.id), ['local'])
  const moved = { ...guide, cards: guide.cards.map(c => c.id === 'b' ? { ...c, pageId: 'p2' } : c) }
  assert.deepEqual(guidePageConnections(moved, 'p2').map(c => c.id), ['cross'])
  assert.deepEqual(moved.connections, guide.connections)
})

test('page UI supports floating controls, navigation, read-only and safe card deletion', () => {
  const ui = readFileSync(new URL('../src/features/chronicles/components/ChronicleStoryGuideWorkspace.tsx', import.meta.url), 'utf8')
  assert.match(ui, /Abrir destino →/)
  assert.match(ui, /← Volver al origen/)
  assert.match(ui, /setFocusedCard\(id\)/)
  assert.match(ui, /Eliminar página vacía/)
  assert.match(ui, /readOnly \|\| pages.length <= 1 \|\| visibleCards.length > 0/)
  assert.match(ui, /changeGuide\(\{ \.\.\.draft, cards: draft.cards.filter/)
  assert.match(ui, /optgroup/)
})
