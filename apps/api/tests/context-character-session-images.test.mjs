import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import ts from 'typescript'

const source = fs.readFileSync(new URL('../src/chronicles/presentation/chronicle-notebook.controller.ts', import.meta.url), 'utf8')
const start = source.indexOf('  async context(')
const end = source.indexOf('\n  @', start)
const code = ts.transpileModule('class Fixture {\n' + source.slice(start, end) + '\n}\nreturn Fixture;', { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText
const Fixture = new Function('actor', code)(request => request.user.id)

test('retratos de PJ activos y portadas de sesiones realizadas conservan sus referencias', async () => {
  const empty = { findMany: async () => [] }
  let sessionQuery, portraitQuery
  const fixture = new Fixture()
  fixture.access = async () => ({ narrator: false, db: {
    chronicleNpc: empty, chronicleLocation: empty, libraryResource: empty, chronicleParticipant: empty,
    character: { findMany: async () => [{ id: 'pj1', ownerId: 'player', status: 'ACTIVE', identity: { name: 'Inés' } }] },
    characterPortrait: { findMany: async args => { portraitQuery = args; return [{ characterId: 'pj1' }, { characterId: 'unlinked' }] } },
    chronicleSession: { findMany: async args => { sessionQuery = args; return [{ id: 's1', title: 'Primera noche', sessionNumber: 1, realDate: new Date('2026-09-05T19:00:00Z') }] } },
    chronicleAssetImage: { findMany: async args => args.where.assetType === 'SESSION' ? [{ entityId: 's1' }, { entityId: 'unrelated' }] : [] },
  } })
  const result = await fixture.context({ user: { id: 'player' } }, 'chronicle')
  assert.deepEqual(sessionQuery.where, { chronicleId: 'chronicle', status: { in: ['COMPLETED', 'ARCHIVED'] } })
  assert.deepEqual(portraitQuery.where.characterId.in, ['pj1'])
  assert.equal(result.imageCandidates.length, 2)
  assert.deepEqual(result.imageCandidates.map(r => r.targetType), ['CHARACTER', 'SESSION'])
  assert.match(result.imageCandidates[0].imageUrl, /\/chronicle\/assets\/CHARACTER\/pj1\/image$/)
  assert.match(result.imageCandidates[1].name, /Primera noche · 2026-09-05/)
  assert.deepEqual(Object.keys(sessionQuery.select).sort(), ['id', 'realDate', 'sessionNumber', 'title'])
})

test('la lectura del retrato exige personaje activo de la crónica; la escritura sigue reservada al propietario', () => {
  const controller = fs.readFileSync(new URL('../src/chronicles/presentation/chronicle-asset-image.controller.ts', import.meta.url), 'utf8')
  assert.match(controller, /await this\.access\(request, chronicle\)/)
  assert.match(controller, /if \(rawType === 'CHARACTER'\)/)
  assert.match(controller, /where: \{ id: entityId, chronicleId, status: 'ACTIVE' \}/)
  assert.match(controller, /if \(!character\) throw new NotFoundException/)
  assert.doesNotMatch(controller.match(/function assetType[^\n]+/)[0], /CHARACTER/)
})
