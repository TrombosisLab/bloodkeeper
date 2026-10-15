import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { parseBackdrop, emptyBackdrop } = require('../dist/chronicles/domain/chronicle-backdrop.js')
const { ChronicleBackdropController } = require('../dist/chronicles/presentation/chronicle-backdrop.controller.js')
const id = n => '00000000-0000-4000-8000-' + String(n).padStart(12, '0')
const group = (n, parent = null) => ({ id: id(n), title: 'Capa', parentId: parent ? id(parent) : null, summary: '', references: [], x: 0, y: 0, width: 640, height: 460 })
const board = () => ({ version: 2, notes: [], groups: [group(1), group(2, 1)], links: [] })
test('validator accepts arbitrary acyclic nesting and layer-to-layer relations', () => {
  const state = board()
  state.links.push({ id: id(3), from: id(1), to: id(2), label: 'influye', tentative: false })
  assert.deepEqual(parseBackdrop(state), state)
})
test('cycles, missing parents, self-links, duplicate note/layer identity and forged old format fail', () => {
  const state = board()
  assert.throws(() => parseBackdrop({ ...state, groups: [group(1, 2), group(2, 1)] }))
  assert.throws(() => parseBackdrop({ ...state, groups: [group(1, 3)] }))
  assert.throws(() => parseBackdrop({ ...state, links: [{ id: id(3), from: id(1), to: id(1), label: '', tentative: false }] }))
  assert.throws(() => parseBackdrop({ ...state, version: 1 }))
})
test('old boards retain exact v1 output until the narrator explicitly saves the upgraded view', () => {
  const state = emptyBackdrop()
  state.groups = [{ id: id(1), title: 'Grupo', x: 1, y: 2, width: 640, height: 460 }]
  assert.deepEqual(parseBackdrop(state), state)
})
function fixture(role = 'narrator') {
  let writes = 0
  const db = {
    chronicle: { findUnique: async () => ({ narratorId: id(9) }) },
    chronicleBackdrop: { findUnique: async () => ({ state: board() }), updateMany: async () => { writes++; return { count: 1 } }, create: async () => { writes++ } },
    chronicleStory: { findMany: async () => [] }, libraryResource: { findMany: async () => [] }, chronicleResource: { findMany: async () => [] },
  }
  return { controller: new ChronicleBackdropController(db, { findActiveMembership: async () => role ? { role } : null }), db, writes: () => writes }
}
test('version-two writes require a compatible client and old tabs cannot downgrade stored layers', async () => {
  const f = fixture(), req = { user: { id: id(9) } }
  await assert.rejects(() => f.controller.save(req, id(8), { expectedRevision: 1, state: board() }), e => e.getStatus() === 409)
  await assert.rejects(() => f.controller.save(req, id(8), { expectedRevision: 1, state: emptyBackdrop() }), e => e.getStatus() === 409)
  assert.equal(f.writes(), 0)
  const saved = await f.controller.save(req, id(8), { expectedRevision: 1, state: board(), protocolVersion: 2 })
  assert.equal(saved.state.version, 2); assert.equal(f.writes(), 1)
})
test('group references are authorized just like note references, not a bypass around ownership', async () => {
  const f = fixture(), state = board()
  state.groups[0].references.push({ kind: 'library', id: id(5) })
  await assert.rejects(() => f.controller.save({ user: { id: id(9) } }, id(8), { expectedRevision: 1, state, protocolVersion: 2 }), e => e.getStatus() === 400)
  assert.equal(f.writes(), 0)
})
test('player, outsider and inactive accounts still cannot read or save nested private layers', async () => {
  for (const role of ['player', null]) {
    const f = fixture(role)
    await assert.rejects(() => f.controller.read({ user: { id: id(9) } }, id(8)), e => e.getStatus() === 403)
    await assert.rejects(() => f.controller.save({ user: { id: id(9) } }, id(8), { expectedRevision: 1, state: board(), protocolVersion: 2 }), e => e.getStatus() === 403)
    assert.equal(f.writes(), 0)
  }
})
