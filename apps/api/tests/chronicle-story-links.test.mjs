import assert from 'node:assert/strict'
import test from 'node:test'
import { parseUpdateChronicleStoryRequest, toSharedChronicleStoryResponse } from '../dist/chronicles/presentation/chronicle-story.dto.js'
import { UpdateChronicleStoryUseCase } from '../dist/chronicles/application/chronicle-story.use-cases.js'

const id = n => '00000000-0000-4000-8000-' + String(n).padStart(12, '0')
const link = () => ({ id: id(8), storyId: id(2), cardId: id(3), label: 'Abre el arco personal' })
const guide = () => ({ cards: [{ id: id(4), kind: 'clue', state: 'hidden', title: 'Pista', summary: '', narratorNote: '', x: 0, y: 0, storyLinks: [link()] }], connections: [] })
const parse = value => parseUpdateChronicleStoryRequest(id(10), id(1), { expectedRevision: 1, narratorGuide: value }).narratorGuide

test('story links round-trip and preserve legacy cards without links', () => {
  assert.deepEqual(parse(guide()), guide())
  const legacy = guide(); delete legacy.cards[0].storyLinks
  assert.deepEqual(parse(legacy), legacy)
  const start = guide(); delete start.cards[0].storyLinks[0].cardId
  assert.deepEqual(parse(start), start)
})
test('rejects invalid IDs, extra fields, duplicate destinations and excessive links', () => {
  for (const bad of [{ ...link(), storyId: 'bad' }, { ...link(), cardId: null }, { ...link(), extra: true }, { ...link(), label: 'x'.repeat(121) }]) {
    const value = guide(); value.cards[0].storyLinks = [bad]; assert.throws(() => parse(value))
  }
  for (const links of [[link(), { ...link(), id: id(9) }], Array.from({ length: 9 }, (_, i) => ({ ...link(), id: id(20 + i), storyId: id(40 + i) }))]) {
    const value = guide(); value.cards[0].storyLinks = links; assert.throws(() => parse(value))
  }
})
function harness({ role = 'narrator', status = 'active', target = true } = {}) {
  const source = { id: id(1), chronicleId: id(10), status }
  const destination = { id: id(2), chronicleId: id(10), status: 'completed', narratorGuide: { cards: [{ id: id(3) }] } }
  let writes = 0
  const repository = {
    async findById(chronicleId, storyId) { assert.equal(chronicleId, id(10)); return storyId === id(1) ? source : target && storyId === id(2) ? destination : null },
    async update(command) { writes++; return command },
  }
  const participants = { async findActiveMembership() { return role === null ? null : { role } } }
  return { useCase: new UpdateChronicleStoryUseCase(repository, participants), writes: () => writes }
}
const command = () => ({ chronicleId: id(10), storyId: id(1), expectedRevision: 1, narratorGuide: guide() })
test('narrator can link a completed destination without modifying it', async () => {
  const h = harness(); await h.useCase.execute('n', command()); assert.equal(h.writes(), 1)
})
test('player, outsider and closed origin remain blocked before writes', async () => {
  for (const options of [{ role: 'player' }, { role: null }, { status: 'completed' }, { status: 'archived' }]) {
    const h = harness(options); await assert.rejects(h.useCase.execute('n', command())); assert.equal(h.writes(), 0)
  }
})
test('rejects targets outside the chronicle, self-story and unknown card', async () => {
  const missing = harness({ target: false }); await assert.rejects(missing.useCase.execute('n', command())); assert.equal(missing.writes(), 0)
  for (const patch of [{ storyId: id(1) }, { cardId: id(99) }]) {
    const h = harness(); const value = command(); Object.assign(value.narratorGuide.cards[0].storyLinks[0], patch)
    await assert.rejects(h.useCase.execute('n', value)); assert.equal(h.writes(), 0)
  }
})
test('shared story projection never exposes guide or links', () => {
  const result = toSharedChronicleStoryResponse({ id: id(1), narratorGuide: guide(), milestones: [], sessions: [], sessionIds: [], status: 'active', startedAt: null, completedAt: null, createdAt: new Date(), updatedAt: new Date() })
  assert.equal(Object.hasOwn(result, 'narratorGuide'), false)
  assert.doesNotMatch(JSON.stringify(result), /storyLinks|Abre el arco/)
})
