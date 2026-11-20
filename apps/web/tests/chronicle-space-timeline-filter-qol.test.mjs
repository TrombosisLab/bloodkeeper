import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const component = await readFile(new URL('../src/features/chronicle-space/components/ChronicleSpacePrototype.tsx', import.meta.url), 'utf8')
const styles = await readFile(new URL('../src/features/chronicle-space/components/chronicle-space-prototype.css', import.meta.url), 'utf8')
const start = component.indexOf('<div className="timeline-tools">')
const end = component.indexOf('<div className="timeline">', start)
assert.notEqual(start, -1)
assert.notEqual(end, -1)
const toolbar = component.slice(start, end)
const timeline = component.slice(end)

test('la vista inicial muestra estado y búsqueda, y agrupa los filtros de anotaciones', () => {
  assert.match(toolbar, /BUSCAR EN LA CRONOLOGÍA/)
  assert.match(toolbar, /\['ALL', 'Todas'\], \['PREPARATION', 'En preparación'\], \['COMPLETED', 'Completadas'\]/)
  assert.match(toolbar, /Más filtros/)
  assert.match(toolbar, /aria-expanded=\{timelineMoreFiltersOpen\}/)
  assert.match(toolbar, /\['WITH_NOTES', 'Con anotaciones'\], \['WITHOUT_NOTES', 'Sin anotaciones'\]/)
  assert.match(toolbar, /timelineHasActiveFilters \? <button className="timeline-clear-button"/)
  assert.match(toolbar, /className=\{'timeline-more-filters' \+ \(timelineFilter === 'WITH_NOTES'/)
})

test('la búsqueda vacía incluye una acción para limpiar y conservar filtros existentes', () => {
  assert.match(component, /const clearTimelineFilters = \(\) => \{ setTimelineSearch\(''\); setTimelineFilter\('ALL'\); setTimelineMoreFiltersOpen\(false\) \}/)
  assert.match(timeline, /No hay sesiones que coincidan con los filtros\./)
  assert.match(timeline, /Limpiar búsqueda y filtros/)
})

test('los filtros siguen siendo cómodos al tacto en móvil', () => {
  assert.match(styles, /\.timeline-tools__secondary \.timeline-more-filters,\.timeline-tools__secondary \.timeline-clear-button\{min-height:42px\}/)
  assert.match(styles, /timeline-tools__secondary \.timeline-filters button\{min-height:40px\}/)
})
