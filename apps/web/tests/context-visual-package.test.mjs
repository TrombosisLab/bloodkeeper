import test from 'node:test'
import assert from 'node:assert/strict'
import { planVisualPackage, mapLegend, buildStoredZip, crc32, PDF_PACKAGE_INSTRUCTIONS } from '../src/features/chronicles/domain/context-visual-package.ts'

const context = () => ({ npcs: [{ id: 'npc', name: 'Elena' }], locations: [{ id: 'loc', name: 'Puerto' }], resources: [
  { id: 'r', visibility: 'chronicle_participants' }, { id: 'private', visibility: 'narrator_only' }, { id: 'selected', visibility: 'selected_players' },
], imageCandidates: [{ targetId: 'npc', targetType: 'NPC', name: 'Elena', imageUrl: '/npc' }, { targetId: 'private', targetType: 'DOCUMENT', name: 'SECRET_PHOTO', imageUrl: '/private' }, { targetId: 'selected', targetType: 'DOCUMENT', name: 'SELECTED_PHOTO', imageUrl: '/selected' }] })
const workspace = () => ({ chronicleId: 'c', maps: [{ id: 'm', chronicleId: 'c', name: 'Ciudad', status: 'active', hasImage: true, imageUrl: '/map', linkedResourceId: null, linkedLocationId: null,
  markers: [
    { id: 'a', visibility: 'chronicle_participants', resourceId: null, locationId: 'loc', label: 'Puerto', kind: 'LOCATION' },
    { id: 'b', visibility: 'narrator_only', label: 'SECRET_MARKER', kind: 'LOCATION' },
    { id: 'd', visibility: 'chronicle_participants', resourceId: 'private', label: 'SECRET_LINK', kind: 'LOCATION' },
    { id: 'e', visibility: 'chronicle_participants', resourceId: 'selected', label: 'SELECTED_LINK', kind: 'LOCATION' },
    { id: 'f', visibility: 'new_visibility', label: 'UNKNOWN_MARKER', kind: 'LOCATION' },
  ], areas: [{ name: 'Zona', visibility: 'chronicle_participants' }, { name: 'SECRET_AREA', visibility: 'narrator_only' }],
}] })

test('shared package excludes private and selected-player photos', () => {
  const plan = planVisualPackage(context(), workspace(), 'shared')
  assert.equal(plan.images.length, 1)
  assert.equal(plan.images[0].reference, 'PNJ1')
  assert.doesNotMatch(JSON.stringify(plan.images), /SECRET_PHOTO|SELECTED_PHOTO/)
})
test('shared package excludes private markers even for narrator-rich API responses', () => {
  const plan = planVisualPackage(context(), workspace(), 'shared')
  assert.equal(plan.maps[0].markers.length, 3)
  assert.equal(plan.maps[0].areas.length, 1)
  assert.doesNotMatch(mapLegend(plan.maps[0]), /SECRET\\_MARKER|SECRET\\_AREA|UNKNOWN/)
})

test('approved shared request linked to Catacumba exports even outside notebook context', () => {
  const data = workspace()
  data.maps[0].markers = [{ id: 'approved', visibility: 'chronicle_participants', resourceId: 'catacumba-library', locationId: null, label: 'Prueba de solicitud', kind: 'REFUGE', resource: { name: 'Catacumba', summary: 'DOSSIER_NOT_TO_EXPORT', imageUrl: '/private-image' } }]
  const plan = planVisualPackage(context(), data, 'shared')
  assert.equal(plan.maps[0].markers.length, 1)
  assert.match(mapLegend(plan.maps[0]), /Prueba de solicitud \(Refugio\)/)
  assert.doesNotMatch(mapLegend(plan.maps[0]), /DOSSIER_NOT_TO_EXPORT|private-image/)
  assert.equal(plan.images.length, 1)
})

test('pending requests do not become markers or legend entries', () => {
  const data = workspace()
  data.requests = [{ status: 'pending', title: 'PENDING_REQUEST' }]
  assert.doesNotMatch(mapLegend(planVisualPackage(context(), data, 'shared').maps[0]), /PENDING/)
})

