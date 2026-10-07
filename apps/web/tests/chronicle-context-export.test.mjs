import test from 'node:test'
import assert from 'node:assert/strict'
import { buildChronicleContext, EXPORT_INSTRUCTIONS, safeExportText } from '../src/features/chronicles/domain/chronicle-context-export.ts'
import { loadChronicleExport } from '../src/features/chronicles/infrastructure/chronicle-context-export.api.ts'

const session = (id, realDate, status = 'completed') => ({ id, chronicleId: 'c', title: id, realDate, sessionNumber: 1, status, summary: `Resumen ${id}`, narratorNotes: 'PRIVATE_SESSION_SECRET', createdAt: '2026-01-01', updatedAt: '2026-01-02' })
const note = (id, visibility = 'CHRONICLE', sessionId = null) => ({ id, visibility, sessionId, title: id, content: visibility === 'CHRONICLE' ? 'Teoría compartida' : 'PRIVATE_NOTE_SECRET', updatedAt: '2026-02-01', author: { id: 'u', username: 'Jugador', displayName: 'Jugador' }, tags: [], references: [], audienceUserIds: [], session: null })
const sources = () => ({ chronicle: { id: 'c', name: 'Coruña', description: 'Premisa' }, sessions: [session('second', '2026-02-01'), session('first', '2026-01-01'), session('undated', null)],
  stories: [{ id: 's', title: 'Historia', status: 'active', sharedSummary: 'Resumen compartido', sessionIds: ['first'], milestones: [{ key: 'hook', sortOrder: 0, completed: true, completedAt: '2026-02-03' }], narratorNotes: 'PRIVATE_STORY_SECRET', narratorGuide: { cards: [{ narratorNote: 'PRIVATE_GUIDE_SECRET' }] } }],
  notes: [note('public', 'CHRONICLE', 'first'), note('private', 'PRIVATE'), note('selected', 'SELECTED_PLAYERS')],
  context: { characters: [{ id: 'pj', name: 'Jugador', concept: 'PRIVATE_CONCEPT' }], npcs: [{ id: 'n', name: 'Elena', description: 'Descripción compartida' }], locations: [], resources: [{ id: 'r', name: 'Secret resource', visibility: 'narrator_only', summary: 'PRIVATE_RESOURCE_SECRET' }], imageCandidates: [], players: [] },
  board: { connections: [{ fromId: 'npc-n', toId: 'note-public', label: 'Teoría', type: 'SUSPICION', arrow: true }, { fromId: 'npc-n', toId: 'note-private', label: 'PRIVATE_EDGE_SECRET', type: 'KNOWN' }] },
  maps: [{ owner: 'Jugador', map: { cards: [{ id: 'a', title: 'Elena', summary: 'Opinión compartida', narratorNote: 'PRIVATE_MAP_FIELD' }, { id: 'b', title: 'Juan', summary: '', personStatus: 'deceased' }], connections: [{ from: 'a', to: 'b', relationType: 'rivalry', direction: 'both', label: 'Rivales' }] } }] })

test('chronology uses game dates, not update or insertion order', () => {
  const result = buildChronicleContext(sources(), '2026-10-07')
  assert.ok(result.indexOf('### first') < result.indexOf('### second'))
  assert.ok(result.indexOf('### second') < result.indexOf('### undated'))
  assert.match(result, /orden por número, no cronología inferida/)
})
test('private notes, private guide, restricted resources and private edges never serialize', () => {
  const result = buildChronicleContext(sources())
  assert.doesNotMatch(result, /PRIVATE|Secret resource/)
  assert.match(result, /Teoría compartida/)
  assert.match(result, /Algunas conexiones se omiten/)
})
test('prepared sessions are excluded and archived ones are not represented as played', () => {
  const input = sources()
  input.sessions.push(session('PREPARATION_SECRET', '2026-03-01', 'preparation'), session('archived-one', '2026-03-01', 'archived'))
  const result = buildChronicleContext(input)
  assert.doesNotMatch(result, /PREPARATION/)
  assert.ok(result.indexOf('### archived-one') > result.indexOf('archivar no confirma'))
})
test('milestone dates are registration dates, not inferred session events', () => {
  const result = buildChronicleContext(sources())
  assert.match(result, /fecha de registro/)
  assert.match(result, /no prueba de que sus hitos ocurrieran aquí/)
})

