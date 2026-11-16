import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const component = readFileSync(new URL('../src/features/chronicles/components/ChronicleResourceCatalog.tsx', import.meta.url), 'utf8')
const list = component.split('<aside className="chronicle-resource-catalog__browser"')[1]?.split('</aside>')[0] ?? ''
const detail = component.split('<main className="chronicle-resource-catalog__detail">')[1] ?? ''

test('resource list shows name and status without repeating narrative description', () => {
  assert.match(list, /<strong>\{item\.name\}<\/strong>/)
  assert.match(list, /item\.status === 'active' \? 'Activo' : 'Archivado'/)
  assert.doesNotMatch(list, /item\.summary/)
})

test('selected resource keeps its full description in the detail panel', () => {
  assert.match(detail, /<h4>Descripción narrativa<\/h4><p>\{selected\.summary \?\? 'Sin resumen\.'\}<\/p>/)
})
