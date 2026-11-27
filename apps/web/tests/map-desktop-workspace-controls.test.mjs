import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const component = readFileSync('src/features/map/components/ChronicleMapPage.tsx', 'utf8')
const css = readFileSync('src/features/map/components/chronicle-map.css', 'utf8')
const markerAt = css.indexOf('BLOODKEEPER_MAP_DESKTOP_COLLAPSE_DRAG_V1')
const desktopRules = css.slice(markerAt)

test('el selector de mapas puede plegarse solo en escritorio', () => {
  assert.notEqual(markerAt, -1)
  assert.match(component, /aria-label=\{mapTreeCollapsed \? 'Mostrar lista de mapas' : 'Plegar lista de mapas'\}/)
  assert.match(component, /is-tree-collapsed/)
  assert.match(component, /is-collapsed/)
  assert.match(desktopRules, /@media\s*\(min-width:\s*901px\)/)
  assert.match(desktopRules, /grid-template-columns:\s*3\.25rem minmax\(0, 1fr\)/)
})

test('las fichas de marcador y zona se arrastran con límites de ventana', () => {
  assert.equal((component.match(/onPointerDown=\{beginInspectorDrag\}/g) ?? []).length, 2)
  assert.equal((component.match(/onPointerMove=\{moveInspectorDrag\}/g) ?? []).length, 2)
  assert.match(component, /window\.innerWidth - rect\.width - 12/)
  assert.match(component, /window\.innerHeight - rect\.height - 12/)
})

test('el cambio a vista móvil restaura el árbol y la posición original', () => {
  assert.match(component, /matchMedia\('\(max-width: 900px\)'\)/)
  assert.match(component, /setMapTreeCollapsed\(false\); setInspectorPosition\(null\)/)
  assert.doesNotMatch(desktopRules, /@media\s*\(max-width/)
})

test('no se asigna zoom a la rueda del ratón', () => {
  assert.doesNotMatch(component, /onWheel=/)
})
