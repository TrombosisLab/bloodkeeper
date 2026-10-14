import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { backdropFingerprint, backdropId, emptyBackdrop, moveBackdropGroup, removeBackdropGroup, removeBackdropNote, referenceKey } from '../src/features/chronicles/domain/chronicle-backdrop.ts'
const note = (id, groupId = null) => ({ id, groupId, x: 100, y: 100, title: 'Idea', text: '', status: 'idea', time: 'unspecified', knownBy: '', references: [] })
test('JSONB object key order does not mark saved content as dirty', () => {
  const state = { ...emptyBackdrop(), notes: [{ ...note('a'), references: [{ kind: 'card', id: 'story', cardId: 'card' }] }] }
  function reordered(v) {
    if (Array.isArray(v)) return v.map(reordered)
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).reverse().map(([k, value]) => [k, reordered(value)]))
    return v
  }
  assert.notEqual(JSON.stringify(state), JSON.stringify(reordered(state)))
  assert.equal(backdropFingerprint(state), backdropFingerprint(reordered(state)))
  assert.notEqual(backdropFingerprint(state), backdropFingerprint({ ...state, notes: [{ ...state.notes[0], text: 'Cambio real' }] }))
  assert.notEqual(backdropFingerprint(state), backdropFingerprint({ ...state, notes: [{ ...state.notes[0], x: 101 }] }))
})
test('array ordering is preserved and save synchronizes only after success', () => {
  const state = { ...emptyBackdrop(), notes: [note('a'), note('b')] }
  assert.notEqual(backdropFingerprint(state), backdropFingerprint({ ...state, notes: [...state.notes].reverse() }))
  const ui = readFileSync(new URL('../src/features/chronicles/components/ChronicleBackdropWorkspace.tsx', import.meta.url), 'utf8')
  assert.match(ui, /if \(!controller.signal.aborted\) \{ setState\(result.state\); setSaved\(result\) \}/)
})
test('removing a note removes only its own incident links', () => {
  const state = { ...emptyBackdrop(), notes: [note('a'), note('b'), note('c')], links: [{ id: 'ab', from: 'a', to: 'b' }, { id: 'bc', from: 'b', to: 'c' }] }
  const before = JSON.stringify(state), result = removeBackdropNote(state, 'a')
  assert.deepEqual(result.notes.map(n => n.id), ['b', 'c'])
  assert.deepEqual(result.links.map(l => l.id), ['bc'])
  assert.equal(JSON.stringify(state), before)
})
test('moving and removing a group preserve notes, references and graph meaning', () => {
  const state = { ...emptyBackdrop(), groups: [{ id: 'g', title: 'Trama', x: 0, y: 0, width: 640, height: 460 }], notes: [note('a', 'g'), note('b')] }
  const moved = moveBackdropGroup(state, 'g', 30, 40)
  assert.equal(moved.notes[0].x, 130); assert.equal(moved.notes[0].y, 140)
  assert.equal(moved.notes[1].x, 100)
  const removed = removeBackdropGroup(moved, 'g')
  assert.equal(removed.notes.length, 2); assert.equal(removed.notes[0].groupId, null)
})
test('identifiers work on LAN HTTP without secure-context randomUUID', () => {
  const ids = Array.from({ length: 100 }, backdropId)
  assert.equal(new Set(ids).size, 100)
  ids.forEach(id => assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/))
})
test('reference scope includes kind, story and card rather than ambiguous title', () => {
  assert.notEqual(referenceKey({ kind: 'story', id: 'a' }), referenceKey({ kind: 'library', id: 'a' }))
  assert.notEqual(referenceKey({ kind: 'card', id: 'a', cardId: 'x' }), referenceKey({ kind: 'card', id: 'b', cardId: 'x' }))
})
test('UI is private, explicit save, no secret persistence in browser or player exports', () => {
  const ui = readFileSync(new URL('../src/features/chronicles/components/ChronicleBackdropWorkspace.tsx', import.meta.url), 'utf8')
  const integration = readFileSync(new URL('../src/features/chronicles/components/ChronicleDetail.tsx', import.meta.url), 'utf8')
  assert.match(integration, /canManageStories \? <div id="chronicle-section-backdrop-panel"/)
  assert.match(ui, /beforeunload/)
  assert.match(ui, /no concede acceso ni publica/)
  assert.match(ui, /Guardar pizarra/)
  assert.doesNotMatch(ui, /localStorage|sessionStorage|dangerouslySetInnerHTML/)
})
