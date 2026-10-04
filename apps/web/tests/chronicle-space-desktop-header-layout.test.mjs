import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
const styles = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8')
const component = await readFile(new URL('../src/features/chronicle-space/components/ChronicleSpacePrototype.tsx', import.meta.url), 'utf8')
const boardStyles = await readFile(new URL('../src/features/chronicle-space/components/chronicle-space-prototype.css', import.meta.url), 'utf8')
test('La cabecera de Investigación conserva la altura común en escritorio ancho', () => {
  assert.match(styles, /INVESTIGATION_DESKTOP_HEADER_V3[\s\S]*height: 162px !important[\s\S]*position: absolute !important[\s\S]*bottom: 8px !important/)
})
test('La instrucción de la pizarra queda fuera del lienzo y antes de las tarjetas', () => {
  const hintIndex = component.indexOf('<div className="board-connect-hint">')
  const boardIndex = component.indexOf("<div className={'space-board'")
  assert.notEqual(hintIndex, -1)
  assert.notEqual(boardIndex, -1)
  assert.ok(hintIndex < boardIndex)
  assert.match(boardStyles, /\.board-connect-hint\{position:relative[^}]*pointer-events:auto\}/)
})
