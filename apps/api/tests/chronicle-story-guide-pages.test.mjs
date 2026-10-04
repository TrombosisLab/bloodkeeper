import assert from 'node:assert/strict'
import test from 'node:test'
import { parseUpdateChronicleStoryRequest } from '../dist/chronicles/presentation/chronicle-story.dto.js'

const id = (n) => '00000000-0000-4000-8000-' + String(n).padStart(12, '0')
const card = (n, pageId) => ({
  id: id(n), ...(pageId === undefined ? {} : { pageId }),
  kind: 'clue', state: 'hidden', title: 'Pista', summary: 'Descripción',
  narratorNote: 'Privado', x: 32, y: 48,
})
const parse = (guide) => parseUpdateChronicleStoryRequest(id(100), id(101), { expectedRevision: 1, narratorGuide: guide }).narratorGuide

test('legacy guide keeps all card data, IDs, coordinates and connections', () => {
  const guide = { cards: [card(10), card(11)], connections: [{ id: id(20), from: id(10), to: id(11), label: 'Investigar', color: 'rose' }] }
  assert.deepEqual(parse(guide), guide)
})

test('pages round-trip and connections may cross page boundaries', () => {
  const guide = { pages: [{ id: id(1), title: 'Inicio' }, { id: id(2), title: 'Consecuencias' }],
    cards: [card(10, id(1)), card(11, id(2))],
    connections: [{ id: id(20), from: id(10), to: id(11), label: 'Continuar', color: 'gold' }] }
  assert.deepEqual(parse(guide), guide)
})

test('missing card page is assigned to the first declared page', () => {
  const result = parse({ pages: [{ id: id(1), title: 'Inicio' }], cards: [card(10)], connections: [] })
  assert.equal(result.cards[0].pageId, id(1))
})

test('unknown pages and page IDs without declared pages are rejected', () => {
  assert.throws(() => parse({ pages: [{ id: id(1), title: 'Inicio' }], cards: [card(10, id(2))], connections: [] }))
  assert.throws(() => parse({ cards: [card(10, id(1))], connections: [] }))
})

test('invalid, empty, oversized, duplicate and unsupported page input is rejected', () => {
  for (const pages of [null, [], [{ id: id(1), title: '' }], [{ id: 'bad', title: 'Inicio' }],
    [{ id: id(1), title: 'Inicio' }, { id: id(1), title: 'Otra' }],
    [{ id: id(1), title: 'a'.repeat(81) }], [{ id: id(1), title: 'Inicio', secret: 'bad' }],
    Array.from({ length: 31 }, (_, n) => ({ id: id(n + 1), title: 'Página' }))]) {
    assert.throws(() => parse({ pages, cards: [], connections: [] }))
  }
})

test('cards and connections remain bounded across the entire guide', () => {
  assert.throws(() => parse({ cards: Array.from({ length: 121 }, (_, n) => card(n + 1)), connections: [] }))
  assert.throws(() => parse({ cards: [card(1)], connections: Array.from({ length: 241 }, () => ({})) }))
  assert.throws(() => parse({ cards: [card(1)], connections: [{ id: id(20), from: id(1), to: id(2), label: '', color: 'rose' }] }))
})
