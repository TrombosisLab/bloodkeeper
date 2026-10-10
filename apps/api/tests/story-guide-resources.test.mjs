import test from 'node:test'
import assert from 'node:assert/strict'
import { StoryGuideResourceController } from '../dist/chronicles/presentation/story-guide-resource.controller.js'
import { parseUpdateChronicleStoryRequest, toSharedChronicleStoryResponse } from '../dist/chronicles/presentation/chronicle-story.dto.js'
const id = n => '00000000-0000-4000-8000-' + String(n).padStart(12, '0')
const guide = ids => ({ cards: [{ id: id(4), kind: 'clue', state: 'hidden', title: 'Scene', summary: '', narratorNote: '', x: 0, y: 0, resourceIds: ids }], connections: [] })
test('resource references roundtrip, reject duplicates, malformed IDs and more than twelve', () => {
  const parse = ids => parseUpdateChronicleStoryRequest(id(1), id(2), { expectedRevision: 1, narratorGuide: guide(ids) }).narratorGuide
  assert.deepEqual(parse([id(3)]), guide([id(3)]))
  for (const ids of [[id(3), id(3)], ['bad'], Array.from({ length: 13 }, (_, i) => id(20 + i))]) assert.throws(() => parse(ids))
})
test('player and outsider denied before querying resources', async () => {
  for (const role of ['player', null]) {
    let queries = 0
    const controller = new StoryGuideResourceController({ libraryResource: { findFirst() { queries++; }, findMany() { queries++; } } }, { async findActiveMembership() { return role ? { role } : null } })
    await assert.rejects(controller.list({ user: { id: id(1) } }, id(2), {}))
    await assert.rejects(controller.detail({ user: { id: id(1) } }, id(2), id(3)))
    assert.equal(queries, 0)
  }
})
test('narrator queries only own resource, with current chronicle binding; never writes', async () => {
  let where
  const controller = new StoryGuideResourceController({ libraryResource: { async findFirst(query) { where = query; return { id: id(3), name: 'Original', bindings: [], narratorNotes: 'private' } } } }, { async findActiveMembership() { return { role: 'narrator' } } })
  const result = await controller.detail({ user: { id: id(1) } }, id(2), id(3))
  assert.deepEqual(where.where, { id: id(3), ownerId: id(1) })
  assert.equal(where.include.bindings.where.chronicleId, id(2))
  assert.equal(result.narratorNotes, 'private'); assert.equal(result.inChronicle, false)
})
test('missing or foreign resource returns not found, shared projection excludes guide', async () => {
  const controller = new StoryGuideResourceController({ libraryResource: { async findFirst() { return null } } }, { async findActiveMembership() { return { role: 'narrator' } } })
  await assert.rejects(controller.detail({ user: { id: id(1) } }, id(2), id(3)))
  const result = toSharedChronicleStoryResponse({ id: id(1), narratorGuide: guide([id(3)]), milestones: [], sessions: [], sessionIds: [], status: 'active', startedAt: null, completedAt: null, createdAt: new Date(), updatedAt: new Date() })
  assert.doesNotMatch(JSON.stringify(result), /resourceIds/)
})
