import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const component = await readFile(new URL('../src/features/chronicle-space/components/ChronicleSpacePrototype.tsx', import.meta.url), 'utf8')
const styles = await readFile(new URL('../src/features/chronicle-space/components/chronicle-space-prototype.css', import.meta.url), 'utf8')

test('la selección de la Pizarra aclara que consultar el Archivo no incorpora fichas', () => {
  const panel = component.match(/\{boardManageOpen \? <div className="board-visibility-panel"[\s\S]*?<\/div> : null\}/)?.[0]
  assert.ok(panel, 'debe existir el panel de selección')
  assert.match(panel, /Las personas y los lugares aparecen aquí cuando están incorporados a esta crónica/)
  assert.match(panel, /El Archivo permite consultarlos, pero no los añade automáticamente a la Pizarra/)
})

test('la ayuda es breve, adaptable y no altera las acciones del panel', () => {
  assert.match(styles, /\.board-selection-help\{grid-column:1\/-1;[\s\S]*font-size:12px;line-height:1\.5\}/)
  assert.match(component, /<div className="board-selection-summary">Mostrando[\s\S]*?<p className="board-selection-help">[\s\S]*?<div className="board-selection-list">/)
})
