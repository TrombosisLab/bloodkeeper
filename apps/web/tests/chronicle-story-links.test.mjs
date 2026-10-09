import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { resolveStoryGuideLink } from '../src/features/chronicles/domain/story-guide-links.ts'
import { buildNarratorContext, NARRATOR_EXPORT_INSTRUCTIONS } from '../src/features/chronicles/domain/chronicle-narrator-export.ts'
const card = (id, title) => ({ id, title, kind: 'clue', state: 'hidden', summary: '', narratorNote: '', x: 0, y: 0 })
const stories = () => [
  { id: 'main', chronicleId: 'c', title: 'Principal', status: 'active', milestones: [], reminders: [], sessions: [], narratorGuide: { cards: [{ ...card('a', 'Símbolo'), storyLinks: [{ id: 'e', storyId: 'personal', cardId: 'b', label: 'Abre el pasado' }] }], connections: [] } },
  { id: 'personal', chronicleId: 'c', title: 'Arco personal', status: 'planned', milestones: [], reminders: [], sessions: [], narratorGuide: { cards: [card('b', 'El diario')], connections: [] } },
]
const input = () => ({ narratorId: 'n', viewerUserId: 'n', notes: [], stories: stories(), shared: { chronicle: { id: 'c', name: 'Prueba', description: '' }, sessions: [], stories: [], notes: [], context: { characters: [], npcs: [], locations: [], resources: [] }, board: { connections: [] }, maps: [] } })
test('resolves story and specific card, with explicit unavailable destinations', () => {
  assert.equal(resolveStoryGuideLink(stories(), { storyId: 'personal' }).available, true)
  assert.equal(resolveStoryGuideLink(stories(), { storyId: 'personal', cardId: 'b' }).card.title, 'El diario')
  assert.equal(resolveStoryGuideLink(stories(), { storyId: 'personal', cardId: 'missing' }).available, false)
  assert.match(resolveStoryGuideLink(stories(), { storyId: 'missing' }).label, /no disponible/)
})
test('private export resolves readable cross-story references without raw identifiers', () => {
  const result = buildNarratorContext(input())
  assert.match(result, /Símbolo \[GN1-T1\] → Arco personal \[GN2\] · El diario \[GN2-T1\]/)
  assert.match(result, /Abre el pasado/)
  assert.match(NARRATOR_EXPORT_INSTRUCTIONS, /rutas de preparación/)
  assert.doesNotMatch(result, /storyId|cardId/)
})
test('start, removed card and removed story are distinguished, never guessed', () => {
  for (const [patch, expected] of [[{ cardId: undefined }, /Inicio del guion/], [{ cardId: 'missing' }, /Tarjeta no disponible/], [{ storyId: 'missing' }, /Historia no disponible/]]) {
    const value = input(); Object.assign(value.stories[0].narratorGuide.cards[0].storyLinks[0], patch)
    assert.match(buildNarratorContext(value), expected)
  }
  assert.throws(() => buildNarratorContext({ ...input(), viewerUserId: 'player' }), /Solo el narrador/)
})
test('UI navigation guards unsaved changes and retains read-only controls', () => {
  const parent = readFileSync(new URL('../src/features/chronicles/components/ChronicleStoryWorkspace.tsx', import.meta.url), 'utf8')
  const ui = readFileSync(new URL('../src/features/chronicles/components/ChronicleStoryGuideWorkspace.tsx', import.meta.url), 'utf8')
  assert.match(parent, /onStoryLink=[\s\S]*if \(!leaveGuideAllowed\(\)\) return/)
  assert.match(parent, /initialCardId=/)
  assert.match(ui, /Enlazar con otra historia/)
  assert.match(ui, /readOnly \|\| !targetStoryId/)
  assert.match(ui, /aria-label="Eliminar enlace entre historias" disabled=\{readOnly\}/)
})
