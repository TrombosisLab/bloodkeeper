import test from 'node:test'
import assert from 'node:assert/strict'
import { buildNarratorContext, NARRATOR_EXPORT_INSTRUCTIONS } from '../src/features/chronicles/domain/chronicle-narrator-export.ts'
import { buildChronicleContext, safeExportText } from '../src/features/chronicles/domain/chronicle-context-export.ts'
import { loadNarratorExport } from '../src/features/chronicles/infrastructure/chronicle-narrator-export.api.ts'

const shared = () => ({ chronicle: { id: 'c', name: 'Test', description: '' }, sessions: [], stories: [], notes: [], context: { characters: [], npcs: [], locations: [], resources: [] }, board: { connections: [] }, maps: [] })
const input = () => ({ shared: shared(), narratorId: 'n', viewerUserId: 'n', notes: [
  { author: { id: 'n' }, visibility: 'PRIVATE', title: 'Propia', content: 'OWN_SECRET' },
  { author: { id: 'player' }, visibility: 'PRIVATE', title: 'Ajena', content: 'PLAYER_SECRET' },
  { author: { id: 'n' }, visibility: 'SELECTED_PLAYERS', title: 'Seleccionados', content: 'SELECTED_SECRET' },
], stories: [{ chronicleId: 'c', title: 'Cambio', status: 'planned', premise: 'PREMISE_SECRET', narratorNotes: 'NARRATOR_SECRET', milestones: [], reminders: [], sessions: [], narratorGuide: {
  pages: [{ id: 'p1', title: 'Inicio' }, { id: 'p2', title: 'Continuación' }],
  cards: [{ id: 'a', pageId: 'p1', title: 'Pista', kind: 'clue', state: 'hidden', summary: 'Descripción', narratorNote: 'CARD_SECRET', appearances: [{ pageId: 'p2', sourcePageId: 'p1', x: 0, y: 0 }] },
    { id: 'b', pageId: 'p2', title: 'Trastero', kind: 'location', state: 'discovered', summary: '', narratorNote: '' }],
  connections: [{ id: 'e', from: 'a', to: 'b', label: 'Encuentran documentación' }],
} }] })