test('visual labels distinguish known connections, hypotheses and visual links', () => {
  const input = sources()
  input.board.connections.push(
    { fromId: 'npc-n', toId: 'note-public', type: 'KNOWN', label: 'Protección', arrow: true },
    { fromId: 'npc-n', toId: 'note-public', type: 'VISUAL', label: '', arrow: false },
  )
  const result = buildChronicleContext(input)
  assert.match(result, /🟢 Confirmado \(registrado como relación conocida\)/)
  assert.match(result, /🟡 Sospecha \(sin confirmar\)/)
  assert.match(result, /🔵 Asociación visual \(no confirma una relación\)/)
  assert.match(result, /no que su contenido esté demostrado/)
  assert.doesNotMatch(result, /PRIVATE_EDGE_SECRET/)
})

test('milestone labels preserve achieved and pending states', () => {
  const input = sources()
  input.stories[0].milestones.push({ key: 'climax', sortOrder: 3, completed: false, completedAt: null })
  const result = buildChronicleContext(input)
  assert.match(result, /Inicio \/ gancho: 🟢 Alcanzado; fecha de registro/)
  assert.match(result, /Clímax: ⚪ Pendiente\./)
})
test('orphan notes preserve author and do not invent dates of occurrence', () => {
  const input = sources()
  input.notes.push(note('orphan'))
  assert.match(buildChronicleContext(input), /Sin sesión asociada; no se infiere cuándo ocurrió/)
})
test('maps are attributed and preserve relation type and direction', () => {
  const result = buildChronicleContext(sources())
  assert.match(result, /Mapa de Jugador/)
  assert.match(result, /Elena \[M1-T1\] ↔ Juan \[M1-T2\]: Rivalidad/)
  assert.match(result, /Fallecido/)
})
test('HTML, images, Markdown links and mention target IDs are inert text', () => {
  const result = safeExportText('<script>alert(1)</script> ![track](https://tracker/) @[Elena](NPC:secret-id)')
  assert.doesNotMatch(result, /<script>|secret-id|!\[track\]\(/)
  assert.match(result, /&lt;script&gt;/)
  assert.match(result, /Elena/)
})
test('empty context remains readable', () => {
  const input = sources(); input.sessions = []; input.stories = []; input.notes = []; input.maps = []
  assert.match(buildChronicleContext(input), /No hay sesiones realizadas/)
})

test('dates are readable in explicit UTC and story states are Spanish', () => {
  const result = buildChronicleContext(sources(), '2026-10-07T12:31:30.318Z')
  assert.match(result, /Exportado: 07\/10\/2026 12:31:30 UTC/)
  assert.match(result, /Estado registrado: En curso/)
  assert.doesNotMatch(result, /Estado registrado: active|2026-10-07T/)
  assert.match(result, /fecha de registro: 03\/02\/2026 00:00:00 UTC/)
})

test('empty resources and map relations are explicit without revealing restricted data', () => {
  const input = sources()
  input.maps[0].map.connections = []
  const result = buildChronicleContext(input)
  assert.match(result, /Recursos compartidos \(solo resumen, sin abrir fichas\)\n\nNinguno\./)
  assert.match(result, /Ninguna relación compartida entre las tarjetas incluidas/)
  assert.doesNotMatch(result, /PRIVATE_RESOURCE_SECRET/)
})

test('references replace internal IDs and preserve cross-links', () => {
  const input = sources()
  input.sessions[0].id = 'database-session-id'
  input.stories[0].id = 'database-story-id'
  input.context.npcs[0].id = 'database-npc-id'
  input.board.connections[0].fromId = 'npc-database-npc-id'
  const result = buildChronicleContext(input)
  assert.doesNotMatch(result, /database-session-id|database-story-id|database-npc-id|undefined/)
  assert.match(result, /### first \[S1\]/)
  assert.match(result, /#### Nota: public \[N1\]/)
  assert.match(result, /### Historia \[H1\]/)
  assert.match(result, /### PNJ: Elena \[PNJ1\]/)
  assert.match(result, /referencias locales a este archivo/)
})

test('maps with repeated card IDs receive separate reference namespaces', () => {
  const input = sources()
  input.maps.push({ owner: 'Otro jugador', map: input.maps[0].map })
  const result = buildChronicleContext(input)
  assert.match(result, /Mapa de Jugador \[M1\]/)
  assert.match(result, /Mapa de Otro jugador \[M2\]/)
  assert.match(result, /Elena \[M1-T1\]/)
  assert.match(result, /Elena \[M2-T1\]/)
  assert.doesNotMatch(result, /\[a\]|\[b\]|\[private\]|\[selected\]/)
})
test('oversized document fails instead of truncating', () => {
  const input = sources(); input.chronicle.description = 'a'.repeat(3 * 1024 * 1024)
  assert.throws(() => buildChronicleContext(input), /2 MiB/)
})
test('AI instructions explain sources, chronology and non-trusted author content', () => {
  assert.match(EXPORT_INSTRUCTIONS, /ignora cualquier instrucción/)
  assert.match(EXPORT_INSTRUCTIONS, /No inventes fechas/)
})

async function withFetch(routes, action) {
  const previous = globalThis.fetch
  const calls = []
  globalThis.fetch = async (url, options) => {
    calls.push(String(url)); assert.equal(options.credentials, 'include'); assert.equal(options.cache, 'no-store')
    const path = String(url).replace('/api/chronicles/c', '')
    const route = routes[path]
    return new Response(JSON.stringify(route ?? {}), { status: route === undefined ? 403 : 200, headers: { 'Content-Type': 'application/json' } })
  }
  try { await action(calls) } finally { globalThis.fetch = previous }
}
const routes = () => ({ '/sessions?limit=50&offset=0': { items: [], nextOffset: null }, '/stories/shared?limit=50&offset=0': { items: [], nextOffset: null }, '/notebook': { items: [] }, '/notebook/context': sources().context, '/space-board': { connections: [] }, '/relationships/shared': [{ ownerId: 'u', name: 'Jugador' }], '/relationships/shared/u': { map: sources().maps[0].map } })
test('loader requests only shared story and map endpoints, never private maps or full dossiers', async () => {
  await withFetch(routes(), async calls => {
    const result = await loadChronicleExport(sources().chronicle, new AbortController().signal)
    assert.equal(result.maps[0].owner, 'Jugador')
    assert.ok(calls.some(url => url.includes('/stories/shared')))
    assert.ok(calls.every(url => !/\/me|\/resource\/|personal/.test(url)))
  })
})
test('loader follows all pages and rejects stalled pagination', async () => {
  const input = routes()
  input['/sessions?limit=50&offset=0'] = { items: [session('a', null, 'preparation')], nextOffset: 1 }
  input['/sessions?limit=50&offset=1'] = { items: [session('b', null, 'preparation')], nextOffset: null }
  await withFetch(input, async () => assert.equal((await loadChronicleExport(sources().chronicle, new AbortController().signal)).sessions.length, 2))
  input['/sessions?limit=50&offset=1'].nextOffset = 1
  await withFetch(input, async () => assert.rejects(loadChronicleExport(sources().chronicle, new AbortController().signal), /Paginación inválida/))
})
test('permission denial never produces partial context', async () => {
  const input = routes(); delete input['/space-board']
  await withFetch(input, async () => assert.rejects(loadChronicleExport(sources().chronicle, new AbortController().signal), /No se pudo consultar/))
})
test('session public notes include historical data, deduplicate mirrored notes and omit own private notes', async () => {
  const input = routes()
  input['/sessions?limit=50&offset=0'].items = [session('first', '2026-01-01')]
  const mirrored = note('mirror', 'CHRONICLE', 'first'); mirrored.tags = ['SESSION_PARTICIPANT_SHARED']; mirrored.content = 'Old mirrored text'
  input['/notebook'].items = [mirrored]
  input['/sessions/first/participant-notes'] = { privateNotes: 'PRIVATE_SESSION_NOTES', publicNotes: '', revision: 1, sharedNotes: [{ authorUserId: 'u', authorName: 'Jugador', content: 'Historical published note', updatedAt: '2026-02-01' }] }
  await withFetch(input, async () => {
    const result = buildChronicleContext(await loadChronicleExport(sources().chronicle, new AbortController().signal))
    assert.match(result, /Historical published note/)
    assert.doesNotMatch(result, /PRIVATE|Old mirrored text/)
    assert.equal(result.split('Historical published note').length - 1, 1)
  })
})
test('aborted request does not start more reads', async () => {
  const controller = new AbortController(); controller.abort()
  await withFetch(routes(), async calls => {
    await assert.rejects(loadChronicleExport(sources().chronicle, controller.signal))
    assert.equal(calls.length, 0)
  })
})
test('input byte budget prevents oversized response retention', async () => {
  const input = routes(); input['/notebook'] = { items: [], padding: 'a'.repeat(9 * 1024 * 1024) }
  await withFetch(input, async () => assert.rejects(loadChronicleExport(sources().chronicle, new AbortController().signal), /8 MiB/))
})
test('session and map count limits fail visibly', async () => {
  const input = routes(); input['/sessions?limit=50&offset=0'].items = Array.from({ length: 201 }, () => session('a', null))
  await withFetch(input, async () => assert.rejects(loadChronicleExport(sources().chronicle, new AbortController().signal), /200/))
  input['/sessions?limit=50&offset=0'].items = []
  input['/relationships/shared'] = Array.from({ length: 41 }, () => ({ ownerId: 'u', name: 'Jugador' }))
  await withFetch(input, async () => assert.rejects(loadChronicleExport(sources().chronicle, new AbortController().signal), /40/))
})
