import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'
import { buildRelationshipExport } from '../src/features/chronicles/domain/chronicle-relationship-export.ts'
import { loadRelationshipExport } from '../src/features/chronicles/infrastructure/chronicle-relationship-export.api.ts'

const id = '11111111-1111-4111-8111-111111111111'
const map = { pages: [{ id: 'p1', title: 'Inicio' }, { id: 'p2', title: 'Continuación' }], cards: [
  { id: 'c1', title: 'Ana', summary: 'Versión compartida', narratorNote: 'SECRETO', sourceId: 'ORIGEN_PRIVADO', pageId: 'p1', appearances: [{ pageId: 'p2', sourcePageId: 'p1', x: 0, y: 0 }], personStatus: 'missing' },
  { id: 'c2', title: 'Berta', summary: '', narratorNote: '', personStatus: 'deceased' },
], connections: [{ id: 'e1', from: 'c1', to: 'c2', relationType: 'debt', direction: 'both', label: 'Un favor pendiente' }] }

test('conserva autor, páginas, estados y dirección sin filtrar notas o procedencia privadas', () => {
  const text = buildRelationshipExport({ name: 'Prueba' }, [{ ownerId: id, owner: 'Carla', map }])
  assert.match(text, /Mapa de Carla/)
  assert.match(text, /Desaparecido/); assert.match(text, /Fallecido/)
  assert.match(text, /Continuación: Ana \[M1-T1\]/)
  assert.match(text, /Ana \[M1-T1\] ↔ Berta \[M1-T2\]: Deuda \/ favor. Un favor pendiente/)
  for (const value of ['SECRETO', 'ORIGEN_PRIVADO', id, 'c1', 'e1']) assert.ok(!text.includes(value))
})
test('no fusiona versiones de autores y rechaza relaciones rotas', () => {
  const text = buildRelationshipExport({ name: 'Prueba' }, [{ ownerId: id, owner: 'Carla', map }, { ownerId: 'other', owner: 'Chuela', map }])
  assert.match(text, /Mapa de Chuela \[M2\]/)
  assert.match(text, /Ana \[M2-T1\]/)
  assert.throws(() => buildRelationshipExport({ name: 'Prueba' }, [{ ownerId: id, owner: 'Carla', map: { ...map, cards: [] } }]), /inexistente/)
  assert.match(buildRelationshipExport({ name: 'Prueba' }, []), /No hay mapas/)
})
test('consulta únicamente las rutas compartidas y cancela ante un fallo de permisos', async () => {
  const original = globalThis.fetch
  const calls = []
  try {
    globalThis.fetch = async url => { calls.push(url); return new Response(JSON.stringify(calls.length === 1 ? [{ ownerId: id, name: 'Carla' }] : { ownerId: id, map }), { headers: { 'content-type': 'application/json' } }) }
    const result = await loadRelationshipExport('chronicle', id, new AbortController().signal)
    assert.equal(result.maps.length, 1)
    assert.deepEqual(calls, ['/api/chronicles/chronicle/relationships/shared', '/api/chronicles/chronicle/relationships/shared/' + id])
    globalThis.fetch = async () => new Response('denied', { status: 403 })
    await assert.rejects(loadRelationshipExport('chronicle', 'all', new AbortController().signal), /parcial/)
  } finally { globalThis.fetch = original }
})
test('el selector se integra sin añadir botones a la cabecera', () => {
  const component = fs.readFileSync(new URL('../src/features/chronicles/components/ChronicleContextExport.tsx', import.meta.url), 'utf8')
  assert.match(component, /Qué quieres exportar/)
  assert.match(component, /ChronicleRelationshipExport chronicle=\{chronicle\}/)
})
test('todos los mapas se consultan por separado y una selección desconocida no abre rutas arbitrarias', async () => {
  const original = globalThis.fetch
  const other = '22222222-2222-4222-8222-222222222222'
  const calls = []
  try {
    globalThis.fetch = async url => {
      calls.push(url)
      const data = url.endsWith('/shared') ? [{ ownerId: id, name: 'Carla' }, { ownerId: other, name: 'Chuela' }] : { ownerId: url.split('/').at(-1), map }
      return new Response(JSON.stringify(data))
    }
    assert.equal((await loadRelationshipExport('chronicle', 'all', new AbortController().signal)).maps.length, 2)
    assert.equal(calls.length, 3)
    calls.length = 0
    await assert.rejects(loadRelationshipExport('chronicle', '../me', new AbortController().signal), /ya no está compartido/)
    assert.equal(calls.length, 1)
    const controller = new AbortController(); controller.abort()
    await assert.rejects(loadRelationshipExport('chronicle', 'all', controller.signal))
    assert.equal(calls.length, 1)
  } finally { globalThis.fetch = original }
})
