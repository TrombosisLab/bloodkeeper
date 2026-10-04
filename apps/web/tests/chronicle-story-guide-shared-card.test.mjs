import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  normalizeGuidePages, continueGuideOnNewPage, guidePageCards,
  guidePageConnections, updateGuideCardPosition, removeGuideCardAppearance,
} from '../src/features/chronicles/domain/story-guide-pages.ts'

const original = () => normalizeGuidePages({
  pages: [{ id: 'a', title: 'Investigación' }],
  cards: [
    { id: 'clue', pageId: 'a', kind: 'location', state: 'hidden', title: 'Nave 37', summary: 'Resumen', narratorNote: 'Nota privada', x: 480, y: 160 },
    { id: 'lead', pageId: 'a', kind: 'clue', state: 'hidden', title: 'Documento', summary: '', narratorNote: '', x: 32, y: 32 },
  ],
  connections: [{ id: 'edge', from: 'lead', to: 'clue', label: 'Dirección', color: 'rose' }],
})

test('continue from a card keeps the origin and makes the same card first on the new page', () => {
  const before = original()
  const after = continueGuideOnNewPage(before, 'clue', 'a', 'b', ' Consecuencias ')
  assert.equal(after.cards.length, before.cards.length)
  assert.deepEqual(after.connections, before.connections)
  assert.equal(after.pages[1].title, 'Consecuencias')
  assert.equal(guidePageCards(after, 'a').length, 2)
  assert.equal(guidePageCards(after, 'b').length, 1)
  assert.equal(guidePageCards(after, 'b')[0].id, 'clue')
  assert.equal(guidePageCards(after, 'b')[0].x, 32)
  assert.equal(guidePageCards(after, 'b')[0].y, 32)
  assert.equal(guidePageCards(after, 'a')[0].x, 480)
  assert.equal(before.cards[0].appearances, undefined)
  assert.deepEqual(guidePageConnections(after, 'a'), before.connections)
  assert.equal(guidePageConnections(after, 'b').length, 0)
})

test('shared title, summary, note and state are one record across appearances', () => {
  const shared = continueGuideOnNewPage(original(), 'clue', 'a', 'b', 'Consecuencias')
  const edited = { ...shared, cards: shared.cards.map(card => card.id === 'clue'
    ? { ...card, title: 'Nave abandonada', summary: 'Modificado', narratorNote: 'Nueva nota', state: 'discovered' } : card) }
  for (const page of ['a', 'b']) {
    const card = guidePageCards(edited, page).find(item => item.id === 'clue')
    assert.equal(card.title, 'Nave abandonada')
    assert.equal(card.summary, 'Modificado')
    assert.equal(card.narratorNote, 'Nueva nota')
    assert.equal(card.state, 'discovered')
  }
})

test('new outgoing arrows draw on the continuation page without changing the original arrows', () => {
  const shared = continueGuideOnNewPage(original(), 'clue', 'a', 'b', 'Consecuencias')
  const guide = {
    ...shared,
    cards: [...shared.cards, { id: 'next', pageId: 'b', title: 'Detención', x: 360, y: 32 }],
    connections: [...shared.connections, { id: 'next-edge', from: 'clue', to: 'next', label: 'Patrulla', color: 'gold' }],
  }
  assert.deepEqual(guidePageConnections(guide, 'a').map(edge => edge.id), ['edge'])
  assert.deepEqual(guidePageConnections(guide, 'b').map(edge => edge.id), ['next-edge'])
  assert.equal(guidePageCards(guide, 'b').find(card => card.id === 'clue').x, 32)
  assert.equal(guidePageCards(guide, 'a').find(card => card.id === 'clue').x, 480)
})

test('dragging changes coordinates only on the active page', () => {
  let guide = continueGuideOnNewPage(original(), 'clue', 'a', 'b', 'Consecuencias')
  guide = updateGuideCardPosition(guide, 'clue', 'b', 720, 340)
  assert.equal(guidePageCards(guide, 'a')[0].x, 480)
  assert.equal(guidePageCards(guide, 'b')[0].x, 720)
  guide = updateGuideCardPosition(guide, 'clue', 'a', 120, 90)
  assert.equal(guidePageCards(guide, 'a')[0].x, 120)
  assert.equal(guidePageCards(guide, 'b')[0].x, 720)
})

test('branching and chained continuations keep source pages without duplicating cards', () => {
  let guide = continueGuideOnNewPage(original(), 'clue', 'a', 'b', 'Consecuencias')
  guide = continueGuideOnNewPage(guide, 'clue', 'b', 'c', 'Final')
  guide = continueGuideOnNewPage(guide, 'clue', 'a', 'd', 'Alternativa')
  assert.equal(guide.cards.length, 2)
  assert.deepEqual(guide.cards[0].appearances.map(a => [a.pageId, a.sourcePageId]), [['b', 'a'], ['c', 'b'], ['d', 'a']])
})

test('removing only an appearance keeps canonical data and arrows and reanchors child pages', () => {
  let guide = continueGuideOnNewPage(original(), 'clue', 'a', 'b', 'Consecuencias')
  guide = continueGuideOnNewPage(guide, 'clue', 'b', 'c', 'Final')
  const removed = removeGuideCardAppearance(guide, 'clue', 'b')
  assert.equal(guidePageCards(removed, 'b').length, 0)
  assert.equal(guidePageCards(removed, 'a').length, 2)
  assert.equal(guidePageCards(removed, 'c')[0].id, 'clue')
  assert.equal(removed.cards[0].appearances[0].sourcePageId, 'a')
  assert.deepEqual(removed.connections, guide.connections)
  assert.deepEqual(removeGuideCardAppearance(guide, 'clue', 'a'), guide)
})

test('invalid continuation, missing source, duplicate page and page limit cannot change the graph', () => {
  assert.throws(() => continueGuideOnNewPage(original(), 'missing', 'a', 'b', 'Página'))
  assert.throws(() => continueGuideOnNewPage(original(), 'clue', 'wrong', 'b', 'Página'))
  assert.throws(() => continueGuideOnNewPage(original(), 'clue', 'a', 'a', 'Página'))
  assert.throws(() => continueGuideOnNewPage(original(), 'clue', 'a', 'b', ' '))
  const full = { ...original(), pages: Array.from({ length: 30 }, (_, n) => ({ id: n === 0 ? 'a' : 'p' + n, title: 'Página' })) }
  assert.throws(() => continueGuideOnNewPage(full, 'clue', 'a', 'extra', 'Otra'))
})

test('UI keeps continuation readonly-aware, uses local geometry and explicit global deletion', () => {
  const ui = readFileSync(new URL('../src/features/chronicles/components/ChronicleStoryGuideWorkspace.tsx', import.meta.url), 'utf8')
  assert.match(ui, /Continuar en una nueva página desde/)
  assert.match(ui, /if \(readOnly \|\| pages.length >= 30/)
  assert.match(ui, /Quitar solo de esta página/)
  assert.match(ui, /Eliminar de todas las páginas/)
  assert.match(ui, /visibleById.get\(connection.from\)/)
  assert.match(ui, /updateGuideCardPosition\(draft, card.id, pageId/)
})
