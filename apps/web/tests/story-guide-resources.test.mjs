import test from 'node:test'
import assert from 'node:assert/strict'
import { buildNarratorContext } from '../src/features/chronicles/domain/chronicle-narrator-export.ts'
import { readGuideResource } from '../src/features/chronicles/infrastructure/story-guide-resources.api.ts'
const input = () => ({ shared: { chronicle: { id: 'c', name: 'Test', description: '' }, sessions: [], stories: [], notes: [], context: { characters: [], npcs: [], locations: [], resources: [] }, board: { connections: [] }, maps: [] }, narratorId: 'n', viewerUserId: 'n', notes: [], stories: [{ title: 'Story', status: 'planned', milestones: [], reminders: [], sessions: [], narratorGuide: { cards: ['a', 'b'].map(id => ({ id, title: id, kind: 'clue', state: 'hidden', resourceIds: ['r'] })), connections: [] } }], resources: [{ id: 'r', name: 'Vigilante', kind: 'npc', summary: 'Original description', narratorNotes: 'Unique secret', status: 'active', inChronicle: false }] })
test('deduplicates resource details, preserves references from both cards', () => {
  const result = buildNarratorContext(input())
  assert.equal((result.match(/Unique secret/g) ?? []).length, 1)
  assert.equal((result.match(/Recurso relacionado: Vigilante \[RG1\]/g) ?? []).length, 2)
  assert.match(result, /biblioteca reutilizable, sin incorporación automática/)
})
test('unavailable references explicit; current original content and escaping', () => {
  const data = input(); data.resources = []
  assert.match(buildNarratorContext(data), /Recurso no disponible \[RG1\]/)
  data.resources = [{ ...input().resources[0], narratorNotes: '<script>secret</script>' }]
  assert.match(buildNarratorContext(data), /&lt;script&gt;/)
})
test('read cancels authorization failures and treats only 404 as unavailable', async () => {
  const previous = globalThis.fetch
  try {
    for (const status of [401, 403, 500]) { globalThis.fetch = async () => new Response('', { status }); await assert.rejects(readGuideResource('c', '/r', new AbortController().signal)) }
    globalThis.fetch = async () => new Response('', { status: 404 })
    assert.equal(await readGuideResource('c', '/r', new AbortController().signal), null)
  } finally { globalThis.fetch = previous }
})
