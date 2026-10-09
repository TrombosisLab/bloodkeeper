import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
import vm from 'node:vm'
import test from 'node:test'
const code = await readFile(new URL('../src/chronicles/presentation/chronicle-map.controller.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, experimentalDecorators: true } }).outputText
class ApiError extends Error { constructor(body) { super(body.code); this.body = body } }
const decorator = () => () => {}
const common = new Proxy({}, { get: (_, name) => name.endsWith('Exception') ? ApiError : decorator })
const module = { exports: {} }
vm.runInNewContext(compiled, { module, exports: module.exports, require: name => name === '@nestjs/common' ? common : {}, console })
const Controller = module.exports.ChronicleMapController
const chronicleId = '11111111-1111-4111-8111-111111111111', mapId = '22222222-2222-4222-8222-222222222222', markerId = '33333333-3333-4333-8333-333333333333'
const request = { user: { id: markerId } }
function setup(narrator = true) {
  const writes = []
  const db = { chronicleMapMarker: { create: async args => { writes.push(args); return args.data }, updateMany: async args => { writes.push(args); return { count: 1 } }, findUniqueOrThrow: async () => ({ id: markerId }), deleteMany: async args => { writes.push(args); return { count: 1 } } }, chronicleMapArea: { deleteMany: async args => { writes.push(args); return { count: 1 } } } }
  const controller = new Controller(db)
  controller.access = async () => ({ db, narrator, userId: markerId })
  controller.mapOrThrow = async () => ({ id: mapId })
  controller.assertResource = async () => {}
  return { controller, writes }
}
test('crear y editar guardan texto, permiten borrarlo y no lo borran al mover', async () => {
  const { controller, writes } = setup()
  await controller.createMarker(request, chronicleId, mapId, { label: 'Morgue', x: .5, y: .5, description: '  Pista documentada  ' })
  assert.equal(writes[0].data.description, 'Pista documentada')
  await controller.updateMarker(request, chronicleId, mapId, markerId, { description: '' })
  assert.equal(writes[1].data.description, null)
  await controller.updateMarker(request, chronicleId, mapId, markerId, { x: .6 })
  assert.equal(Object.hasOwn(writes[2].data, 'description'), false)
  await assert.rejects(controller.updateMarker(request, chronicleId, mapId, markerId, { description: 'x'.repeat(2001) }))
  await assert.rejects(controller.createMarker(request, chronicleId, mapId, { label: 'Morgue', x: .5, y: .5, description: 42 }))
})
test('borrar marcador o zona se limita al mapa y no elimina recursos', async () => {
  const { controller, writes } = setup()
  assert.equal((await controller.deleteMarker(request, chronicleId, mapId, markerId)).deleted, true)
  assert.deepEqual(JSON.parse(JSON.stringify(writes[0].where)), { id: markerId, mapId })
  await controller.deleteArea(request, chronicleId, mapId, markerId)
  assert.deepEqual(JSON.parse(JSON.stringify(writes[1].where)), { id: markerId, mapId })
})
test('jugadores no pueden escribir ni eliminar', async () => {
  const { controller, writes } = setup(false)
  await assert.rejects(controller.createMarker(request, chronicleId, mapId, {}), /CHRONICLE_MAP_NARRATOR_ONLY/)
  await assert.rejects(controller.updateMarker(request, chronicleId, mapId, markerId, {}), /CHRONICLE_MAP_NARRATOR_ONLY/)
  await assert.rejects(controller.deleteMarker(request, chronicleId, mapId, markerId), /CHRONICLE_MAP_NARRATOR_ONLY/)
  await assert.rejects(controller.deleteArea(request, chronicleId, mapId, markerId), /CHRONICLE_MAP_NARRATOR_ONLY/)
  assert.equal(writes.length, 0)
})
test('la respuesta conserva descripciones y la aprobación copia la solicitud', () => {
  assert.match(code, /description: marker.description \?\? null/)
  assert.match(code, /description: row.description/)
})
test('las descripciones nunca amplían la visibilidad del marcador', () => {
  const { controller } = setup()
  const row = { id: mapId, markers: [
    { id: markerId, label: 'Visible', description: 'Descripción pública', visibility: 'chronicle_participants' },
    { id: 'hidden', label: 'Secreto', description: 'No exportar', visibility: 'narrator_only' },
    { id: 'restricted', label: 'Restringido', description: 'No exportar tampoco', visibility: 'chronicle_participants', resource: { bindings: [] } },
  ] }
  const visible = controller.presentMap(row, chronicleId, false, markerId).markers
  assert.equal(visible.length, 1)
  assert.equal(visible[0].description, 'Descripción pública')
  assert.equal(controller.presentMap(row, chronicleId, true, markerId).markers.length, 3)
})