test('all shared marker kinds support library links, legacy locations and no link', () => {
  const data = workspace()
  data.maps[0].markers = ['LOCATION', 'REFUGE', 'LANDMARK', 'DANGER'].flatMap(kind => [
    { visibility: 'chronicle_participants', kind, label: kind + ' library', resourceId: 'not-in-notebook' },
    { visibility: 'chronicle_participants', kind, label: kind + ' legacy', locationId: 'not-in-notebook' },
    { visibility: 'chronicle_participants', kind, label: kind + ' unlinked' },
  ])
  assert.equal(planVisualPackage(context(), data, 'shared').maps[0].markers.length, 12)
})
test('narrator package preserves permitted private map annotations', () => {
  const plan = planVisualPackage(context(), workspace(), 'narrator')
  assert.equal(plan.images.length, 3)
  assert.match(mapLegend(plan.maps[0]), /SECRET\\_MARKER|SECRET\\_AREA/)
})
test('maps linked to non-shared destinations and archived maps are excluded', () => {
  const data = workspace()
  data.maps.push({ ...data.maps[0], id: 'secret-map', name: 'SECRET_MAP', linkedResourceId: 'private' }, { ...data.maps[0], id: 'archived-map', status: 'archived' })
  const plan = planVisualPackage(context(), data, 'shared')
  assert.equal(plan.maps.length, 1)
  assert.doesNotMatch(JSON.stringify(plan.maps), /SECRET_MAP/)
})
test('duplicate image candidates do not create duplicate downloads', () => {
  const data = context(); data.imageCandidates.push(data.imageCandidates[0])
  assert.equal(planVisualPackage(data, workspace(), 'shared').images.length, 1)
})
test('asset limit fails rather than truncating', () => {
  const data = workspace(); data.maps = Array.from({ length: 61 }, () => data.maps[0])
  assert.throws(() => planVisualPackage(context(), data, 'shared'), /60 imágenes/)
})
test('legend uses numbered points and Z zones and escapes author content', () => {
  const data = workspace().maps[0]; data.markers[0].label = '<script>bad</script>'
  const legend = mapLegend(data)
  assert.match(legend, /- 1: &lt;script&gt;/)
  assert.match(legend, /- Z1: Zona/)
  assert.doesNotMatch(legend, /<script>/)
})
test('ZIP CRC32 matches standard vector', () => {
  assert.equal(crc32(new TextEncoder().encode('123456789')), 0xcbf43926)
})
test('ZIP contains correct local headers, payload, central directory and end', async () => {
  const bytes = new TextEncoder().encode('Contexto de Coruña')
  const zip = buildStoredZip([{ name: 'contexto.md', data: bytes }])
  const buffer = await zip.arrayBuffer(), view = new DataView(buffer)
  assert.equal(zip.type, 'application/zip')
  assert.equal(view.getUint32(0, true), 0x04034b50)
  assert.equal(view.getUint32(14, true), crc32(bytes))
  const nameLength = view.getUint16(26, true)
  assert.deepEqual(new Uint8Array(buffer, 30 + nameLength, bytes.length), bytes)
  const end = buffer.byteLength - 22
  assert.equal(view.getUint32(end, true), 0x06054b50)
  assert.equal(view.getUint16(end + 10, true), 1)
  assert.equal(view.getUint32(view.getUint32(end + 16, true), true), 0x02014b50)
})
test('ZIP rejects traversal, absolute paths, external names and duplicates', () => {
  for (const name of ['../secret', '/secret', 'a/../../secret', 'https://other/file', 'a\\file']) assert.throws(() => buildStoredZip([{ name, data: new Uint8Array() }]), /inválido/)
  assert.throws(() => buildStoredZip([{ name: 'a', data: new Uint8Array() }, { name: 'a', data: new Uint8Array() }]), /repetido/)
})
test('ZIP size limit is enforced', () => {
  assert.throws(() => buildStoredZip([{ name: 'a', data: new Uint8Array(50 * 1024 * 1024) }]), /50 MiB/)
})
test('PDF prompt does not promise unsupported capabilities or infer image facts', () => {
  assert.match(PDF_PACKAGE_INSTRUCTIONS, /Si puedes generar PDF/)
  assert.match(PDF_PACKAGE_INSTRUCTIONS, /No deduzcas identidad/)
  assert.match(PDF_PACKAGE_INSTRUCTIONS, /pide los archivos extraídos/)
})
