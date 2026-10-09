import assert from 'node:assert/strict'
import test from 'node:test'
import { buildRelationshipExport, RELATIONSHIP_EXPORT_INSTRUCTIONS } from '../src/features/chronicles/domain/chronicle-relationship-export.ts'

test('las instrucciones solicitan diagramas fieles separados por autor y con alternativa honesta', () => {
  for (const required of ['Un diagrama independiente por autor', 'nodo aislado', 'misma referencia', 'entre páginas', 'flechas en ambos extremos', 'leyenda', 'FALLECIDO', 'DESAPARECIDO', 'SVG editable', 'Mermaid', 'no afirmes haber creado un PDF', 'número de tarjetas y relaciones']) assert.ok(RELATIONSHIP_EXPORT_INSTRUCTIONS.includes(required), required)
})
test('las instrucciones cubren los catorce tipos de relación', () => {
  assert.equal((RELATIONSHIP_EXPORT_INSTRUCTIONS.match(/#[0-9a-f]{6}/g) || []).length, 14)
})
test('no añade puntuación duplicada ni altera puntos interiores', () => {
  const make = label => buildRelationshipExport({ name: 'Prueba' }, [{ ownerId: 'owner', owner: 'Carla', map: { cards: [{ id: 'a', title: 'Ana', summary: '' }, { id: 'b', title: 'Berta', summary: '' }], connections: [{ from: 'a', to: 'b', relationType: 'friendship', direction: 'both', label }] } }])
  assert.match(make('Ayuda mutua.'), /Amistad \/ confianza\. Ayuda mutua\.\n/)
  assert.ok(!make('Ayuda mutua.').includes('mutua..'))
  assert.match(make('¿Confianza?'), /¿Confianza\?\n/)
  assert.match(make('Primero habla. Después ayuda'), /Primero habla\. Después ayuda\.\n/)
})
