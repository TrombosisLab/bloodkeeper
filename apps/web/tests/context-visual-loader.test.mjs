import test from 'node:test'
import assert from 'node:assert/strict'
import { prepareVisualPackage } from '../src/features/chronicles/infrastructure/context-visual-package.api.ts'

const chronicle = { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'Prueba', description: '', narratorId: 'owner' }
const imageId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
const imageUrl = `/api/chronicles/${chronicle.id}/assets/NPC/${imageId}/image`
const baseContext = () => ({ characters: [], npcs: [], locations: [], resources: [], imageCandidates: [], players: [] })

async function run(options = {}) {
  const previous = { fetch: globalThis.fetch, window: globalThis.window, bitmap: globalThis.createImageBitmap }
  const requests = [], labels = []
  const ctx = { fillRect() {}, drawImage() {}, strokeRect() {}, beginPath() {}, arc() {}, fill() {}, stroke() {}, fillText(text) { labels.push(text) } }
  globalThis.window = { document: { createElement() { return { getContext() { return ctx }, toBlob(callback) { callback(new Blob(['JPEG_FIXTURE'], { type: 'image/jpeg' })) } } } } }
  globalThis.createImageBitmap = async () => ({ width: 800, height: 600, close() {} })
  globalThis.fetch = async (url, init) => {
    requests.push(url)
    assert.equal(init.credentials, 'include')
    assert.equal(init.cache, 'no-store')
    const path = url.slice(`/api/chronicles/${chronicle.id}`.length)
    let value
    if (path.startsWith('/sessions?') || path.startsWith('/stories/shared?')) value = { items: [], nextOffset: null }
    else if (path === '/notebook') value = { items: [], canManage: options.narrator === true, viewerUserId: options.narrator ? 'owner' : 'player' }
    else if (path.startsWith('/stories?')) value = { items: [], nextOffset: null }
    else if (path === '/notebook/context') value = options.context ?? baseContext()
    else if (path === '/space-board') value = { connections: [] }
    else if (path === '/relationships/shared') value = []
    else if (path === '/maps') {
      if (options.mapStatus) return new Response('Denied', { status: options.mapStatus })
      value = options.workspace ?? { chronicleId: chronicle.id, maps: [] }
    } else if (path.startsWith('/assets/')) {
      assert.equal(init.redirect, 'error')
      return new Response('image', { status: options.imageStatus ?? 200, headers: { 'content-type': 'image/png' } })
    } else throw new Error('Unexpected request: ' + url)
    return new Response(JSON.stringify(value), { headers: { 'content-type': 'application/json' } })
  }
  try {
    const controller = new AbortController()
    if (options.abort) controller.abort()
    const result = await prepareVisualPackage(chronicle, options.scope ?? 'shared', options.instructions ?? false, controller.signal, () => {})
    return { result, requests, labels, text: new TextDecoder().decode(await result.blob.arrayBuffer()) }
  } finally {
    globalThis.fetch = previous.fetch; globalThis.window = previous.window; globalThis.createImageBitmap = previous.bitmap
  }
}

