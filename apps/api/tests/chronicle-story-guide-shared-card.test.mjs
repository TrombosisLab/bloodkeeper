import assert from 'node:assert/strict'
import test from 'node:test'
import { parseUpdateChronicleStoryRequest } from '../dist/chronicles/presentation/chronicle-story.dto.js'

const id = n => '00000000-0000-4000-8000-' + String(n).padStart(12, '0')
const base = () => ({
  pages: [1, 2, 3].map(n => ({ id: id(n), title: 'Página ' + n })),
  cards: [{ id: id(10), pageId: id(1), kind: 'clue', state: 'hidden', title: 'Nave', summary: 'Datos', narratorNote: 'Privado', x: 320, y: 180,
    appearances: [{ pageId: id(2), sourcePageId: id(1), x: 32, y: 32 }, { pageId: id(3), sourcePageId: id(2), x: 44, y: 55 }] }],
  connections: [],
})
const parse = guide => parseUpdateChronicleStoryRequest(id(100), id(101), { expectedRevision: 1, narratorGuide: guide }).narratorGuide

test('shared appearances and independent coordinates round-trip in the same single card', () => {
  const guide = base()
  assert.deepEqual(parse(guide), guide)
  assert.equal(parse(guide).cards.length, 1)
})

test('invalid, duplicate, original-page and self-origin appearances are rejected', () => {
  for (const appearance of [
    { pageId: id(99), sourcePageId: id(1), x: 32, y: 32 },
    { pageId: id(1), sourcePageId: id(2), x: 32, y: 32 },
    { pageId: id(2), sourcePageId: id(2), x: 32, y: 32 },
    { pageId: id(2), sourcePageId: id(99), x: 32, y: 32 },
    { pageId: 'bad', sourcePageId: id(1), x: 32, y: 32 },
    { pageId: id(2), sourcePageId: id(1), x: -1, y: 32 },
    { pageId: id(2), sourcePageId: id(1), x: NaN, y: 32 },
    { pageId: id(2), sourcePageId: id(1), x: 32, y: 5001 },
    { pageId: id(2), sourcePageId: id(1), x: 32, y: 32, title: 'Duplicate data' },
  ]) {
    const guide = base()
    guide.cards[0].appearances = [appearance]
    assert.throws(() => parse(guide))
  }
  const duplicate = base()
  duplicate.cards[0].appearances.push(duplicate.cards[0].appearances[0])
  assert.throws(() => parse(duplicate))
})

test('source must contain the same card and cycles are rejected', () => {
  const missing = base()
  missing.cards[0].appearances = [{ pageId: id(2), sourcePageId: id(3), x: 32, y: 32 }]
  assert.throws(() => parse(missing))
  const cycle = base()
  cycle.cards[0].appearances[0].sourcePageId = id(3)
  assert.throws(() => parse(cycle))
})

test('invalid array types, too many appearances and unpaged aliases are rejected', () => {
  for (const appearances of [null, {}, Array.from({ length: 30 }, () => base().cards[0].appearances[0])]) {
    const guide = base()
    guide.cards[0].appearances = appearances
    assert.throws(() => parse(guide))
  }
  const guide = base()
  delete guide.pages
  delete guide.cards[0].pageId
  assert.throws(() => parse(guide))
})
