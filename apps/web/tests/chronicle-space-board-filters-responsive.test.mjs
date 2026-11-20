import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const styles = await readFile(new URL('../src/features/chronicle-space/components/chronicle-space-prototype.css', import.meta.url), 'utf8')

test('los filtros del selector bajan a tres columnas antes del desbordamiento de tablet', () => {
  assert.match(styles, /\.board-visibility-panel\{display:grid;grid-template-columns:minmax\(0,1fr\);gap:9px\}/)
  assert.match(styles, /@media\(max-width:1100px\)\{\.board-selection-tools\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)\}\.board-selection-reset\{grid-column:1\/-1;justify-self:start\}\}/)
  assert.doesNotMatch(styles, /@media\(max-width:980px\)\{\.board-selection-tools\{grid-template-columns:minmax\(180px,1fr\) repeat\(4,115px\)\}/)
})

test('móvil conserva su presentación en una columna y la lista sigue siendo adaptable', () => {
  assert.match(styles, /@media\(max-width:760px\)\{\.board-selection-tools\{grid-template-columns:1fr\}/)
  assert.match(styles, /\.board-selection-list\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/)
})