test('loader produces a shared ZIP without AI instructions when disabled', async () => {
  const { text, result } = await run()
  assert.equal(result.images, 0)
  assert.match(text, /contexto.md/)
  assert.match(text, /indice-de-material.md/)
  assert.doesNotMatch(text, /instrucciones-para-pdf.md|Instrucciones para el asistente de IA/)
})
test('loader adds both prompts only when explicitly selected', async () => {
  const { text } = await run({ instructions: true })
  assert.match(text, /instrucciones-para-pdf.md/)
  assert.match(text, /Instrucciones para el asistente de IA/)
})
test('denied maps cancel the complete package', async () => {
  await assert.rejects(run({ mapStatus: 403 }), /autorizada/)
})
test('cancelled operation stops before fetching any sources', async () => {
  await assert.rejects(run({ abort: true }), { name: 'AbortError' })
})
test('non-narrator cannot prepare the private ZIP', async () => {
  await assert.rejects(run({ scope: 'narrator' }), /Solo el narrador/)
})
test('authorized narrator ZIP clearly identifies private material', async () => {
  const { text } = await run({ scope: 'narrator', narrator: true })
  assert.match(text, /PRIVADO/)
})
test('maps from another chronicle cannot be exported', async () => {
  await assert.rejects(run({ workspace: { chronicleId: 'another', maps: [] } }), /otra crónica/)
})
const photoContext = (url = imageUrl) => ({ ...baseContext(), npcs: [{ id: imageId, name: 'Elena', description: '' }], imageCandidates: [{ targetType: 'NPC', targetId: imageId, name: 'Elena', imageUrl: url }] })
test('external image URLs are rejected instead of fetched', async () => {
  await assert.rejects(run({ context: photoContext('https://example.com/image.png') }), /no autorizada/)
})
test('404 photos are explicitly reported as unavailable', async () => {
  const { result, text } = await run({ context: photoContext(), imageStatus: 404 })
  assert.equal(result.unavailable, 1)
  assert.match(text, /sin imagen disponible/)
})
test('403 photos cancel rather than producing a partial archive', async () => {
  await assert.rejects(run({ context: photoContext(), imageStatus: 403 }), /autorizada/)
})
test('photo originals are replaced by re-rendered JPEG files', async () => {
  const { result, text } = await run({ context: photoContext() })
  assert.equal(result.images, 1)
  assert.match(text, /imagenes\/foto-1.jpg/)
  assert.match(text, /JPEG_FIXTURE/)
})
test('composite and legend exclude private markers and areas from narrator-rich responses', async () => {
  const map = { id: imageId, chronicleId: chronicle.id, name: 'Ciudad', status: 'active', hasImage: true, imageUrl: imageUrl.replace('/NPC/', '/MAP/'), markers: [
    { visibility: 'chronicle_participants', label: 'Puerto', kind: 'LOCATION', x: .2, y: .3 },
    { visibility: 'narrator_only', label: 'SECRET_MARKER', kind: 'LOCATION', x: .5, y: .5 },
  ], areas: [
    { visibility: 'chronicle_participants', name: 'Barrio', geometry: { type: 'RECT', x: .1, y: .1, width: .3, height: .3 } },
    { visibility: 'narrator_only', name: 'SECRET_AREA', geometry: { type: 'RECT', x: .2, y: .2, width: .3, height: .3 } },
  ] }
  const { result, text, labels } = await run({ workspace: { chronicleId: chronicle.id, maps: [map] } })
  assert.equal(result.maps, 1)
  assert.deepEqual(labels, ['Z1', '1'])
  assert.match(text, /Puerto|Barrio/)
  assert.doesNotMatch(text, /SECRET/)
})

test('ZIP paints the approved Catacumba marker without fetching its resource dossier', async () => {
  const map = { id: imageId, chronicleId: chronicle.id, name: 'Ciudad', status: 'active', hasImage: true, imageUrl: imageUrl.replace('/NPC/', '/MAP/'), markers: [
    { visibility: 'chronicle_participants', label: 'Prueba de solicitud', resourceId: 'catacumba-outside-context', resource: { name: 'Catacumba', summary: 'DOSSIER_SECRET', imageUrl: 'https://example.com/secret' }, kind: 'REFUGE', x: .53, y: .67 },
    { visibility: 'chronicle_participants', label: 'Riazor', kind: 'LOCATION', x: .47, y: .55 },
    { visibility: 'chronicle_participants', label: 'Orzán', kind: 'LANDMARK', x: .60, y: .47 },
  ], areas: [] }
  const { text, labels, requests } = await run({ workspace: { chronicleId: chronicle.id, maps: [map] } })
  assert.deepEqual(labels, ['1', '2', '3'])
  assert.match(text, /1: Prueba de solicitud \(Refugio\)/)
  assert.match(text, /2: Riazor \(Lugar\)/)
  assert.match(text, /3: Orzán \(Punto de interés\)/)
  assert.doesNotMatch(text, /DOSSIER_SECRET|example.com/)
  assert.equal(requests.filter(url => url.includes('/assets/')).length, 1)
})