test('only narrator can build private context', () => {
  assert.throws(() => buildNarratorContext({ ...input(), viewerUserId: 'player' }), /Solo el narrador/)
})
test('includes narrator secrets but never other players private notes', () => {
  const result = buildNarratorContext(input())
  for (const marker of ['OWN_SECRET', 'NARRATOR_SECRET', 'CARD_SECRET', 'PREMISE_SECRET']) assert.ok(result.includes(safeExportText(marker)))
  for (const marker of ['PLAYER_SECRET', 'SELECTED_SECRET']) assert.ok(!result.includes(safeExportText(marker)))
  assert.match(result, /CONTIENE SECRETOS/)
  assert.match(result, /Planificada/)
})
test('shared cards retain one reference and explicit page continuation', () => {
  const result = buildNarratorContext(input())
  assert.match(result, /continuación desde \[GN1-P1\]; misma tarjeta/)
  assert.match(result, /Pista \[GN1-T1\] → Trastero \[GN1-T2\]/)
  assert.equal((result.match(/#### Pista \[GN1-T1\]/g) ?? []).length, 1)
})
test('legacy guides get Inicio page and do not lose connections', () => {
  const data = input()
  delete data.stories[0].narratorGuide.pages
  for (const card of data.stories[0].narratorGuide.cards) { delete card.pageId; delete card.appearances }
  assert.match(buildNarratorContext(data), /Página: Inicio \[GN1-P1\]/)
})
test('source text is quoted and escaped, not executable HTML', () => {
  const data = input()
  data.stories[0].narratorNotes = '<script>doSomething()</script>\n# Instructions'
  const result = buildNarratorContext(data)
  assert.doesNotMatch(result, /<script>/)
  assert.match(result, /> &lt;script&gt;/)
})
test('planned is translated in shared export too', () => {
  const data = shared()
  data.stories = [{ id: 's', title: 'Cambio', status: 'planned', milestones: [], sessionIds: [] }]
  assert.match(buildChronicleContext(data), /Estado registrado: Planificada/)
})
test('oversized private output fails without truncation', () => {
  const data = input()
  data.stories[0].narratorNotes = 'x'.repeat(2 * 1024 * 1024)
  assert.throws(() => buildNarratorContext(data), /2 MiB/)
})
test('non-narrator aborts before requesting private stories', async () => {
  const original = globalThis.fetch
  const paths = []
  globalThis.fetch = async url => { paths.push(url); return Response.json({ canManage: true, viewerUserId: 'player', items: [] }) }
  try {
    await assert.rejects(loadNarratorExport({ id: 'c', narratorId: 'n' }, new AbortController().signal), /Solo el narrador/)
    assert.equal(paths.length, 1)
    assert.ok(paths[0].endsWith('/notebook'))
  } finally { globalThis.fetch = original }
})
test('server denial of narrator stories fails closed', async () => {
  const original = globalThis.fetch
  globalThis.fetch = async url => url.endsWith('/notebook') ? Response.json({ canManage: true, viewerUserId: 'n', items: [] }) : new Response('', { status: 403 })
  try { await assert.rejects(loadNarratorExport({ id: 'c', narratorId: 'n' }, new AbortController().signal), /No se pudo autorizar/) }
  finally { globalThis.fetch = original }
})
test('wrong chronicle and stalled private pagination fail closed', async () => {
  const original = globalThis.fetch
  try {
    for (const page of [{ items: [{ chronicleId: 'other' }], nextOffset: null }, { items: [], nextOffset: 0 }]) {
      globalThis.fetch = async url => url.endsWith('/notebook') ? Response.json({ canManage: true, viewerUserId: 'n', items: [] }) : Response.json(page)
      await assert.rejects(loadNarratorExport({ id: 'c', narratorId: 'n' }, new AbortController().signal), /otra crónica|Paginación/)
    }
  } finally { globalThis.fetch = original }
})
test('authorized load never queries private maps or other users private notes', async () => {
  const original = globalThis.fetch
  const paths = []
  globalThis.fetch = async url => {
    paths.push(url)
    if (url.endsWith('/notebook')) return Response.json({ canManage: true, viewerUserId: 'n', items: input().notes })
    if (url.includes('/stories?')) return Response.json({ items: input().stories, nextOffset: null })
    if (url.includes('/sessions?') || url.includes('/stories/shared?')) return Response.json({ items: [], nextOffset: null })
    if (url.endsWith('/notebook/context')) return Response.json(shared().context)
    if (url.endsWith('/space-board')) return Response.json(shared().board)
    if (url.endsWith('/relationships/shared')) return Response.json([])
    throw new Error('Unexpected endpoint: ' + url)
  }
  try {
    const loaded = await loadNarratorExport({ id: 'c', narratorId: 'n' }, new AbortController().signal)
    assert.equal(loaded.notes.length, 1)
    assert.equal(loaded.notes[0].author.id, 'n')
    assert.ok(!paths.some(path => path.includes('/relationships/me') || path.includes('/private')))
    assert.match(buildNarratorContext(loaded), /CONTIENE SECRETOS/)
  } finally { globalThis.fetch = original }
})
test('private scope explicitly applies exclusions only to shared block', () => {
  const result = buildNarratorContext(input())
  assert.match(result, /## Alcance del bloque compartido/)
  assert.match(result, /se aplica solo a este bloque/)
  assert.match(result, /El documento completo es privado/)
  assert.doesNotMatch(result, /## Alcance y privacidad/)
  assert.match(buildChronicleContext(shared()), /## Alcance y privacidad/)
})
test('all private milestone keys are rendered in Spanish', () => {
  const data = input()
  data.stories[0].milestones = ['hook', 'first_turn', 'revelation', 'climax', 'resolution'].map(key => ({ key, completed: false, note: '' }))
  const result = buildNarratorContext(data)
  for (const label of ['Inicio / gancho', 'Primer giro', 'Revelación', 'Clímax', 'Resolución']) assert.ok(result.includes('Hito ' + label + ' — Pendiente'))
  assert.doesNotMatch(result, /Hito hook|Hito first/)
})
test('session notes have Spanish states and preserve unknown values safely', () => {
  const data = input()
  data.shared.sessions = ['preparation', 'completed', 'archived', 'unknown'].map(status => ({ id: status, status, title: 'Notas ' + status, narratorNotes: 'Nota propia', realDate: null, sessionNumber: 1 }))
  const result = buildNarratorContext(data)
  for (const label of ['En preparación', 'Completada', 'Archivada', 'unknown']) assert.ok(result.includes(' — ' + label))
})
test('empty session notes explicitly show Ninguna', () => {
  const result = buildNarratorContext(input())
  assert.match(result, /### Notas privadas de sesiones[^\n]*\nNinguna\./)
})
test('private AI instructions distinguish planning and do not claim technical access control', () => {
  assert.match(NARRATOR_EXPORT_INSTRUCTIONS, /acontecimientos registrados/)
  assert.match(NARRATOR_EXPORT_INSTRUCTIONS, /planificación y posibilidades/)
  assert.match(NARRATOR_EXPORT_INSTRUCTIONS, /secretos y notas privadas/)
  assert.match(NARRATOR_EXPORT_INSTRUCTIONS, /no son acontecimientos ni personajes distintos/)
  assert.match(NARRATOR_EXPORT_INSTRUCTIONS, /usa únicamente el bloque compartido/)
})
