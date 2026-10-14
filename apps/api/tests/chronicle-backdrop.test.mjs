import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { parseBackdrop, emptyBackdrop } = require('../dist/chronicles/domain/chronicle-backdrop.js')
const { ChronicleBackdropController } = require('../dist/chronicles/presentation/chronicle-backdrop.controller.js')
const uid = '00000000-0000-4000-8000-000000000001', cid = '00000000-0000-4000-8000-000000000002'
const note = id => ({ id, title: 'Idea', text: '', status: 'idea', time: 'unspecified', knownBy: '', x: 100, y: 100, groupId: null, references: [] })
function fixture(role = 'narrator', owner = uid) {
  const calls = []
  const db = {
    chronicle: { findUnique: async () => ({ narratorId: owner }) },
    chronicleBackdrop: {
      findUnique: async () => { calls.push('read'); return null },
      create: async () => { calls.push('create'); return {} },
      updateMany: async query => { calls.push(query); return { count: 1 } },
    },
    chronicleStory: { findMany: async () => [], findFirst: async () => null },
    libraryResource: { findMany: async () => [], findFirst: async () => null },
    chronicleResource: { findMany: async () => [], findFirst: async () => null },
  }
  const participants = { findActiveMembership: async () => role ? { role } : null }
  return { controller: new ChronicleBackdropController(db, participants), db, calls }
}
test('only active owner narrator can read, save or list private references', async () => {
  for (const [role, owner] of [['player', uid], [null, uid], ['narrator', cid]]) {
    const f = fixture(role, owner)
    for (const action of [
      () => f.controller.read({ user: { id: uid } }, cid),
      () => f.controller.references({ user: { id: uid } }, cid),
      () => f.controller.save({ user: { id: uid } }, cid, { state: emptyBackdrop(), expectedRevision: 0 }),
    ]) await assert.rejects(action, e => e.getStatus() === 403)
    assert.equal(f.calls.length, 0)
  }
  await assert.rejects(() => fixture().controller.read({}, cid), e => e.getStatus() === 401)
})
test('empty board is virtual; initial GET does not create a row', async () => {
  const f = fixture()
  assert.deepEqual(await f.controller.read({ user: { id: uid } }, cid), { state: emptyBackdrop(), revision: 0 })
  assert.deepEqual(f.calls, ['read'])
})
test('schema rejects dangling edges, duplicate notes, impossible coordinates and false states', () => {
  const a = note(uid), b = note(cid)
  const state = { ...emptyBackdrop(), notes: [a, b] }
  assert.deepEqual(parseBackdrop(state), state)
  assert.throws(() => parseBackdrop({ ...state, notes: [a, a] }))
  assert.throws(() => parseBackdrop({ ...state, notes: [{ ...a, x: Infinity }] }))
  assert.throws(() => parseBackdrop({ ...state, notes: [{ ...a, status: 'public' }] }))
  assert.throws(() => parseBackdrop({ ...state, notes: [{ ...a, groupId: uid }] }))
  assert.throws(() => parseBackdrop({ ...state, links: [{ id: uid, from: uid, to: '00000000-0000-4000-8000-000000000003', label: '', tentative: false }] }))
  assert.throws(() => parseBackdrop({ ...state, notes: Array.from({ length: 201 }, () => a) }))
})
test('existing board uses atomic expectedRevision; stale save fails and cannot overwrite', async () => {
  const f = fixture()
  f.db.chronicleBackdrop.updateMany = async query => { assert.equal(query.where.revision, 3); assert.equal(query.where.chronicleId, cid); return { count: 0 } }
  await assert.rejects(() => f.controller.save({ user: { id: uid } }, cid, { state: emptyBackdrop(), expectedRevision: 3 }), e => e.getStatus() === 409)
})
test('cross-chronicle story/card and foreign library references are rejected before writes', async () => {
  for (const kind of ['story', 'card', 'library', 'resource']) {
    const f = fixture(), a = note(uid)
    a.references = [{ kind, id: cid, ...(kind === 'card' ? { cardId: 'scene-1' } : {}) }]
    await assert.rejects(() => f.controller.save({ user: { id: uid } }, cid, { state: { ...emptyBackdrop(), notes: [a] }, expectedRevision: 0 }), e => e.getStatus() === 400)
    assert.equal(f.calls.length, 0)
  }
})
test('knowledge text is fictional metadata and cannot publish anything', async () => {
  const f = fixture(), a = { ...note(uid), knownBy: 'Todos los jugadores' }
  const result = await f.controller.save({ user: { id: uid } }, cid, { state: { ...emptyBackdrop(), notes: [a] }, expectedRevision: 0 })
  assert.equal(result.revision, 1)
  assert.deepEqual(f.calls, ['create'])
})
test('valid references are batched and each query enforces the correct ownership scope', async () => {
  const f = fixture(), a = note(uid)
  a.references = [{ kind: 'story', id: cid }, { kind: 'card', id: cid, cardId: 'scene-1' }, { kind: 'library', id: uid }, { kind: 'resource', id: uid }]
  f.db.chronicleStory.findMany = async query => { assert.equal(query.where.chronicleId, cid); return [{ id: cid, narratorGuide: { cards: [{ id: 'scene-1' }] } }] }
  f.db.libraryResource.findMany = async query => { assert.equal(query.where.ownerId, uid); return [{ id: uid }] }
  f.db.chronicleResource.findMany = async query => { assert.equal(query.where.chronicleId, cid); return [{ id: uid }] }
  const result = await f.controller.save({ user: { id: uid } }, cid, { state: { ...emptyBackdrop(), notes: [a] }, expectedRevision: 0 })
  assert.equal(result.state.notes[0].references.length, 4)
})
