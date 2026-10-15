import test from 'node:test'
import assert from 'node:assert/strict'
import { ancestry, descendants, layerBounds, projectLayers, reparentLayer, upgradeBackdrop, wrapLayer } from '../src/features/chronicles/domain/backdrop-layers.ts'
import { backdropFingerprint, emptyBackdrop, moveBackdropGroup, removeBackdropGroup } from '../src/features/chronicles/domain/chronicle-backdrop.ts'
const group = (id, parentId = null, x = 0, y = 0) => ({ id, title: id, parentId, x, y, width: 640, height: 460, summary: '', references: [] })
const note = (id, groupId, x = 50, y = 130) => ({ id, title: id, groupId, x, y, text: '', status: 'idea', time: 'unspecified', knownBy: '', references: [] })
const link = (id, from, to, tentative = false) => ({ id, from, to, label: id, tentative })
function fixture() {
  return { version: 2, groups: [group('world'), group('mission', 'world', 50, 120), group('agenda', 'world', 800, 120), group('sabbat', null, 1800, 0)],
    notes: [note('clue', 'mission', 100, 240), note('secret', 'agenda', 850, 240), note('capture', 'sabbat', 1850, 120), note('free', null, 0, 900)],
    links: [link('influence', 'secret', 'clue'), link('capture-link', 'capture', 'clue'), link('layer-link', 'agenda', 'sabbat')] }
}
test('legacy board upgrades only in memory without moving or discarding anything', () => {
  const old = { ...emptyBackdrop(), groups: [{ id: 'g', title: 'Grupo antiguo', x: 1, y: 2, width: 640, height: 460 }], notes: [note('n', 'g')], links: [] }
  const before = JSON.stringify(old), upgraded = upgradeBackdrop(old)
  assert.equal(upgraded.version, 2); assert.equal(upgraded.groups[0].parentId, null)
  assert.equal(upgraded.groups[0].x, 1); assert.deepEqual(upgraded.notes, old.notes)
  assert.equal(JSON.stringify(old), before)
  assert.equal(backdropFingerprint(upgraded), backdropFingerprint(upgradeBackdrop(upgraded)))
})
test('contexts can be added above an existing mission or nested below without rewriting the guion', () => {
  const state = fixture(), before = JSON.stringify(state)
  const next = wrapLayer(state, 'mission', 'new-context')
  assert.equal(next.groups.find(g => g.id === 'mission').parentId, 'new-context')
  assert.equal(next.groups.find(g => g.id === 'new-context').parentId, 'world')
  assert.deepEqual(next.notes, state.notes); assert.deepEqual(next.links, state.links)
  assert.deepEqual(ancestry(next, 'mission').map(g => g.id), ['world', 'new-context', 'mission'])
  assert.equal(JSON.stringify(state), before)
})
test('self-parenting, indirect cycles, missing parent and duplicate identities are rejected', () => {
  const state = fixture()
  assert.throws(() => reparentLayer(state, 'world', 'world'))
  assert.throws(() => reparentLayer(state, 'world', 'agenda'))
  assert.throws(() => reparentLayer(state, 'agenda', 'missing'))
  assert.throws(() => layerBounds({ ...state, groups: [group('a', 'b'), group('b', 'a')] }))
  assert.throws(() => upgradeBackdrop({ ...state, version: 3 }))
})
test('dragging a context moves its entire subtree once and leaves external branches unchanged', () => {
  const state = fixture(), moved = moveBackdropGroup(state, 'world', 20, 30)
  assert.deepEqual([...descendants(state, 'world')].sort(), ['agenda', 'mission', 'world'])
  assert.equal(moved.notes.find(n => n.id === 'secret').x, 870)
  assert.equal(moved.notes.find(n => n.id === 'clue').y, 270)
  assert.equal(moved.notes.find(n => n.id === 'capture').x, 1850)
  assert.equal(moved.groups.find(g => g.id === 'agenda').x, 820)
  assert.deepEqual(moved.links, state.links)
})
test('removing a context preserves its descendants and only removes links aimed at that context', () => {
  const state = fixture()
  state.links.push(link('context', 'world', 'sabbat'))
  const next = removeBackdropGroup(state, 'world')
  assert.equal(next.groups.find(g => g.id === 'mission').parentId, null)
  assert.equal(next.groups.find(g => g.id === 'agenda').parentId, null)
  assert.equal(next.notes.length, state.notes.length)
  assert.equal(next.links.length, state.links.length - 1)
})
test('automatic zoom collapses layers, unfolds children and restores every original relation', () => {
  const state = fixture(), before = JSON.stringify(state)
  const far = projectLayers(state, .1), near = projectLayers(state, 1)
  assert.equal(far.layers.length, 2)
  assert.equal(far.layers.every(l => !l.expanded), true)
  assert.deepEqual(far.notes.map(n => n.id), ['free'])
  assert.equal(near.layers.length, 4)
  assert.equal(near.notes.length, 4)
  assert.equal(near.links.flatMap(l => l.originals).length, 3)
  assert.equal(JSON.stringify(state), before)
  assert.deepEqual(projectLayers(state, .1, false).notes.map(n => n.id).sort(), state.notes.map(n => n.id).sort())
})
test('aggregate links retain direction, labels and provenance; internal hidden links do not become self-arrows', () => {
  const state = fixture()
  state.links.push(link('second', 'capture', 'secret', true))
  const far = projectLayers(state, .1)
  const aggregate = far.links.find(l => l.from === 'sabbat' && l.to === 'world')
  assert.ok(aggregate)
  assert.equal(aggregate.originals.length, 2)
  assert.equal(aggregate.tentative, false)
  assert.equal(far.links.some(l => l.from === l.to), false)
  assert.equal(far.links.find(l => l.from === 'world' && l.to === 'sabbat').originals[0].id, 'layer-link')
})
test('story references on a layer include its descendants but never unrelated branches', () => {
  const state = fixture()
  state.groups.find(g => g.id === 'mission').references = [{ kind: 'story', id: 'story' }]
  const view = projectLayers(state, 1, true, 'story')
  assert.deepEqual(view.notes.map(n => n.id), ['clue'])
  assert.deepEqual(view.layers.map(l => l.id), ['world', 'mission'])
  assert.equal(view.links.length, 0)
})
test('every derived container encloses its saved children and preserves their coordinates', () => {
  const state = fixture(), before = JSON.stringify(state), boxes = layerBounds(state)
  for (const n of state.notes.filter(n => n.groupId)) {
    const b = boxes.get(n.groupId)
    assert.ok(b.x <= n.x - 32); assert.ok(b.y <= n.y - 100)
    assert.ok(b.x + b.width >= n.x + 292); assert.ok(b.y + b.height >= n.y + 172)
  }
  assert.equal(JSON.stringify(state), before)
})
