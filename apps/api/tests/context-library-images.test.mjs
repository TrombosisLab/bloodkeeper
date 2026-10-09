import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import ts from 'typescript'

const source = fs.readFileSync(new URL('../src/chronicles/presentation/chronicle-notebook.controller.ts', import.meta.url), 'utf8')
const start = source.indexOf('  async context(')
const end = source.indexOf('\n  @', start)
const code = ts.transpileModule('class Fixture {\n' + source.slice(start, end) + '\n}\nreturn Fixture;', { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText
const Fixture = new Function('actor', code)(request => request.user.id)

test('el contexto incluye imágenes de los cinco tipos de biblioteca con sus rutas reales', async () => {
  let query
  const kinds = ['npc', 'location', 'document', 'artifact', 'organization']
  const rows = kinds.map((kind, i) => ({ id: 'r' + i, kind, name: kind, summary: 'Resumen', metadata: {}, bindings: [{ visibility: 'chronicle_participants' }] }))
  const fixture = new Fixture()
  const empty = { findMany: async () => [] }
  fixture.access = async () => ({ narrator: false, db: {
    chronicleNpc: empty, chronicleLocation: empty, chronicleParticipant: empty, character: empty, characterPortrait: empty, chronicleSession: empty,
    libraryResource: { findMany: async args => { query = args; return rows } },
    chronicleAssetImage: { findMany: async () => rows.map(r => ({ entityId: r.id, assetType: r.kind === 'npc' ? 'NPC' : r.kind === 'location' ? 'LOCATION' : 'RESOURCE' })) },
  } })
  const result = await fixture.context({ user: { id: 'player' } }, 'chronicle')
  assert.deepEqual(query.where.kind.in, kinds)
  assert.equal(query.where.bindings.some.status, 'attached')
  assert.deepEqual(query.where.bindings.some.OR, [{ visibility: 'chronicle_participants' }, { visibility: 'selected_players', audiences: { some: { userId: 'player' } } }])
  assert.equal(result.imageCandidates.length, 5)
  assert.match(result.imageCandidates[0].imageUrl, /assets\/NPC\/r0\/image$/)
  assert.match(result.imageCandidates[1].imageUrl, /assets\/LOCATION\/r1\/image$/)
  assert.match(result.imageCandidates[2].imageUrl, /assets\/RESOURCE\/r2\/image$/)
  assert.equal(result.resources.length, 5)
  assert.ok(result.resources.every(r => !('narratorNotes' in r)))
})

test('las imágenes de PNJ de biblioteca exigen vinculación y visibilidad contextual', () => {
  const controller = fs.readFileSync(new URL('../src/chronicles/presentation/chronicle-asset-image.controller.ts', import.meta.url), 'utf8')
  assert.match(controller, /kind: 'npc', bindings: \{ some: \{ chronicleId, status: 'attached', \.\.\.resourceAccess \} \}/)
  assert.match(controller, /selected_players', audiences: \{ some: \{ userId \} \}/)
  assert.match(controller, /if \(!row\) throw new NotFoundException/)
})
